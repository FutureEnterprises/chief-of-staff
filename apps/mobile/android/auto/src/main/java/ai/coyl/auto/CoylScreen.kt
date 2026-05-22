package ai.coyl.auto

import android.content.SharedPreferences
import androidx.car.app.CarContext
import androidx.car.app.CarToast
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarText
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Root (and only) Screen for COYL on Android Auto.
 *
 * Renders a PaneTemplate with two status rows + two action buttons:
 *
 *   Pane row 1: "Self-Trust Score" — value: "78"
 *   Pane row 2: "Day Number"       — value: "47"
 *
 *   Action button 1: "Log slip"  → POST /api/v1/slip/quick
 *   Action button 2: "Pause"     → POST /api/eap/v1/panic (60 min)
 *
 * Two of the four "actions" from the EAP spec map to the buttons
 * above. The remaining two ("Hear today's status" and the implicit
 * "show recent danger windows") are not exposed in v0.1 because:
 *   - Android Auto's PaneTemplate caps action count at 2 (Pane has
 *     getActionCountForTemplate() = 2 per the platform docs)
 *   - A separate Screen for hear-status would require navigation
 *     into a SignInTemplate-or-Message branch, which we'll add
 *     when we ship voice support post-Apps-for-Cars approval
 *
 * Honest scope: this is a status-display + quick-action surface, not
 * an intervention surface. We cannot fire a haptic on the car's
 * seat, cannot dim the head unit's screen, cannot override the
 * car's audio focus. Per EAP spec table this is ~30% actuator
 * coverage.
 */
class CoylScreen(carContext: CarContext) : Screen(carContext) {

    // -------- Coroutine + HTTP --------

    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .callTimeout(10, TimeUnit.SECONDS)
        .build()

    // Track an in-flight job so a double-tap on a button doesn't
    // queue two POSTs simultaneously.
    private var inFlight: Job? = null

    // -------- Cached state --------
    //
    // The phone-side coordinator (in :app) writes the latest self-
    // trust score + day number to SharedPreferences under the name
    // "coyl.auto.cache" whenever a status refresh succeeds. We read
    // synchronously on every screen invalidation; values displayed
    // are last-known-good and degrade gracefully when offline.

    private val prefs: SharedPreferences by lazy {
        carContext.getSharedPreferences("coyl.auto.cache", android.content.Context.MODE_PRIVATE)
    }

    private val selfTrustScore: Int
        get() = prefs.getInt("self_trust_score", 78)

    private val dayNumber: Int
        get() = prefs.getInt("day_number", 47)

    private val authToken: String?
        get() = prefs.getString("eap_access_token", null)

    // -------- Template --------

    override fun onGetTemplate(): Template {
        val paneBuilder = Pane.Builder()
            .addRow(
                Row.Builder()
                    .setTitle("Self-Trust Score")
                    .addText(CarText.create(selfTrustScore.toString()))
                    .build()
            )
            .addRow(
                Row.Builder()
                    .setTitle("Day Number")
                    .addText(CarText.create(dayNumber.toString()))
                    .build()
            )
            .addAction(
                Action.Builder()
                    .setTitle("Log slip")
                    .setBackgroundColor(CarColor.SECONDARY)
                    .setOnClickListener { onLogSlipClicked() }
                    .build()
            )
            .addAction(
                Action.Builder()
                    .setTitle("Pause")
                    .setBackgroundColor(CarColor.SECONDARY)
                    .setOnClickListener { onPauseClicked() }
                    .build()
            )

        return PaneTemplate.Builder(paneBuilder.build())
            .setTitle("COYL")
            .setHeaderAction(Action.APP_ICON)
            .build()
    }

    // -------- Action handlers --------

    private fun onLogSlipClicked() {
        if (inFlight?.isActive == true) return
        inFlight = coroutineScope.launch {
            val ok = withContext(Dispatchers.IO) {
                postJson(
                    url = "$BASE_URL/api/v1/slip/quick",
                    body = JSONObject().apply { put("source", "android_auto") }
                )
            }
            CarToast.makeText(
                carContext,
                if (ok) "Slip logged" else "Couldn't log right now",
                CarToast.LENGTH_SHORT
            ).show()
            invalidate()
        }
    }

    private fun onPauseClicked() {
        if (inFlight?.isActive == true) return
        inFlight = coroutineScope.launch {
            val ok = withContext(Dispatchers.IO) {
                postJson(
                    url = "$BASE_URL/api/eap/v1/panic",
                    body = JSONObject().apply {
                        put("source", "android_auto")
                        put("durationMinutes", 60)
                    }
                )
            }
            CarToast.makeText(
                carContext,
                if (ok) "COYL paused 1 hour" else "Couldn't pause right now",
                CarToast.LENGTH_SHORT
            ).show()
            invalidate()
        }
    }

    // -------- HTTP --------

    private fun postJson(url: String, body: JSONObject): Boolean {
        return try {
            val requestBody = body.toString()
                .toRequestBody("application/json".toMediaType())
            val builder = Request.Builder()
                .url(url)
                .post(requestBody)
            authToken?.let { builder.header("Authorization", "Bearer $it") }
            httpClient.newCall(builder.build()).execute().use { response ->
                response.isSuccessful
            }
        } catch (_: Exception) {
            false
        }
    }

    companion object {
        private const val BASE_URL = "https://coyl.ai"
    }
}
