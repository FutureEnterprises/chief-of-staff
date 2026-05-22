package ai.coyl.eap.wear

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Coordinator on the watch.
 *
 * Two delivery paths:
 *   1. DataLayer message from phone (preferred — battery friendly).
 *      Phone receives FCM push → forwards JSON to /eap/action path on the
 *      wearable DataLayer.
 *   2. Direct FCM when Wear OS is on wifi (fallback).
 *
 * Outcome reporting goes either back through DataLayer to the phone (the
 * phone POSTs /action/outcome) OR direct to coyl.ai when on wifi.
 */
object WearEAPCoordinator {

    private const val DATA_LAYER_ACTION_PATH = "/eap/action"
    private const val DATA_LAYER_OUTCOME_PATH = "/eap/outcome"
    const val WORK_COMPLICATION = "wear_complication_refresh"

    val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun start(ctx: Context) {
        WearHealthSubscription.start(ctx)
        scheduleComplicationRefresh(ctx)
    }

    /** Called by WearDataLayerListener when a phone forwards an action. */
    fun onActionFromPhone(ctx: Context, raw: String) {
        scope.launch {
            val req = runCatching {
                json.decodeFromString(WearActionRequest.serializer(), raw)
            }.getOrNull() ?: return@launch
            val result = WearHapticIntervention.execute(ctx, req)
            // Forward outcome back to phone for cloud POST.
            sendDataLayer(ctx, DATA_LAYER_OUTCOME_PATH, json.encodeToString(result))
        }
    }

    /** Direct cloud POST when watch is on wifi. */
    fun postOutcomeDirect(ctx: Context, payload: String) {
        scope.launch {
            val token = WearAuth.bearer(ctx) ?: return@launch
            val client = OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build()
            val req = Request.Builder()
                .url(BuildConfig.EAP_BASE_URL + "/api/eap/v1/action/outcome")
                .addHeader("Authorization", "Bearer $token")
                .post(payload.toRequestBody("application/json".toMediaType()))
                .build()
            runCatching { client.newCall(req).execute().close() }
        }
    }

    private suspend fun sendDataLayer(ctx: Context, path: String, payload: String) {
        val nodes = Wearable.getNodeClient(ctx).connectedNodes.await()
        val client = Wearable.getMessageClient(ctx)
        nodes.forEach { node ->
            runCatching {
                client.sendMessage(node.id, path, payload.toByteArray()).await()
            }
        }
    }

    /** Ship a Health Services summary string up to the phone for batching. */
    fun forwardTelemetry(ctx: Context, summary: String) {
        scope.launch {
            sendDataLayer(ctx, "/eap/telemetry", summary)
        }
    }

    private fun scheduleComplicationRefresh(ctx: Context) {
        val work = PeriodicWorkRequestBuilder<ComplicationRefreshWorker>(1, TimeUnit.HOURS)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(
            WORK_COMPLICATION,
            ExistingPeriodicWorkPolicy.KEEP,
            work
        )
    }
}
