package ai.coyl.eap

import android.content.Context
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import java.util.UUID

/**
 * Registers this Android phone as an EAP edge.
 *
 * Builds the manifest from the actuators we know we can fire + the sensors
 * we can read, then POSTs to /api/eap/v1/device/register. Server responds
 * with the canonical deviceId (we generate a local UUID if none persisted).
 */
object DeviceRegistration {

    private const val PATH = "/api/eap/v1/device/register"

    suspend fun register(
        ctx: Context,
        userId: String,
        fcmToken: String?,
    ): Boolean {
        val deviceId = Auth.deviceId(ctx) ?: ("android-" + UUID.randomUUID().toString().take(12))
        Auth.saveDeviceId(ctx, deviceId)
        Auth.saveUserId(ctx, userId)

        val manifest = DeviceManifest(
            sensors = listOf(
                "hrv",           // Health Connect HeartRateVariabilityRmssd
                "steps",         // Health Connect Steps
                "sleep",         // Health Connect SleepSession
                "motion",        // ActivityRecognitionClient
                "app_usage",     // UsageStatsManager
                "screen_state",  // ACTION_SCREEN_ON / OFF
            ),
            actuators = listOf(
                "notification",
                "haptic",
                "voice_tts",
                "open_url",
                "open_app",
                "lock_screen",         // requires device admin
                "dim_screen",          // in-app only without WRITE_SETTINGS
                "do_not_disturb_toggle"
            ),
            userGrantedScopes = listOf(
                "edge:phone:notification",
                "edge:phone:haptic",
                "edge:phone:voice",
                "edge:phone:open_url",
                "edge:phone:read:hrv"
            ).filter { Auth.scopeGranted(ctx, it) }
        )

        val battery = (ctx.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager)
            ?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val req = DeviceRegisterRequest(
            deviceId = deviceId,
            userId = userId,
            deviceClass = "android_phone",
            model = "${Build.MANUFACTURER} ${Build.MODEL}",
            os = "Android ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})",
            manifest = manifest,
            operationalState = OperationalState(
                battery = battery,
                doNotDisturb = false,
                foregroundApp = ctx.packageName
            ),
            fcmToken = fcmToken
        )

        val resp = EapHttp(ctx).postJson(PATH, req) ?: return false
        return runCatching {
            val parsed = EapApi.json.decodeFromString(DeviceRegisterResponse.serializer(), resp)
            parsed.ok
        }.getOrDefault(false)
    }

    /** Stable device identifier suitable for local cross-restart use. */
    fun stableLocalId(ctx: Context): String {
        @Suppress("HardwareIds")
        return Settings.Secure.getString(
            ctx.contentResolver, Settings.Secure.ANDROID_ID
        ) ?: "unknown"
    }
}
