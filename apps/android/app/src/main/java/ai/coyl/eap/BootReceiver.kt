package ai.coyl.eap

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-launches the EAP Foreground Service after device reboot so the
 * coordinator survives power cycles.
 *
 * Only fires if a user is signed in (Auth.userId is non-null). Otherwise
 * we wait for the user to launch MainActivity manually.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED && action != "android.intent.action.QUICKBOOT_POWERON") return
        if (Auth.userId(context) == null) return
        val svc = Intent(context, EAPCoordinatorService::class.java)
        context.startForegroundService(svc)
    }
}
