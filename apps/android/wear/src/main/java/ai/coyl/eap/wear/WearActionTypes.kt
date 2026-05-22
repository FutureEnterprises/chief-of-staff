package ai.coyl.eap.wear

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Minimal subset of EapApi used by the watch. We don't pull the whole
 * phone-side EapApi.kt because the wear module is a separate Gradle module
 * with its own classpath — duplication keeps coupling loose.
 */
@Serializable
data class WearActionRequest(
    val actionId: String,
    val llmId: String,
    val userId: String,
    val deviceId: String,
    val actuator: String, // "haptic" | "notification" | "complication_update"
    val params: JsonElement,
    val scopeRequested: String,
    val ttlSeconds: Int = 30
)

@Serializable
data class WearActionOutcome(
    val executionToken: String,
    val actionId: String,
    val outcome: String,
    val outcomeAt: String,
    val reason: String? = null
)
