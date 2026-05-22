package ai.coyl.eap

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.serializer
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

/**
 * Thin OkHttp wrapper for the EAP coordinator endpoints.
 *
 * Bearer header is injected per request from encrypted storage. All calls
 * happen off the main thread via `withContext(Dispatchers.IO)`.
 */
class EapHttp(private val ctx: Context) {

    private val baseUrl: String = BuildConfig.EAP_BASE_URL
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private val client: OkHttpClient by lazy {
        val log = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
            else HttpLoggingInterceptor.Level.NONE
        }
        OkHttpClient.Builder()
            .addInterceptor(log)
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    private fun authHeader(): String? = Auth.bearer(ctx)?.let { "Bearer $it" }

    /**
     * Generic POST helper. Uses an inline reified entry to surface the
     * KSerializer<T> at the call site, then delegates to the non-inline
     * worker which is allowed to access private members.
     */
    suspend inline fun <reified T> postJson(path: String, body: T): String? =
        postJsonInternal(path, body, serializer())

    @PublishedApi
    internal suspend fun <T> postJsonInternal(
        path: String,
        body: T,
        serializer: KSerializer<T>,
    ): String? = withContext(Dispatchers.IO) {
        val payload = EapApi.json.encodeToString(serializer, body)
        val req = Request.Builder()
            .url(baseUrl + path)
            .post(payload.toRequestBody(jsonMedia))
            .also { authHeader()?.let { h -> it.addHeader("Authorization", h) } }
            .addHeader("Content-Type", "application/json")
            .build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) null else resp.body?.string()
        }
    }

    suspend fun getRaw(path: String): String? = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url(baseUrl + path)
            .get()
            .also { authHeader()?.let { h -> it.addHeader("Authorization", h) } }
            .build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) null else resp.body?.string()
        }
    }
}
