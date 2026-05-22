/**
 * Voice mode — the JS-facing surface for COYL's spoken interrupts.
 *
 * Three voice tiers map to the three intervention modes:
 *   - gentle: low-arousal recovery + post-slip shame removal
 *   - firm:   high-arousal autopilot interruption
 *   - urgent: critical / safety nudges (rare)
 *
 * All helpers are best-effort: if the device has no installed voices,
 * if the user has TTS disabled at the OS level, or if a native call
 * throws, we swallow the error and resolve. Voice mode is an
 * augmentation, not a critical path — the push notification + Live
 * Activity already cover the interrupt.
 */
import CoylVoice, {
  type CoylVoiceTier,
} from '../modules/coyl-voice'

export type VoiceTier = CoylVoiceTier

/**
 * Speak the given text using the requested voice tier (defaults to
 * 'gentle'). Resolves when speech finishes or immediately on any
 * failure — callers should not await this expecting completion to be
 * meaningful for control flow.
 */
export async function speak(
  text: string,
  voice: VoiceTier = 'gentle',
): Promise<void> {
  if (!CoylVoice.isVoiceAvailable()) return
  if (!text || !text.trim()) return
  try {
    await CoylVoice.speak(text, voice)
  } catch (err) {
    console.warn('[COYL] voice.speak failed:', err)
  }
}

/**
 * True iff the native TTS engine reports at least one usable voice.
 * Use this before showing a "speak the prompt" UI affordance — there
 * is no point offering voice on a device with no installed voices.
 */
export function isVoiceAvailable(): boolean {
  try {
    return CoylVoice.isVoiceAvailable()
  } catch {
    return false
  }
}

/**
 * Persist the user's preferred voice id. Format is platform-specific:
 *   - iOS:     AVSpeechSynthesisVoice.identifier
 *              (e.g. "com.apple.ttsbundle.Samantha-compact")
 *   - Android: TextToSpeech.Voice.getName()
 *              (e.g. "en-us-x-iol-local")
 *
 * The voice id overrides the tier's base voice; the tier still
 * controls rate + pitch so "gentle vs firm" remains perceptually
 * distinct within the user's chosen persona.
 */
export async function setPreferredVoice(voiceId: string): Promise<void> {
  if (!voiceId) return
  try {
    await CoylVoice.setPreferredVoice(voiceId)
  } catch (err) {
    console.warn('[COYL] voice.setPreferredVoice failed:', err)
  }
}

/**
 * Maps a COYL intervention mode to a voice tier.
 *
 *   high_arousal -> firm
 *   low_arousal  -> gentle
 *   post_slip    -> gentle  (shame removal is gentle voice, not firm)
 *
 * Exposed so callers can stay aligned with the policy engine's
 * mode classification without hard-coding tier names at every site.
 */
export function voiceTierForMode(
  mode: 'high_arousal' | 'low_arousal' | 'post_slip',
): VoiceTier {
  switch (mode) {
    case 'high_arousal':
      return 'firm'
    case 'low_arousal':
      return 'gentle'
    case 'post_slip':
      return 'gentle'
    default:
      return 'gentle'
  }
}
