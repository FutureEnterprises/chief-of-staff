package ai.coyl.eap

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.serialization.Serializable
import java.time.Duration
import java.time.Instant

/**
 * Reads sensors from the device + POSTs aggregates to
 * /api/v1/health/ingest via WorkManager periodic work.
 *
 * Health Connect provides HRV / sleep / steps / RHR. App-usage + screen
 * state are read via UsageStatsManager + a ScreenStateReceiver elsewhere.
 *
 * Per EAP spec, the LLM does not poll us — we subscribe via
 * /eap/v1/sensor/subscribe and push deltas. This object handles both the
 * snapshot pull (for /eap/v1/sensor/:deviceId/:sensor) and the periodic
 * dump.
 */
object EAPSensors {

    private const val INGEST_PATH = "/api/v1/health/ingest"

    @Serializable
    data class HrvSample(val timestamp: String, val rmssdMs: Double)

    @Serializable
    data class StepsSample(val startTime: String, val endTime: String, val count: Long)

    @Serializable
    data class SleepSegment(val startTime: String, val endTime: String, val stage: String)

    @Serializable
    data class HealthIngestPayload(
        val deviceId: String,
        val userId: String,
        val capturedAt: String,
        val hrv: List<HrvSample> = emptyList(),
        val steps: List<StepsSample> = emptyList(),
        val sleep: List<SleepSegment> = emptyList()
    )

    /** Required Health Connect permission set. */
    val requiredHealthPermissions: Set<String> = setOf(
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
    )

    fun isHealthConnectAvailable(ctx: Context): Boolean =
        HealthConnectClient.getSdkStatus(ctx) == HealthConnectClient.SDK_AVAILABLE

    private fun client(ctx: Context): HealthConnectClient? =
        if (isHealthConnectAvailable(ctx)) HealthConnectClient.getOrCreate(ctx) else null

    suspend fun readHrv(
        ctx: Context,
        window: Duration = Duration.ofHours(4)
    ): List<HrvSample> {
        val hc = client(ctx) ?: return emptyList()
        val granted = hc.permissionController.getGrantedPermissions()
        if (HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class) !in granted) {
            return emptyList()
        }
        val resp = hc.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateVariabilityRmssdRecord::class,
                timeRangeFilter = TimeRangeFilter.between(Instant.now() - window, Instant.now())
            )
        )
        return resp.records.map {
            HrvSample(timestamp = it.time.toString(), rmssdMs = it.heartRateVariabilityMillis)
        }
    }

    suspend fun readSteps(
        ctx: Context,
        window: Duration = Duration.ofHours(4)
    ): List<StepsSample> {
        val hc = client(ctx) ?: return emptyList()
        val granted = hc.permissionController.getGrantedPermissions()
        if (HealthPermission.getReadPermission(StepsRecord::class) !in granted) return emptyList()
        val resp = hc.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(Instant.now() - window, Instant.now())
            )
        )
        return resp.records.map {
            StepsSample(it.startTime.toString(), it.endTime.toString(), it.count)
        }
    }

    suspend fun readSleep(
        ctx: Context,
        window: Duration = Duration.ofHours(12)
    ): List<SleepSegment> {
        val hc = client(ctx) ?: return emptyList()
        val granted = hc.permissionController.getGrantedPermissions()
        if (HealthPermission.getReadPermission(SleepSessionRecord::class) !in granted) return emptyList()
        val resp = hc.readRecords(
            ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(Instant.now() - window, Instant.now())
            )
        )
        return resp.records.flatMap { session ->
            session.stages.map {
                SleepSegment(
                    startTime = it.startTime.toString(),
                    endTime = it.endTime.toString(),
                    stage = it.stage.toString()
                )
            }
        }
    }

    /** Foreground-app sampling via UsageStatsManager (requires PACKAGE_USAGE_STATS). */
    fun foregroundApp(ctx: Context): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) return null
        val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return null
        val end = System.currentTimeMillis()
        val begin = end - 60_000L
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, begin, end)
            ?: return null
        return stats.maxByOrNull { it.lastTimeUsed }?.packageName
    }

    /** Sync the last 4h health roll-up to /api/v1/health/ingest. */
    suspend fun ingestRecent(ctx: Context): Boolean {
        val userId = Auth.userId(ctx) ?: return false
        val deviceId = Auth.deviceId(ctx) ?: return false
        val payload = HealthIngestPayload(
            deviceId = deviceId,
            userId = userId,
            capturedAt = Instant.now().toString(),
            hrv = readHrv(ctx),
            steps = readSteps(ctx),
            sleep = readSleep(ctx)
        )
        return EapHttp(ctx).postJson(INGEST_PATH, payload) != null
    }
}
