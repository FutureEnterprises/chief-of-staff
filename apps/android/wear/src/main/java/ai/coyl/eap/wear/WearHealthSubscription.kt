package ai.coyl.eap.wear

import android.content.Context
import androidx.health.services.client.HealthServices
import androidx.health.services.client.PassiveListenerCallback
import androidx.health.services.client.data.Availability
import androidx.health.services.client.data.DataPointContainer
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.PassiveListenerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Wear OS Health Services PassiveListener — streams HRV + heart rate
 * updates in real time without keeping the app foreground.
 *
 * On each sample we cache a compact summary + forward via DataLayer to
 * the phone, which aggregates + POSTs to coyl.ai. Phone-side is the
 * authoritative ingestion path.
 */
object WearHealthSubscription {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val dataTypes = setOf(
        DataType.HEART_RATE_BPM,
        DataType.HEART_RATE_VARIABILITY_RMSSD
        // Skin temperature is available on Pixel Watch / Wear OS 4+; can
        // be added here once we've validated the data class import path
        // against the installed SDK version.
    )

    fun start(ctx: Context) {
        val appCtx = ctx.applicationContext
        scope.launch {
            val client = HealthServices.getClient(appCtx).passiveMonitoringClient
            val capabilities = runCatching { client.getCapabilitiesAsync().await() }.getOrNull()
                ?: return@launch
            val supported = dataTypes.intersect(capabilities.supportedDataTypesPassiveMonitoring)
            if (supported.isEmpty()) return@launch

            val cfg = PassiveListenerConfig.builder()
                .setDataTypes(supported)
                .build()

            client.setPassiveListenerCallback(cfg, buildCallback(appCtx))
        }
    }

    private fun buildCallback(appCtx: Context): PassiveListenerCallback =
        object : PassiveListenerCallback {
            override fun onAvailabilityChanged(
                dataType: DataType<*, *>,
                availability: Availability
            ) {
                // Reserved for future UI surfacing.
            }

            override fun onNewDataPointsReceived(dataPoints: DataPointContainer) {
                scope.launch {
                    val summary = buildString {
                        dataPoints.dataTypes.forEach { dt ->
                            append(dt.name)
                            append(":")
                            append(dataPoints.getData(dt).size)
                            append(";")
                        }
                    }
                    // Forward to the phone via DataLayer for cloud POST.
                    runCatching {
                        WearEAPCoordinator.forwardTelemetry(appCtx, summary)
                    }
                }
            }
        }
}
