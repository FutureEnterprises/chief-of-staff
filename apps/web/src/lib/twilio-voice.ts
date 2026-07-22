/**
 * Twilio Programmable Voice — the Precision Interrupt Hotline's telephony
 * layer. Reuses the same TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER already configured for SMS (see .env.example);
 * voice calls always need an explicit FROM_NUMBER (TWILIO_MESSAGING_
 * SERVICE_SID doesn't apply to calls, SMS-only).
 *
 * Dynamic-imports the twilio SDK, same pattern as sms/intro/route.ts,
 * so the ~5MB dependency stays out of the cold-start path for routes
 * that never place a call.
 */

const DEFAULT_VOICE = 'Polly.Matthew-Neural'

export type InitiateCallResult = { ok: true; callSid: string } | { ok: false; error: string }

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER,
  )
}

/**
 * Place an outbound call. `twimlUrl` is the webhook Twilio POSTs to the
 * moment the call is answered (our TwiML turn machine); `statusCallbackUrl`
 * gets ringing/answered/completed/failed lifecycle events.
 */
export async function initiateVoiceCall(args: {
  to: string
  twimlUrl: string
  statusCallbackUrl: string
}): Promise<InitiateCallResult> {
  if (!twilioConfigured()) {
    return { ok: false, error: 'twilio_voice_not_configured' }
  }
  try {
    const twilioModule = await import('twilio')
    const client = twilioModule.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    )
    const call = await client.calls.create({
      to: args.to,
      from: process.env.TWILIO_FROM_NUMBER!,
      url: args.twimlUrl,
      method: 'POST',
      statusCallback: args.statusCallbackUrl,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      // Hangs up on our end if it rings unanswered — a slipped-into
      // voicemail call shouldn't burn 60s of paid minutes reading a
      // script to an answering machine.
      timeout: 20,
    })
    return { ok: true, callSid: call.sid }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'twilio_call_failed' }
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sayTag(line: string): string {
  const voice = process.env.TWILIO_VOICE_NAME || DEFAULT_VOICE
  return `<Say voice="${voice}" language="en-US">${escapeXml(line)}</Say>`
}

/**
 * Speak `line`, then listen briefly for a spoken reply. The call is a
 * scripted intervention, not a conversation the caller has to sustain —
 * `actionOnEmptyResult="true"` means the next beat fires on the action
 * URL whether the caller says something back or stays silent, so a
 * caller who never speaks still hears all four beats of the script.
 * When they DO speak, SpeechResult reaches the next webhook POST and
 * voice-composer.service reacts to it before advancing the beat.
 *
 * The trailing Say+Hangup after </Gather> is dead code in normal
 * operation (actionOnEmptyResult means Twilio always redirects to the
 * action URL) — kept only as a last-resort net if Twilio itself can't
 * reach our webhook.
 */
export function twimlSayAndGather(args: {
  line: string
  actionUrl: string
  fallbackLine: string
}): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Response>',
    `<Gather input="speech" speechTimeout="auto" timeout="6" actionOnEmptyResult="true" action="${escapeXml(args.actionUrl)}" method="POST">`,
    sayTag(args.line),
    '</Gather>',
    sayTag(args.fallbackLine),
    '<Hangup/>',
    '</Response>',
  ].join('')
}

/** Final beat: speak the closing line and end the call. No gather. */
export function twimlSayAndHangup(line: string): string {
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<Response>', sayTag(line), '<Hangup/>', '</Response>'].join('')
}

/** Empty ack — used by the status-callback webhook, which expects no TwiML. */
export function twimlEmptyOk(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
