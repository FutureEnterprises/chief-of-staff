package ai.coyl.eap

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp

/**
 * Minimal launcher.
 *
 * Three buttons:
 *   - Start coordinator → starts the Foreground Service
 *   - Open consent screen → scope-grant UI
 *   - Open Health Connect → forwards to system Health Connect app
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    MainScreen()
                }
            }
        }
    }
}

@Composable
private fun MainScreen() {
    val ctx = LocalContext.current
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = stringResource(R.string.app_name),
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = stringResource(R.string.main_intro),
            style = MaterialTheme.typography.bodyMedium
        )
        Button(onClick = {
            ctx.startForegroundService(Intent(ctx, EAPCoordinatorService::class.java))
        }) {
            Text(stringResource(R.string.main_start_service))
        }
        Button(onClick = {
            ctx.startActivity(Intent(ctx, ConsentActivity::class.java))
        }) {
            Text(stringResource(R.string.main_open_consent))
        }
        Button(onClick = {
            val intent = ctx.packageManager.getLaunchIntentForPackage("com.google.android.apps.healthdata")
                ?: Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata")
                )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
        }) {
            Text(stringResource(R.string.main_open_health_connect))
        }
    }
}
