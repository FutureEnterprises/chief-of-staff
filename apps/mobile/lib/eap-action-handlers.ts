/**
 * Per-actuator EAP action handlers.
 *
 * The notification receive listener in apps/mobile/app/(app)/_layout.tsx
 * routes pushes with `data.type === 'eap_action'` to handleEapAction(),
 * which dispatches to the matching per-actuator function below. Each
 * handler delegates to the already-shipped coyl-* native module — we
 * deliberately do not re-implement haptic / voice / live-activity
 * logic here.
 *
 * Handlers throw on failure; eap-coordinator.executeAction catches and
 * reports the failure to /api/eap/v1/action/outcome. The thrown
 * message becomes the outcomeReason in the EAPAuditEntry — keep them
 * concise + machine-parseable.
 *
 * Actuator coverage on iOS (per EAP spec § device coordinator table —
 * ~60% sanctioned actuator coverage; the rest require user gestures
 * Apple does not let third parties initiate):
 *
 *    haptic            → coyl-watch (wrist) || expo-haptics (phone)
 *    push_notification → already handled by iOS — handler is a no-op
 *    voice_tts         → coyl-voice
 *    live_activity     → coyl-live-activity
 *    open_url          → Linking.openURL (Expo / RN built-in)
 *    open_app_intent   → coyl-eap-coordinator.requestAppIntent
 */
import { Linking } from 'react-native'
import * as Haptics from 'expo-haptics'

import CoylEAPCoordinator from '../modules/coyl-eap-coordinator'
import CoylLiveActivity from '../modules/coyl-live-activity'
import CoylVoice from '../modules/coyl-voice'
import CoylWatch from '../modules/coyl-watch'

/**
 * Payload extracted from the EAP action push notification.
 * Mirrors the shape the server posts to APNs:
 *   { type: 'eap_action', actuator: '...', params: {...}, executionToken: '...' }
 *
 * `executionToken` is handled at the coordinator level (it's an
 * outcome-reporting concern, not actuator-dispatch), so the handler
 * layer only sees actuator + params.
 */
export interface EAPActionPayload {
  actuator: string
  params: Record<string, unknown>
}

/**
 * Type guards for each handler's params. We accept unknowns and
 * narrow defensively — the server may evolve the param shapes
 * faster than the iOS client can ship, so we want the handler to
 * fall back gracefully (or throw with a clear reason) rather than
 * crash on a missing key.
 */
function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/**
 * Top-level dispatcher. Picks the right per-actuator function based
 * on the actuator string from the push payload.
 *
 * Resolves on success, throws on any handler-side failure. The
 * coordinator wraps every call in a try/catch so we propagate
 * exceptions freely here — they become the outcomeReason in the
 * audit entry.
 */
export async function handleEapAction(payload: EAPActionPayload): Promise<void> {
  switch (payload.actuator) {
    case 'haptic':
      return handleHaptic(payload.params)
    case 'push_notification':
      return handlePushNotification(payload.params)
    case 'voice_tts':
      return handleVoiceTTS(payload.params)
    case 'live_activity':
      return handleLiveActivity(payload.params)
    case 'open_url':
      return handleOpenURL(payload.params)
    case 'open_app_intent':
      return handleOpenAppIntent(payload.params)
    default:
      throw new Error(`unknown_actuator:${payload.actuator}`)
  }
}

// ----------------------------------------------------------------- haptic

/**
 * Haptic actuator.
 *
 * params:
 *   pattern?:   'double-tap' | 'single' | 'warning' | 'success'   (default 'single')
 *   intensity?: 'light' | 'medium' | 'heavy'                       (default 'medium')
 *   preferWatch?: boolean   (default true — wrist haptic is the
 *                            primary surface; phone is fallback)
 *
 * If a Watch is paired AND reachable AND preferWatch is true, we
 * fire the wrist haptic through coyl-watch.sendIntervention. Otherwise
 * we fall back to expo-haptics on the phone.
 *
 * Throws only if BOTH paths fail. A no-watch phone is a successful
 * haptic (the phone vibrated), so we don't surface that as a failure
 * to the EAP server.
 */
