package ai.coyl.eap

import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Receives EAP action pushes from the coyl.ai EAP coordinator.
 *
 * Payload shape — FCM `data` map carries the entire ActionRequest JSON
 * under key `eap_action`. We deserialize, then hand to the coordinator
 * service for dispatch.
 */
class EAPFirebaseMessagingService : FirebaseMessagingService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        // Re-register so the server has our current FCM endpoint.
        scope.launch {
            val uid = Auth.userId(applicationContext) ?: return@launch
            DeviceRegistration.register(applicationContext, uid, token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val raw = message.data["eap_action"] ?: return
        val req = runCatching {
            EapApi.json.decodeFromString(ActionRequest.serializer(), raw)
        }.getOrNull() ?: return

        // Wake the Foreground Service so it can dispatch + report outcome.
        ContextCompat_startService(req)
    }

    private fun ContextCompat_startService(req: ActionRequest) {
        scope.launch {
            // Bind-less: instantiate the dispatch surface inline. The
            // Foreground Service is the holder of long-lived state; for a
            // single push we can short-circuit and let it report the
            // outcome via the same HTTP path.
            val result = EAPActuators.dispatch(applicationContext, req)
            val outcome = EAPActuators.buildOutcome(req, result)
            EapHttp(applicationContext).postJson("/api/eap/v1/action/outcome", outcome)
        }
        // Also ensure the Foreground Service is running for sensor work.
        val intent = Intent(applicationContext, EAPCoordinatorService::class.java)
        applicationContext.startForegroundService(intent)
    }
}
