package ai.coyl.eap

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Encrypted credential + scope-grant storage.
 *
 * Backed by AndroidX Security (Tink-based AES-GCM under the hood). Key
 * lives in the AndroidKeyStore so it cannot leave the device.
 *
 * Token format: `coyl_pap_<llmPartnerId>_<keySecret>` per EAP spec.
 */
object Auth {
    private const val FILE = "coyl_eap_secure"
    private const val KEY_BEARER = "bearer_token"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_SCOPE_PREFIX = "scope_"

    @Volatile private var prefs: SharedPreferences? = null

    private fun prefs(ctx: Context): SharedPreferences {
        prefs?.let { return it }
        synchronized(this) {
            prefs?.let { return it }
            val masterKey = MasterKey.Builder(ctx)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            val sp = EncryptedSharedPreferences.create(
                ctx.applicationContext,
                FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            prefs = sp
            return sp
        }
    }

    fun bearer(ctx: Context): String? = prefs(ctx).getString(KEY_BEARER, null)

    fun saveBearer(ctx: Context, token: String) =
        prefs(ctx).edit().putString(KEY_BEARER, token).apply()

    fun deviceId(ctx: Context): String? = prefs(ctx).getString(KEY_DEVICE_ID, null)

    fun saveDeviceId(ctx: Context, id: String) =
        prefs(ctx).edit().putString(KEY_DEVICE_ID, id).apply()

    fun userId(ctx: Context): String? = prefs(ctx).getString(KEY_USER_ID, null)

    fun saveUserId(ctx: Context, id: String) =
        prefs(ctx).edit().putString(KEY_USER_ID, id).apply()

    fun scopeGranted(ctx: Context, scope: String): Boolean =
        prefs(ctx).getBoolean(KEY_SCOPE_PREFIX + scope, false)

    fun setScopeGranted(ctx: Context, scope: String, granted: Boolean) =
        prefs(ctx).edit().putBoolean(KEY_SCOPE_PREFIX + scope, granted).apply()

    /** Panic — flip every persisted scope to denied. */
    fun revokeAllScopes(ctx: Context) {
        val sp = prefs(ctx)
        val editor = sp.edit()
        sp.all.keys
            .filter { it.startsWith(KEY_SCOPE_PREFIX) }
            .forEach { editor.putBoolean(it, false) }
        editor.apply()
    }
}
