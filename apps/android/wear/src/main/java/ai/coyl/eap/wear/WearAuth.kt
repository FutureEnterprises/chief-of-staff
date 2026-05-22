package ai.coyl.eap.wear

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/** Mirror of phone-side Auth, scoped to the watch's local key store. */
object WearAuth {
    private const val FILE = "coyl_wear_secure"
    private const val KEY_BEARER = "bearer_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_SCORE = "self_trust_score"

    @Volatile private var prefs: SharedPreferences? = null

    private fun prefs(ctx: Context): SharedPreferences {
        prefs?.let { return it }
        synchronized(this) {
            prefs?.let { return it }
            val mk = MasterKey.Builder(ctx).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
            val sp = EncryptedSharedPreferences.create(
                ctx.applicationContext, FILE, mk,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            prefs = sp
            return sp
        }
    }

    fun bearer(ctx: Context): String? = prefs(ctx).getString(KEY_BEARER, null)
    fun saveBearer(ctx: Context, t: String) = prefs(ctx).edit().putString(KEY_BEARER, t).apply()

    fun userId(ctx: Context): String? = prefs(ctx).getString(KEY_USER_ID, null)
    fun saveUserId(ctx: Context, u: String) = prefs(ctx).edit().putString(KEY_USER_ID, u).apply()

    fun deviceId(ctx: Context): String? = prefs(ctx).getString(KEY_DEVICE_ID, null)
    fun saveDeviceId(ctx: Context, d: String) = prefs(ctx).edit().putString(KEY_DEVICE_ID, d).apply()

    /** Cached self-trust score for the complication; refreshed hourly. */
    fun selfTrustScore(ctx: Context): Int = prefs(ctx).getInt(KEY_SCORE, -1)
    fun saveSelfTrustScore(ctx: Context, score: Int) =
        prefs(ctx).edit().putInt(KEY_SCORE, score).apply()
}
