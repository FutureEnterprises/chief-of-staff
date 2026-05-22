package ai.coyl.eap

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Compose UI listing the 9 EAP scope categories with toggle switches.
 *
 * On Save: writes each toggle to encrypted SharedPreferences AND POSTs
 * /api/v1/scope/grant for every newly-granted scope.
 *
 * The panic button revokes everything locally + broadcasts PANIC.
 */
class ConsentActivity : ComponentActivity() {

    private val scopes = listOf(
        "edge:phone:notification" to "Push notifications",
        "edge:phone:haptic" to "Vibration",
        "edge:phone:voice" to "Voice (TTS through speaker)",
        "edge:phone:open_url" to "Open URLs",
        "edge:phone:open_app_intent" to "Launch other apps",
        "edge:phone:read:hrv" to "Read heart-rate variability",
        "edge:phone:read:screen_state" to "Read screen on/off",
        "edge:phone:read:location" to "Read coarse geofence location",
        "edge:phone:do_not_disturb" to "Toggle Do-Not-Disturb"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    ConsentScreen(scopes)
                }
            }
        }
    }
}

@Composable
private fun ConsentScreen(scopes: List<Pair<String, String>>) {
    val ctx = LocalContext.current
    val state = remember {
        mutableStateMapOf<String, Boolean>().apply {
            scopes.forEach { (id, _) -> put(id, Auth.scopeGranted(ctx, id)) }
        }
    }
    val coScope = remember { CoroutineScope(SupervisorJob() + Dispatchers.IO) }

    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            stringResource(R.string.consent_title),
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            stringResource(R.string.consent_intro),
            style = MaterialTheme.typography.bodyMedium
        )
        Divider()

        scopes.forEach { (id, label) ->
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(Modifier.padding(end = 12.dp)) {
                    Text(label, style = MaterialTheme.typography.titleSmall)
                    Text(id, style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = state[id] == true,
                    onCheckedChange = { state[id] = it }
                )
            }
        }

        Divider()

        Button(
            onClick = {
                state.forEach { (id, granted) -> Auth.setScopeGranted(ctx, id, granted) }
                coScope.launch { postGrants(ctx, state) }
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.consent_save)) }

        Button(
            onClick = {
                ctx.sendBroadcast(
                    Intent("ai.coyl.eap.PANIC").setPackage(ctx.packageName)
                )
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.consent_panic)) }
    }
}

private suspend fun postGrants(
    ctx: android.content.Context,
    state: Map<String, Boolean>
) {
    val userId = Auth.userId(ctx) ?: return
    val http = EapHttp(ctx)
    state.filter { it.value }.forEach { (scope, _) ->
        http.postJson(
            "/api/v1/scope/grant",
            ScopeGrant(
                userId = userId,
                llmId = "*", // platform-wide for now; future: per-LLM grants
                scope = scope,
                grantedAt = Instant.now().toString()
            )
        )
    }
}
