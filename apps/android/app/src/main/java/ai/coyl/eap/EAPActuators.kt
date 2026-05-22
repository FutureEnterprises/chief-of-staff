package ai.coyl.eap

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.speech.tts.TextToSpeech
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.Instant
import java.util.Locale
import kotlin.coroutines.resume

/**
 * Maps incoming EAP `actuator` strings to platform calls. Each handler is
 * suspendable so the service can serialize them on a single coroutine
 * scope without blocking the FCM thread.
 *
 * Coverage matrix per EAP spec:
 *  notification          ✔ NotificationManagerCompat
 *  haptic                ✔ VibrationEffect (waveform / one-shot)
 *  voice_tts             ✔ Android TextToSpeech
 *  open_url              ✔ Intent.ACTION_VIEW
 *  open_app              ✔ packageManager.getLaunchIntentForPackage
 *  lock_screen           ◐ requires DevicePolicyManager admin grant (TODO)
 *  dim_screen            ◐ in-app only without WRITE_SETTINGS (TODO)
 *  do_not_disturb_toggle ✔ NotificationManager.setInterruptionFilter
 *
 * Each handler returns an [ActionResult] so the service can POST an
 * /api/eap/v1/action/outcome record.
 */
object EAPActuators {

    sealed class ActionResult(val outcome: String, val reason: String? = null) {
        object Executed : ActionResult("executed")
        class Failed(reason: String) : ActionResult("failed", reason)
        class Denied(reason: String) : ActionResult("denied", reason)
    }

    /** Dispatch by actuator name. */
    suspend fun dispatch(ctx: Context, req: ActionRequest): ActionResult {
        if (!Auth.scopeGranted(ctx, req.scopeRequested)) {
            return ActionResult.Denied("scope_not_granted:${req.scopeRequested}")
        }
        return when (req.actuator) {
            "notification" -> notification(ctx, req)
            "haptic" -> haptic(ctx, req)
            "voice_tts" -> voiceTts(ctx, req)
            "open_url" -> openUrl(ctx, req)
            "open_app" -> openApp(ctx, req)
            "do_not_disturb_toggle" -> dndToggle(ctx, req)
            "lock_screen" -> ActionResult.Failed("lock_screen_requires_admin_grant")
            "dim_screen" -> ActionResult.Failed("dim_screen_requires_write_settings")
            else -> ActionResult.Failed("unknown_actuator:${req.actuator}")
        }
    }

    private fun notification(ctx: Context, req: ActionRequest): ActionResult {
        val obj = req.params.jsonObject
        val title = obj["title"]?.jsonPrimitive?.content ?: "COYL"
        val body = obj["body"]?.jsonPrimitive?.content ?: ""

        val n = NotificationCompat.Builder(ctx, ctx.getString(R.string.eap_channel_id))
            .setSmallIcon(R.drawable.ic_eap_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        return try {
            NotificationManagerCompat.from(ctx).notify(req.actionId.hashCode(), n)
            ActionResult.Executed
        } catch (se: SecurityException) {
            ActionResult.Failed("post_notifications_permission_missing")
        }
    }

    private fun haptic(ctx: Context, req: ActionRequest): ActionResult {
        val obj = req.params.jsonObject
        val pattern = obj["pattern"]?.jsonPrimitive?.content ?: "double-tap"
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vm.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        val effect = when (pattern) {
            "single" -> VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE)
            "double-tap" -> VibrationEffect.createWaveform(longArrayOf(0, 60, 80, 60), -1)
            "triple-tap" -> VibrationEffect.createWaveform(longArrayOf(0, 60, 80, 60, 80, 60), -1)
            "long" -> VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE)
            else -> VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE)
        }
        vibrator.vibrate(effect)
        return ActionResult.Executed
    }

    private suspend fun voiceTts(ctx: Context, req: ActionRequest): ActionResult {
        val text = req.params.jsonObject["text"]?.jsonPrimitive?.content
            ?: return ActionResult.Failed("missing_text")

        return suspendCancellableCoroutine { cont ->
            val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (audio.ringerMode != AudioManager.RINGER_MODE_NORMAL) {
                cont.resume(ActionResult.Denied("ringer_silent"))
                return@suspendCancellableCoroutine
            }
            lateinit var tts: TextToSpeech
            tts = TextToSpeech(ctx) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    tts.language = Locale.getDefault()
                    val ok = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, req.actionId)
                    if (ok == TextToSpeech.ERROR) {
                        cont.resume(ActionResult.Failed("tts_speak_error"))
                    } else {
                        cont.resume(ActionResult.Executed)
                    }
                } else {
                    cont.resume(ActionResult.Failed("tts_init_error"))
                }
            }
            cont.invokeOnCancellation { tts.shutdown() }
        }
    }

    private fun openUrl(ctx: Context, req: ActionRequest): ActionResult {
        val url = req.params.jsonObject["url"]?.jsonPrimitive?.content
            ?: return ActionResult.Failed("missing_url")
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            ctx.startActivity(intent)
            ActionResult.Executed
        } catch (e: Exception) {
            ActionResult.Failed("open_url:${e.javaClass.simpleName}")
        }
    }

    private fun openApp(ctx: Context, req: ActionRequest): ActionResult {
        val pkg = req.params.jsonObject["package"]?.jsonPrimitive?.content
            ?: return ActionResult.Failed("missing_package")
        val intent = ctx.packageManager.getLaunchIntentForPackage(pkg)
            ?: return ActionResult.Failed("app_not_installed:$pkg")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            ctx.startActivity(intent)
            ActionResult.Executed
        } catch (e: Exception) {
            ActionResult.Failed("open_app:${e.javaClass.simpleName}")
        }
    }

    private fun dndToggle(ctx: Context, req: ActionRequest): ActionResult {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (!nm.isNotificationPolicyAccessGranted) {
            // Surface a settings intent so the founder can grant. We do NOT
            // try to bypass; that would be a TOS / Play policy violation.
            val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
            return ActionResult.Denied("dnd_policy_access_not_granted")
        }
        val enabled = req.params.jsonObject["enabled"]?.jsonPrimitive?.content?.toBooleanStrictOrNull()
            ?: true
        nm.setInterruptionFilter(
            if (enabled) NotificationManager.INTERRUPTION_FILTER_PRIORITY
            else NotificationManager.INTERRUPTION_FILTER_ALL
        )
        return ActionResult.Executed
    }

    /** Helper to build an outcome record for the service to POST. */
    fun buildOutcome(req: ActionRequest, result: ActionResult): ActionOutcome =
        ActionOutcome(
            executionToken = "et_" + req.actionId,
            actionId = req.actionId,
            outcome = result.outcome,
            outcomeAt = Instant.now().toString(),
            reason = result.reason
        )
}
