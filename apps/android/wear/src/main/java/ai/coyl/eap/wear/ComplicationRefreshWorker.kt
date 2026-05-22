package ai.coyl.eap.wear

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Hourly Worker — fetches the Self-Trust Score from coyl.ai and caches
 * it via WearAuth. Then invalidates the complication so the watch face
 * re-renders with the fresh number.
 */
class ComplicationRefreshWorker(
    ctx: Context,
    params: WorkerParameters
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val token = WearAuth.bearer(applicationContext) ?: return Result.success()
        val client = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()
        val req = Request.Builder()
            .url(BuildConfig.EAP_BASE_URL + "/api/v1/self-trust/snapshot")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        return try {
            client.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) return Result.retry()
                val body = resp.body?.string().orEmpty()
                val score = parseScore(body)
                if (score != null) {
                    WearAuth.saveSelfTrustScore(applicationContext, score)
                    WearComplicationProvider.requestRefresh(applicationContext)
                }
                Result.success()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }

    /** Lightweight extraction — avoids pulling kotlinx-serialization into the worker classpath. */
    private fun parseScore(body: String): Int? {
        // Expect shape like {"score":78,...}
        val m = Regex("\"score\"\\s*:\\s*(\\d+)").find(body) ?: return null
        return m.groupValues[1].toIntOrNull()
    }
}
