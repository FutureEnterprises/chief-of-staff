package ai.coyl.eap

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Panic switch — broadcast receiver.
 *
 * Trigger sources:
 *   - In-app button in ConsentActivity
 *   - Wear OS hardware crown (forwards via DataLayer → phone activity → broadcast)
 *   - Optional accessibility-gesture wiring (TODO)
 *
 * Effect:
 *   - Revoke every cached scope locally (so even if the network call fails,
 *     no action will dispatch)
 *   - POST /api/eap/v1/panic so the cloud also flips the panic flag for
 *     the next 24h
 */
class PanicReceiver : BroadcastReceiver() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "ai.coyl.eap.PANIC") return
        val ctx = context.applicationContext

        // 1. Local revoke immediately.
        Auth.revokeAllScopes(ctx)

        // 2. Cloud confirmation.
        val userId = Auth.userId(ctx) ?: return
        val deviceId = Auth.deviceId(ctx) ?: return
        scope.launch {
            EapHttp(ctx).postJson(
                "/api/eap/v1/panic",
                PanicRequest(
                    userId = userId,
                    deviceId = deviceId,
                    triggeredAt = Instant.now().toString()
                )
            )
        }
    }
}
