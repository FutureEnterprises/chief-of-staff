/**
 * JS bridge for the CoylVoice native module.
 *
 * On iOS this resolves to an AVSpeechSynthesizer-backed module
 * defined in `./ios/CoylVoice.swift`. On Android it resolves to an
 * android.speech.tts.TextToSpeech-backed module defined in
 * `./android/CoylVoiceModule.kt`. On unsupported platforms (web, Expo
 * Go before prebuild) we export a no-op shim — every call resolves
 * the way the native module would when isVoiceAvailable() is false,
 * so consumers never have to gate on Platform.
 *
 * Three voice tiers map to COYL's three intervention modes:
 *   - 'gentle'  → low-arousal recovery + post-slip shame removal
 *   - 'firm'    → high-arousal autopilot interruption
 *   - 'urgent'  → critical / safety nudges (rare, reserved)
 */
import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

/** Available voice tiers. Map to TTS voice + rate + pitch on each platform. */
export type CoylVoiceTier = 'gentle' | 'firm' | 'urgent'

export interface CoylVoiceModule {
  /**
   * Speak the given text using the requested voice tier. The Promise
   * resolves when speech ends (or rejects if synthesis fails). Defaults
   * to 'gentle' so accidental calls don't startle the user.
   */
  speak(text: string, voice?: CoylVoiceTier): Promise<void>
  /**
   * True iff the native synth is loaded and at least one usable voice
   * is installed on the device. On Android this requires TTS engine
   * data to have finished downloading.
   */
  isVoiceAvailable(): boolean
  /**
   * Persists the user's preferred voice id (e.g. an iOS voice
   * identifier from `AVSpeechSynthesisVoice.identifier`, or an
   * Android voice name from `TextToSpeech.getVoices()`). Subsequent
   * `speak()` calls will use this voice as the base, with the tier
   * applied on top (rate, pitch).
   */
  setPreferredVoice(voiceId: string): Promise<void>
}

/**
 * Stub returned on unsupported platforms / when the native module
 * has not been linked yet. Resolves rather than throws so callers
 * can use speak() unconditionally without try/catch on every call.
 */
const stub: CoylVoiceModule = {
  async speak() {
    /* no-op */
  },
  isVoiceAvailable() {
    return false
  },
  async setPreferredVoice() {
    /* no-op */
  },
}

function load(): CoylVoiceModule {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return stub
  try {
    return requireNativeModule<CoylVoiceModule>('CoylVoice')
  } catch {
    // The native module hasn't been built yet (Expo Go, web, or a
    // prebuild that hasn't been rebuilt). Return the stub so callers
    // don't crash — they already guard with isVoiceAvailable().
    return stub
  }
}

const CoylVoice: CoylVoiceModule = load()

export default CoylVoice