async function handleHaptic(params: Record<string, unknown>): Promise<void> {
  const pattern = asString(params.pattern, 'single')
  const intensity = asString(params.intensity, 'medium')
  const preferWatch = params.preferWatch !== false  // default true

  // Try watch first if requested. The Watch module returns true if
  // the message was queued, false if no watch is paired / reachable.
  if (preferWatch) {
    try {
      const headline = asString(params.headline, 'COYL')
      const subhead = asString(params.subhead, '')
      // Map EAP pattern → CoylInterventionMode. We don't have a
      // first-class double-tap mode on the watch yet; the modes we
      // ship are high-arousal / low-arousal / post-slip, which map
      // to "firm / gentle / gentle" voice tiers. Pick the closest
      // arousal match for the haptic pattern.
      const mode =
        intensity === 'heavy'
          ? 'interrupt-high-arousal'
          : intensity === 'light'
            ? 'interrupt-low-arousal'
            : 'interrupt-high-arousal'
      const queued = await CoylWatch.sendIntervention(mode, headline, subhead)
      if (queued) return
      // Else fall through to phone haptic.
    } catch {
      // Fall through to phone haptic.
    }
  }

  // Phone-side haptic via expo-haptics. iOS UIImpactFeedbackGenerator
  // styles map to Light / Medium / Heavy. For 'warning' / 'success'
  // patterns we use the notification feedback generator instead.
  try {
    if (pattern === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return
    }
    if (pattern === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return
    }
    const style =
      intensity === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
    await Haptics.impactAsync(style)
    if (pattern === 'double-tap') {
      // Two-tap pattern: fire twice with a short gap. The wrist
      // module gets a proper double-tap; on phone we synthesize.
      await new Promise((r) => setTimeout(r, 90))
      await Haptics.impactAsync(style)
    }
  } catch (err) {
    throw new Error(
      `haptic_failed:${err instanceof Error ? err.message : 'unknown'}`,
    )
  }
}

// -------------------------------------------------------- push_notification

/**
 * Push notification actuator.
 *
 * This is a no-op on the device side: by the time we're routing the
 * `eap_action` push to handleEapAction(), the notification has
 * already been delivered + rendered by iOS. The server emits the
 * push directly via APNs; the only reason this case exists is so
 * the device can REPORT successful delivery to action/outcome
 * (which executeAction() does upstream).
 *
 * If the server ever wants us to render a SEPARATE local
 * notification in response to the eap_action push, that goes here
 * — we'd call Notifications.scheduleNotificationAsync from the
 * existing notifications layer.
 */
async function handlePushNotification(_params: Record<string, unknown>): Promise<void> {
  // Intentional no-op. The push has already fired by definition;
  // reporting 'executed' is the right outcome.
  return
}

// --------------------------------------------------------------- voice_tts

/**
 * Voice TTS actuator.
 *
 * params:
 *   text:  string     (required)
 *   voice?: 'gentle' | 'firm' | 'urgent'   (default 'gentle')
 *
 * Routes through coyl-voice. If the device has no usable voice
 * (TTS disabled, no engine installed), we silently succeed — the
 * push notification already conveyed the headline + subhead, the
 * voice is an augmentation not a critical path.
 */
async function handleVoiceTTS(params: Record<string, unknown>): Promise<void> {
  const text = asString(params.text, '')
  if (!text.trim()) {
    throw new Error('voice_tts_missing_text')
  }
  const voice = asString(params.voice, 'gentle') as 'gentle' | 'firm' | 'urgent'
  if (!CoylVoice.isVoiceAvailable()) {
    // Silent success — no voices installed. Already covered by push.
    return
  }
  try {
    await CoylVoice.speak(text, voice)
  } catch (err) {
    throw new Error(
      `voice_tts_failed:${err instanceof Error ? err.message : 'unknown'}`,
    )
  }
}

// ------------------------------------------------------------ live_activity

