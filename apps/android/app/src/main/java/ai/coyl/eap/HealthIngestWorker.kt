package ai.coyl.eap

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/** Periodic Worker — POSTs the last health window to /api/v1/health/ingest. */
class HealthIngestWorker(
    ctx: Context,
    params: WorkerParameters
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val ok = runCatching { EAPSensors.ingestRecent(applicationContext) }
            .getOrDefault(false)
        return if (ok) Result.success() else Result.retry()
    }
}
