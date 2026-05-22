package ai.coyl.eap.wear

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

/**
 * Receives DataLayer messages from the phone. The phone's
 * EAPFirebaseMessagingService forwards each incoming EAP action over
 * /eap/action to here.
 */
class WearDataLayerListener : WearableListenerService() {

    override fun onMessageReceived(messageEvent: MessageEvent) {
        when (messageEvent.path) {
            "/eap/action" -> {
                val raw = String(messageEvent.data)
                WearEAPCoordinator.onActionFromPhone(applicationContext, raw)
            }
        }
    }
}
