package ai.coyl.eap

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

/**
 * Application class — initializes the EAP notification channel + any
 * one-shot bootstrap work.
 */
class EAPApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        createEapChannel()
    }

    private fun createEapChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            getString(R.string.eap_channel_id),
            getString(R.string.eap_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.eap_channel_description)
            setShowBadge(false)
        }
        nm?.createNotificationChannel(channel)
    }
}
