package ai.coyl.eap

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

/**
 * EAP wire types — JSON contract with coyl.ai/api/eap/v1/*.
 *
 * Keep this file the single source of truth for serialized request /
 * response bodies. Wear OS module mirrors the subset it needs.
 */
object EapApi {
    val json: Json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }
}

// ─────────────────────────────────────────────────────────────────────
// /eap/v1/device/register
// ─────────────────────────────────────────────────────────────────────

@Serializable
data class DeviceManifest(
    val sensors: List<String>,
    val actuators: List<String>,
    val userGrantedScopes: List<String>
)

@Serializable
data class OperationalState(
    val battery: Int? = null,
    val doNotDisturb: Boolean = false,
    val foregroundApp: String? = null
)

@Serializable
data class DeviceRegisterRequest(
    val deviceId: String,
    val userId: String,
    val deviceClass: String, // "android_phone" | "wear_os"
    val model: String,
    val os: String,
    val manifest: DeviceManifest,
    val operationalState: OperationalState,
    val fcmToken: String? = null
)

@Serializable
data class DeviceRegisterResponse(
    val ok: Boolean = true,
    val deviceId: String? = null
)

// ─────────────────────────────────────────────────────────────────────
// /eap/v1/action/request — incoming push from EAP cloud
// ─────────────────────────────────────────────────────────────────────

@Serializable
data class ActionRequest(
    val actionId: String,
    val llmId: String,
    val userId: String,
    val deviceId: String,
    val actuator: String,
    val params: JsonElement,
    val scopeRequested: String,
    val reasoning: String? = null,
    val confidence: Double? = null,
    val ttlSeconds: Int = 30
)

// ─────────────────────────────────────────────────────────────────────
// /eap/v1/action/outcome — phone reports back
// ─────────────────────────────────────────────────────────────────────

@Serializable
data class DeviceState(
    val userInteracted: Boolean? = null,
    val interactionLatencyMs: Long? = null
)

@Serializable
data class ActionOutcome(
    val executionToken: String,
    val actionId: String,
    val outcome: String, // "executed" | "denied" | "failed"
    val outcomeAt: String, // ISO-8601
    val deviceState: DeviceState? = null,
    val reason: String? = null,
    val userTag: String? = null
)

// ─────────────────────────────────────────────────────────────────────
// /eap/v1/scope/grant
// ─────────────────────────────────────────────────────────────────────

@Serializable
data class ScopeGrant(
    val userId: String,
    val llmId: String,
    val scope: String,
    val grantedAt: String,
    val expiresAt: String? = null,
    val revocable: Boolean = true
)

// ─────────────────────────────────────────────────────────────────────
// /eap/v1/panic
// ─────────────────────────────────────────────────────────────────────

@Serializable
data class PanicRequest(
    val userId: String,
    val deviceId: String,
    val triggeredAt: String,
    val source: String = "android"
)
