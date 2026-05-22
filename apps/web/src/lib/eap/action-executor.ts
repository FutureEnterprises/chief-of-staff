/**
 * EAP Action Executor.
 *
 * Once an ActionRequest has cleared the coordinator gates (PanicState,
 * ScopeGrant, rate-limit, dedup, quiet hours) and been minted with an
 * executionToken + willExecuteAt, this module is the thing that
 * actually pushes the actuator command out to the device.
 *
 * Delivery wires, by actuator:
 *
 *   • push_notification        → Expo Push API (exp.host)
 *   • haptic                   → Expo Push w/ categoryId=COYL_INTERRUPT
 *                                + data.actuator='haptic'; the iOS
 *                                bridge reads data.actuator and fires
 *                                CoreHaptics with the supplied pattern
 *   • voice_tts                → Expo Push w/ data.actuator='voice';
 *                                bridge speaks via AVSpeechSynthesizer
 *                                (or Android TextToSpeech)
 *   • live_activity            → APNs Live Activity push via the
 *                                shared lib/live-activity-push.ts;
 *                                requires the user to have an active
 *                                LiveActivityRegistration row, else we
 *                                fall through to a plain Expo push
 *   • open_url                 → Expo Push w/ data.actuator='open_url'
 *                                + data.url; bridge does
 *                                Linking.openURL on tap
 *   • open_app_intent          → Expo Push w/ data.actuator
 *                                ='open_app_intent' + data.intentName
 *                                + data.intentParams (passed straight
 *                                through to App Intents on iOS, or
 *                                the equivalent Tasker action on
 *                                Android)
 *   • system_dim_screen        → Expo Push w/ data.actuator
 *                                ='system_dim_screen' + data.params;
 *                                macOS bridge executes the AppleScript
 *                                / Shortcuts shim, iOS no-ops (not
 *                                sanctioned)
 *   • do_not_disturb_toggle    → same — bridge-side execution
 *   • complication_update      → Expo Push targeted at watchOS bridge
 *   • <anything else>          → generic Expo Push w/ data.actuator =
 *                                the actuator name + the params blob;
 *                                bridges that don't know the actuator
 *                                ignore the payload silently
 *
 * The executor is fire-and-forget from the coordinator's perspective.
 * It mutates the ActionRequest row in two terminal ways:
 *
 *   • on successful dispatch  → executedAt = now()
 *   • on delivery failure     → outcome = 'failed', outcomeReason =
 *                               <short tag>, outcomeAt = now()
 *
 * The DEVICE then later POSTs to /api/eap/v1/action/outcome with the
 * USER-OBSERVABLE outcome (executed / userInteracted / userTag). The
 * dispatch step here only records whether the network handoff
 * succeeded, not whether the user actually felt the haptic.
 *
 * Errors are swallowed: this is invoked from a route handler as
 * `executeAction(...).catch(...)` and must never throw an unhandled
 * rejection that would terminate the request. All failure modes
 * surface as outcome='failed' on the ActionRequest row.
 */

import { prisma } from '@repo/database'
import type { ActionRequest, Device } from '@repo/database'
import {
  isLiveActivityTokenDead,
  pushLiveActivityUpdate,
} from '@/lib/live-activity-push'

/**
 * Dispatch a single ActionRequest to the user's device. Caller has
 * already gated on scope + panic + rate limit and minted the
 * executionToken. This function only handles the network handoff to
 * the device coordinator on the user's hardware.
 */
