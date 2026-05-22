package ai.coyl.eap.wear

import android.content.ComponentName
import android.content.Context
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import androidx.wear.watchface.complications.datasource.ComplicationRequest

/**
 * Watch face complication showing the Self-Trust Score + day number.
 *
 * Supported types: SHORT_TEXT (e.g. "78 · D14") and RANGED_VALUE
 * (0..100 dial with current score).
 *
 * Refresh path: WorkManager periodic (every 1h) → fetch latest score from
 * coyl.ai → cache via WearAuth → call requestRefresh() to invalidate the
 * complication frame.
 */
class WearComplicationProvider : ComplicationDataSourceService() {

    override fun getPreviewData(type: ComplicationType): ComplicationData? = when (type) {
        ComplicationType.SHORT_TEXT -> shortText(78, dayNumber = 14)
        ComplicationType.RANGED_VALUE -> ranged(78)
        else -> null
    }

    override fun onComplicationRequest(
        request: ComplicationRequest,
        listener: ComplicationRequestListener
    ) {
        val score = WearAuth.selfTrustScore(applicationContext)
        val dayNumber = (System.currentTimeMillis() / (1000L * 60 * 60 * 24)).toInt() % 365 + 1
        val data: ComplicationData? = when (request.complicationType) {
            ComplicationType.SHORT_TEXT -> shortText(score.takeIf { it >= 0 }, dayNumber)
            ComplicationType.RANGED_VALUE -> ranged(score.takeIf { it >= 0 } ?: 50)
            else -> null
        }
        listener.onComplicationData(data)
    }

    private fun shortText(score: Int?, dayNumber: Int): ComplicationData {
        val label = if (score == null) "—" else "$score"
        val text = PlainComplicationText.Builder("$label · D$dayNumber").build()
        return ShortTextComplicationData.Builder(
            text = text,
            contentDescription = PlainComplicationText.Builder("Self-Trust Score $label, day $dayNumber").build()
        ).build()
    }

    private fun ranged(score: Int): ComplicationData =
        RangedValueComplicationData.Builder(
            value = score.toFloat(),
            min = 0f,
            max = 100f,
            contentDescription = PlainComplicationText.Builder("Self-Trust Score $score").build()
        ).setText(PlainComplicationText.Builder("$score").build()).build()

    companion object {
        /** Invalidate the complication so the watch face re-renders. */
        fun requestRefresh(ctx: Context) {
            val requester = ComplicationDataSourceUpdateRequester.create(
                ctx,
                ComponentName(ctx, WearComplicationProvider::class.java)
            )
            requester.requestUpdateAll()
        }
    }
}
