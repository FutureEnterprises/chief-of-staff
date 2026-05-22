package ai.coyl.eap

import android.app.Notification
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * EAP Foreground Service.
 *
 * Lifecycle:
 *   - onCreate         → promote to foreground with dataSync type
 *   - onStartCommand   → register device (once), schedule periodic health
 *                        ingest, start a 60s polling loop as FCM backup
 *   - onDestroy        → cancel coroutines (WorkManager keeps its own
 *                        schedule)
 *
 * Action delivery:
 *   1. FCM push (preferred, near-zero latency) → EAPFirebaseMessagingService
 *      hands the payload to [handleIncoming]
 *   2. Long-poll fallback every 60s (in case FCM is unavailable)
 */
class EAPCoordinatorService : LifecycleService() {

    private companion object {
        const val FG_ID = 0x37A4
        const val POLL_PATH = "/api/eap/v1/action/pending"
        const val OUTCOME_PATH = "/api/eap/v1/action/outcome"
        const val WORK_HEALTH_INGEST = "eap_health_ingest"
    }

    override fun onBind(intent: Intent): IBinder? {
        super.onBind(intent)
        return null
    }

    override fun onCreate() {
        super.onCreate()
        startForegroundWithNotification()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        ensureRegisteredAndStartLoop()
        scheduleHealthIngestWork()
        return START_STICKY
    }

    private fun startForegroundWithNotification() {
        val tapIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val n: Notification = NotificationCompat.Builder(this, getString(R.string.eap_channel_id))
            .setSmallIcon(R.drawable.ic_eap_notification)
            .setContentTitle(getString(R.string.eap_service_running))
            .setContentText(getString(R.string.eap_service_running_subtext))
            .setContentIntent(tapIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(FG_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(FG_ID, n)
        }
    }

    private fun ensureRegisteredAndStartLoop() {
        lifecycleScope.launch {
            val userId = Auth.userId(this@EAPCoordinatorService) ?: return@launch
            if (Auth.deviceId(this@EAPCoordinatorService) == null) {
                DeviceRegistration.register(this@EAPCoordinatorService, userId, fcmToken = null)
            }
            pollLoop()
        }
    }

    /** 60s fallback polling. FCM is the primary channel. */
    private suspend fun pollLoop() {
        val http = EapHttp(this)
        while (lifecycleScope.isActive) {
            runCatching {
                val pending = http.getRaw(POLL_PATH) ?: ""
                if (pending.isNotBlank() && pending != "[]") {
                    parseAndDispatchBatch(pending)
                }
            }
            delay(60_000L)
        }
    }

    private suspend fun parseAndDispatchBatch(raw: String) {
        runCatching {
            val list = EapApi.json.decodeFromString(
                kotlinx.serialization.builtins.ListSerializer(ActionRequest.serializer()),
                raw
            )
            list.forEach { handleIncoming(it) }
        }
    }

    /** Public entry — called by FCM service when a push lands. */
    suspend fun handleIncoming(req: ActionRequest) {
        val result = EAPActuators.dispatch(this, req)
        val outcome = EAPActuators.buildOutcome(req, result)
        EapHttp(this).postJson(OUTCOME_PATH, outcome)
    }

    private fun scheduleHealthIngestWork() {
        val work = PeriodicWorkRequestBuilder<HealthIngestWorker>(2, TimeUnit.HOURS)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            WORK_HEALTH_INGEST,
            ExistingPeriodicWorkPolicy.KEEP,
            work
        )
    }
}
