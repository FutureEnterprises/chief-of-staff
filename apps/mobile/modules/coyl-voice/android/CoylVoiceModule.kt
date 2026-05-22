package ai.coyl.voice

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import androidx.preference.PreferenceManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume

/**
 * React Native <-> android.speech.tts.TextToSpeech bridge for COYL's
 * three-tier voice mode. Exposes three functions to JS:
 *
 *   speak(text, voice?)        -> Promise<void>  (resolves when speech ends)
 *   isVoiceAvailable()         -> Bool
 *   setPreferredVoice(voiceId) -> Promise<void>
 *
 * Tier mapping (rate is TextToSpeech.setSpeechRate; pitch is setPitch):
 *   gentle -> rate 0.90, pitch 1.00
 *   firm   -> rate 1.00, pitch 1.00
 *   urgent -> rate 1.10, pitch 1.15
 *
 * If the user has called setPreferredVoice() with a TTS voice name,
 * the tier still controls rate + pitch but the base Voice identity
 * is the user-chosen one. Pre-API-21 (where android.speech.tts.Voice
 * doesn't exist) we fall back to Locale-based voice selection.
 */
class CoylVoiceModule : Module() {

    private data class VoiceTier(
        val rate: Float,
        val pitch: Float
    )

    private val tiers = mapOf(
        "gentle" to VoiceTier(rate = 0.90f, pitch = 1.00f),
        "firm"   to VoiceTier(rate = 1.00f, pitch = 1.00f),
        "urgent" to VoiceTier(rate = 1.10f, pitch = 1.15f)
    )

    private val prefKey = "coyl.voice.preferredVoiceId"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // Lazily-initialized shared TTS engine. We wait on the init
    // callback before resolving the first speak() promise so we don't
    // race ahead of the engine being ready.
    @Volatile
    private var tts: TextToSpeech? = null
    @Volatile
    private var initialized: Boolean = false

    // Map utteranceId -> Promise so the UtteranceProgressListener can
    // resolve the right call when speech ends. ConcurrentHashMap so
    // we can safely receive callbacks on the TTS engine's thread.
    private val pendingUtterances = ConcurrentHashMap<String, Promise>()

    private val utteranceListener = object : UtteranceProgressListener() {
        override fun onStart(utteranceId: String?) { /* no-op */ }

        override fun onDone(utteranceId: String?) {
            val p = utteranceId?.let { pendingUtterances.remove(it) }
            p?.resolve(null)
        }

        @Deprecated("Deprecated in Java")
        override fun onError(utteranceId: String?) {
            val p = utteranceId?.let { pendingUtterances.remove(it) }
            p?.reject("TTS_ERROR", "TextToSpeech.onError fired for utterance $utteranceId", null)
        }

        override fun onError(utteranceId: String?, errorCode: Int) {
            val p = utteranceId?.let { pendingUtterances.remove(it) }
            p?.reject(
                "TTS_ERROR",
                "TextToSpeech error code $errorCode for utterance $utteranceId",
                null
            )
        }
    }

    private fun appContext(): Context =
        appContext.reactContext
            ?: throw IllegalStateException("CoylVoice: ReactContext unavailable")

    /**
     * Ensure the TTS engine is constructed and the init callback has
     * fired before speech is attempted. Suspends until the engine is
     * ready or fails to init.
     */
    private suspend fun ensureTts(): TextToSpeech = suspendCancellableCoroutine { cont ->
        val existing = tts
        if (existing != null && initialized) {
            cont.resume(existing)
            return@suspendCancellableCoroutine
        }
        val context = appContext()
        val engine = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val t = tts
                if (t != null) {
                    t.language = Locale.US
                    t.setOnUtteranceProgressListener(utteranceListener)
                    initialized = true
                    if (cont.isActive) cont.resume(t)
                }
            } else {
                if (cont.isActive) cont.resume(tts ?: TextToSpeech(context, null))
            }
        }
        tts = engine
    }

    override fun definition() = ModuleDefinition {
        Name("CoylVoice")

        // MARK: speak
        //
        // Coroutine wraps the TTS engine init so we can safely call
        // speak() before the engine has fully loaded. The promise
        // resolves through pendingUtterances when onDone fires.
        AsyncFunction("speak") { text: String, voice: String?, promise: Promise ->
            scope.launch {
                try {
                    val engine = ensureTts()
                    val tier = tiers[voice] ?: tiers["gentle"]!!
                    engine.setSpeechRate(tier.rate)
                    engine.setPitch(tier.pitch)

                    val prefs = PreferenceManager.getDefaultSharedPreferences(appContext())
                    val prefId = prefs.getString(prefKey, null)
                    if (!prefId.isNullOrEmpty()) {
                        // Try to match a known voice; ignore if not found.
                        val match = engine.voices?.firstOrNull { it.name == prefId }
                        if (match != null) {
                            engine.voice = match
                        }
                    }

                    val utteranceId = UUID.randomUUID().toString()
                    pendingUtterances[utteranceId] = promise

                    val params = Bundle().apply {
                        putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                    }
                    val result = engine.speak(
                        text,
                        TextToSpeech.QUEUE_FLUSH,
                        params,
                        utteranceId
                    )
                    if (result == TextToSpeech.ERROR) {
                        pendingUtterances.remove(utteranceId)
                        promise.reject(
                            "TTS_SPEAK_FAILED",
                            "TextToSpeech.speak returned ERROR",
                            null
                        )
                    }
                } catch (t: Throwable) {
                    promise.reject(
                        "TTS_INIT_FAILED",
                        t.message ?: "Failed to initialize TextToSpeech",
                        t
                    )
                }
            }
        }

        // MARK: isVoiceAvailable
        //
        // Synchronous — returns true only if the engine has finished
        // initializing AND at least one voice is installed. Callers
        // gate every speak() call with this.
        Function("isVoiceAvailable") {
            val t = tts ?: return@Function false
            if (!initialized) return@Function false
            val voices: Set<Voice>? = try { t.voices } catch (_: Throwable) { null }
            return@Function !voices.isNullOrEmpty()
        }

        // MARK: setPreferredVoice
        //
        // Persist the user's chosen voice name (matching
        // android.speech.tts.Voice.getName()) into SharedPreferences.
        // We don't validate here — an invalid name simply falls back
        // to the tier default at speak time.
        AsyncFunction("setPreferredVoice") { voiceId: String, promise: Promise ->
            val prefs = PreferenceManager.getDefaultSharedPreferences(appContext())
            prefs.edit().putString(prefKey, voiceId).apply()
            promise.resolve(null)
        }

        // Clean up the TTS engine when the module is destroyed. The
        // app-process lifetime usually matches the engine's, but this
        // prevents leaks during hot-reload.
        OnDestroy {
            tts?.shutdown()
            tts = null
            initialized = false
            pendingUtterances.clear()
        }
    }
}
