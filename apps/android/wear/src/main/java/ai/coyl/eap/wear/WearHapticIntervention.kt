package ai.coyl.eap.wear

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.Instant

/**
 * Watch-side actuators.
 *
 * Restricted compared to the phone — the wrist's only EAP surfaces are:
 *   - haptic (Vibrator API)
 *   - in-app notification toast (Wearable Surface)
 *   - complication update (delegated to WearComplicationProvider via WorkManager)
 */
object WearHapticIntervention {

    suspend fun execute(ctx: Context, req: WearActionRequest): WearActionOutcome {
        val outcomeAt = Instant.now().toString()
        return when (req.actuator) {
            "haptic" -> {
                vibrate(ctx, req)
                WearActionOutcome(
                    executionToken = "et_" + req.actionId,
                    actionId = req.actionId,
                    outcome = "executed",
                    outcomeAt = outcomeAt
                )
            }
            "complication_update" -> {
                val score = req.params.jsonObject["score"]?.jsonPrimitive?.content?.toIntOrNull()
                if (score != null) {
                    WearAuth.saveSelfTrustScore(ctx, score)
                    WearComplicationProvider.requestRefresh(ctx)
                }
                WearActionOutcome(
                    executionToken = "et_" + req.actionId,
                    actionId = req.actionId,
                    outcome = "executed",
                    outcomeAt = outcomeAt
                )
            }
            else -> WearActionOutcome(
                executionToken = "et_" + req.actionId,
                actionId = req.actionId,
                outcome = "failed",
                outcomeAt = outcomeAt,
                reason = "unsupported_on_wear:${req.actuator}"
            )
        }
    }

    private fun vibrate(ctx: Context, req: WearActionRequest) {
        val pattern = req.params.jsonObject["pattern"]?.jsonPrimitive?.content ?: "double-tap"
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
    }
}
