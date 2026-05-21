/**
 * COYL extension popup — surface today's interrupt stats.
 * Pure local data from chrome.storage.local in v0.1. v0.2 syncs to
 * coyl.ai/api/v1/events after OAuth.
 */

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  COUNTS: 'coyl_recent_opens',
  FEEDBACK_LOG: 'coyl_feedback_log',
}

async function render() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.WATCHLIST,
    STORAGE_KEYS.COUNTS,
    STORAGE_KEYS.FEEDBACK_LOG,
  ])

  const watchlist = data[STORAGE_KEYS.WATCHLIST] ?? []
  const counts = data[STORAGE_KEYS.COUNTS] ?? {}
  const feedback = data[STORAGE_KEYS.FEEDBACK_LOG] ?? []

  // Interrupts today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const today = feedback.filter((f) => f.timestamp > startOfDay.getTime()).length
  document.getElementById('today').textContent = String(today)

  // Closed-tab rate
  const helpful = feedback.filter((f) => f.verdict === 'helpful').length
  const rate = feedback.length > 0 ? Math.round((helpful / feedback.length) * 100) : null
  document.getElementById('closed-rate').textContent = rate == null ? '—' : `${rate}%`

  // Watchlist size
  document.getElementById('watchlist-count').textContent = `${watchlist.length} sites`
}

render()