/**
 * Live Activity actuator.
 *
 * params:
 *   interruptId:      string   (required — the ProductivityEvent id)
 *   archetype:        string
 *   headline:         string
 *   subhead:          string
 *   timeRemainingSec: number
 *
 * Materialises a lock-screen Live Activity through the existing
 * coyl-live-activity bridge. The bridge handles the iOS 16.1+
 * version gate + the user's Settings preference; if Live Activities
 * are disabled we silently succeed (the push notification covers
 * the interrupt).
 */
async function handleLiveActivity(params: Record<string, unknown>): Promise<void> {
  if (!CoylLiveActivity.isSupported()) {
    // Live Activities disabled at OS / Settings level. The push
    // notification already showed; treat as success.
    return
  }
  const interruptId = asString(params.interruptId, '')
  if (!interruptId) {
    throw new Error('live_activity_missing_interrupt_id')
  }
  try {
    await CoylLiveActivity.start({
      interruptId,
      archetype: asString(params.archetype, 'eap'),
      startedAtIso: new Date().toISOString(),
      headline: asString(params.headline, 'COYL'),
      subhead: asString(params.subhead, ''),
      timeRemainingSec: asNumber(params.timeRemainingSec, 60),
    })
  } catch (err) {
    throw new Error(
      `live_activity_failed:${err instanceof Error ? err.message : 'unknown'}`,
    )
  }
}

// --------------------------------------------------------------- open_url

/**
 * Open URL actuator.
 *
 * params:
 *   url: string   (required — must be https: or a registered scheme)
 *
 * iOS will reject openURL for http:// (universal apps must use https)
 * and for custom schemes that aren't in LSApplicationQueriesSchemes.
 * We let Linking.openURL surface the rejection — the caller (server)
 * has the URL and is responsible for using a scheme the OS allows.
 */
async function handleOpenURL(params: Record<string, unknown>): Promise<void> {
  const url = asString(params.url, '')
  if (!url) {
    throw new Error('open_url_missing_url')
  }
  // Refuse javascript: and data: — those are not legitimate EAP
  // destinations and are common phishing surfaces. The server-side
  // gate stack should also block these, this is defense in depth.
  const lower = url.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    throw new Error('open_url_unsafe_scheme')
  }
  try {
    const canOpen = await Linking.canOpenURL(url)
    if (!canOpen) {
      throw new Error('open_url_unsupported_scheme')
    }
    await Linking.openURL(url)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('open_url_')) {
      throw err
    }
    throw new Error(
      `open_url_failed:${err instanceof Error ? err.message : 'unknown'}`,
    )
  }
}

// ------------------------------------------------------- open_app_intent

/**
 * Open App Intent actuator.
 *
 * params:
 *   intentName: string                           (required)
 *   intentParams?: Record<string, unknown>       (forwarded to the intent)
 *
 * Routes through coyl-eap-coordinator.requestAppIntent which posts
 * an NSUserActivity into the active scene. The receiving App Intent
 * (defined in apps/mobile/ios/COYLWidget/COYLInterruptIntents.swift
 * or any other intent registered on this build) reads userInfo and
 * acts.
 *
 * Falls back to throwing if no scene is available — the JS layer
 * can then retry after waking the app via a push notification.
 */
async function handleOpenAppIntent(params: Record<string, unknown>): Promise<void> {
  const intentName = asString(params.intentName, '')
  if (!intentName) {
    throw new Error('open_app_intent_missing_name')
  }
  const intentParams =
    typeof params.intentParams === 'object' &&
    params.intentParams !== null &&
    !Array.isArray(params.intentParams)
      ? (params.intentParams as Record<string, unknown>)
      : {}
  try {
    const dispatched = await CoylEAPCoordinator.requestAppIntent(intentName, intentParams)
    if (!dispatched) {
      throw new Error('open_app_intent_no_scene')
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('open_app_intent_')) {
      throw err
    }
    throw new Error(
      `open_app_intent_failed:${err instanceof Error ? err.message : 'unknown'}`,
    )
  }
}