export async function executeAction(
  actionRequest: ActionRequest,
  device: Device,
): Promise<void> {
  // Type-safe peek at the JSON params blob the LLM sent. We never
  // trust the shape past `Record<string, unknown>` here — the device
  // bridge is responsible for its own validation.
  const params =
    actionRequest.paramsJson &&
    typeof actionRequest.paramsJson === 'object' &&
    !Array.isArray(actionRequest.paramsJson)
      ? (actionRequest.paramsJson as Record<string, unknown>)
      : {}

  try {
    // Live Activity gets its own APNs lane. We try it first when the
    // actuator is live_activity; if there's no active registration we
    // fall through to a regular push (which will still wake the app).
    if (actionRequest.actuator === 'live_activity') {
      const reg = await prisma.liveActivityRegistration.findFirst({
        where: { userId: actionRequest.userId, active: true },
        orderBy: { startedAt: 'desc' },
        select: { id: true, activityId: true, pushToken: true },
      })
      if (reg?.pushToken) {
        const result = await pushLiveActivityUpdate({
          pushToken: reg.pushToken,
          activityId: reg.activityId,
          contentState: {
            headline:
              typeof params.headline === 'string' ? params.headline : undefined,
            subhead:
              typeof params.subhead === 'string' ? params.subhead : undefined,
            timeRemainingSec:
              typeof params.timeRemainingSec === 'number'
                ? params.timeRemainingSec
                : undefined,
            // pass everything else straight through so widget templates
            // can read whatever bespoke field the LLM supplied
            ...params,
          },
          event: 'update',
          staleAfterSec: 60 * 60,
        })
        if (result.ok) {
          await markExecuted(actionRequest.id)
          return
        }
        // APNs token went dead — flip the registration inactive so
        // future actions don't keep retrying it, then fall through to
        // Expo push as a fallback wire.
        if (isLiveActivityTokenDead(result)) {
          await prisma.liveActivityRegistration
            .update({
              where: { id: reg.id },
              data: { active: false, endedAt: new Date() },
            })
            .catch(() => {})
        }
        // continue to Expo push fallback
      }
    }

    if (!device.pushToken) {
      await markFailed(actionRequest.id, 'no_push_token')
      return
    }

    // Build the Expo push payload. The data envelope is what the
    // bridge actually reads — the title/body are the lock-screen
    // visible text, and the data fields are the bridge instructions.
    const data: Record<string, unknown> = {
      actuator: actionRequest.actuator,
      actionRequestId: actionRequest.id,
      executionToken: actionRequest.executionToken,
      scope: actionRequest.scopeRequested,
      params,
    }

    // Per-actuator tweaks. Each branch picks a sensible default
    // title/body so the lock-screen surface is non-empty even if the
    // LLM didn't supply one; bridges that consume the payload via
    // `data` ignore these.
    let title = 'COYL'
    let body = actionRequest.reasoning
    let categoryId: string | undefined
    let sound: string | undefined = 'default'
    let priority: 'default' | 'high' = 'default'

    switch (actionRequest.actuator) {
      case 'haptic':
        // No visible lock-screen surface; bridge intercepts and only
        // fires CoreHaptics. We still set high priority so iOS doesn't
        // delay the wake.
        categoryId = 'COYL_INTERRUPT'
        priority = 'high'
        sound = undefined
        title = ''
        body = ''
        break

      case 'voice_tts':
        priority = 'high'
        data.text = typeof params.text === 'string' ? params.text : undefined
        title = ''
        body = typeof params.text === 'string' ? params.text : actionRequest.reasoning
        break

      case 'open_url':
        data.url = typeof params.url === 'string' ? params.url : undefined
        title =
          typeof params.title === 'string'
            ? params.title
            : 'COYL'
        body =
          typeof params.body === 'string'
            ? params.body
            : actionRequest.reasoning
        break

      case 'open_app_intent':
        data.intentName =
          typeof params.intentName === 'string' ? params.intentName : undefined
        data.intentParams =
          params.intentParams && typeof params.intentParams === 'object'
            ? params.intentParams
            : undefined
        title = 'COYL'
        body = actionRequest.reasoning
        break

      case 'push_notification':
        priority = 'high'
        categoryId = 'COYL_INTERRUPT'
        title =
          typeof params.title === 'string'
            ? params.title
            : 'COYL'
        body =
          typeof params.body === 'string'
            ? params.body
            : actionRequest.reasoning
        break

      case 'live_activity':
        // We only get here if the APNs Live Activity path above
        // didn't dispatch (no active registration). Fall back to a
        // plain visible push that wakes the app, which then has a
        // chance to register an activity for next time.
        priority = 'high'
        title =
          typeof params.headline === 'string'
            ? params.headline
            : 'COYL'
        body =
          typeof params.subhead === 'string'
            ? params.subhead
            : actionRequest.reasoning
        break

      case 'system_dim_screen':
      case 'do_not_disturb_toggle':
      case 'complication_update':
      default:
        // Generic actuator: bridge handles by reading data.actuator.
        // No visible lock-screen surface needed for system-side
        // actuators, but keep a body for actuators the user might
        // see (e.g. complication_update on watchOS does surface a
        // small visible nudge).
        title = ''
        body = ''
        priority = 'high'
        sound = undefined
        break
    }

    // Single Expo push send. Same gateway and headers the
    // danger-window-interrupt cron uses — Expo handles APNs + FCM fan-out.
    const expoPayload: Record<string, unknown> = {
      to: device.pushToken,
      title,
      body,
      data,
      priority,
      channelId: 'coyl-interrupts',
    }
    if (sound) expoPayload.sound = sound
    if (categoryId) expoPayload.categoryId = categoryId

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(expoPayload),
    })

    if (!res.ok) {
      await markFailed(actionRequest.id, `expo_http_${res.status}`)
      return
    }

    // Expo can return a 200 with a per-ticket error inside the body
    // (e.g. DeviceNotRegistered). Treat that as a failed dispatch
    // even though the HTTP layer was 200.
    let ticketError: string | undefined
    try {
      const ticket = (await res.json()) as {
        data?: { status?: string; message?: string } | Array<{ status?: string; message?: string }>
      }
      const first = Array.isArray(ticket.data) ? ticket.data[0] : ticket.data
      if (first && first.status === 'error') {
        ticketError = first.message ?? 'expo_ticket_error'
      }
    } catch {
      // empty body or non-JSON — treat as success
    }

    if (ticketError) {
      await markFailed(actionRequest.id, ticketError)
      return
    }

    await markExecuted(actionRequest.id)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown_error'
    await markFailed(actionRequest.id, reason).catch(() => {})
  }
}

async function markExecuted(actionRequestId: string): Promise<void> {
  await prisma.actionRequest
    .update({
      where: { id: actionRequestId },
      data: { executedAt: new Date() },
    })
    .catch(() => {})
}

async function markFailed(
  actionRequestId: string,
  reason: string,
): Promise<void> {
  const now = new Date()
  await prisma.actionRequest
    .update({
      where: { id: actionRequestId },
      data: {
        outcome: 'failed',
        outcomeReason: reason,
        outcomeAt: now,
      },
    })
    .catch(() => {})
}
