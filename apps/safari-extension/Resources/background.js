/**
 * COYL Safari Web Extension — background service worker (Manifest V3)
 *
 * Same behaviour as the Chrome/Firefox/Edge build at apps/extension/,
 * but uses the WebExtensions standard `browser.*` namespace which
 * Safari and Firefox prefer. Safari 16.4+ supports Manifest V3 service
 * workers via this exact shape.
 *
 * Responsibilities:
 *  1. Track tab switches into watchlisted domains (the doom-scroll sites)
 *  2. Count consecutive opens of the same domain within a window
 *  3. Trigger an interrupt overlay when the count crosses the threshold
 *  4. Sync interrupt feedback (helpful / not-the-moment) back to coyl.ai
 *
 * Design notes:
 *  - Service worker is event-driven; we can't keep persistent state in
 *    memory across wake/sleep. All state lives in browser.storage.local.
 *  - The interrupt overlay is injected by the content script; this
 *    service worker just signals "fire" via browser.tabs.sendMessage.
 *  - User can mute a domain for 1h / 1d / forever via the overlay; the
 *    mute list lives in storage.local.
 *
 * Auth + sync to coyl.ai: deferred to v0.2.
 */

// Safari and Firefox expose `browser`; Chrome aliases it to `chrome`. We
// also fall back to `chrome` in case the polyfill ever hasn't loaded.
const ext = typeof browser !== 'undefined' ? browser : chrome

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  MUTES: 'coyl_mutes',
  COUNTS: 'coyl_recent_opens',
  THRESHOLDS: 'coyl_thresholds',
}

const DEFAULT_THRESHOLDS = {
  // How many times in the last `windowMs` the user has to open a
  // watched domain before we fire an interrupt overlay.
  count: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
}

const DEFAULT_WATCHLIST = [
  'reddit.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
  'news.ycombinator.com',
]

// First-install bootstrap — populate the default watchlist + thresholds.
ext.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await ext.storage.local.set({
      [STORAGE_KEYS.WATCHLIST]: DEFAULT_WATCHLIST,
      [STORAGE_KEYS.MUTES]: {},
      [STORAGE_KEYS.COUNTS]: {},
      [STORAGE_KEYS.THRESHOLDS]: DEFAULT_THRESHOLDS,
    })
  }
})

/**
 * Pull a clean hostname (no www., no path) from a tab URL. Returns
 * null if the URL is internal (chrome://, about:, file:).
 */
function hostnameOf(url) {
  try {
    const u = new URL(url)
    if (!u.protocol.startsWith('http')) return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Is this hostname on the watchlist?
 * Matches both exact and subdomain (e.g. m.reddit.com matches reddit.com).
 */
function matchesWatchlist(host, watchlist) {
  if (!host) return false
  return watchlist.some((w) => host === w || host.endsWith('.' + w))
}

/**
 * Is this domain currently muted?
 */
function isMuted(host, mutes) {
  const now = Date.now()
  // exact + parent-domain match
  for (const muted of Object.keys(mutes ?? {})) {
    if (host === muted || host.endsWith('.' + muted)) {
      const expiresAt = mutes[muted]
      if (expiresAt === 'forever' || expiresAt > now) return true
    }
  }
  return false
}

/**
 * Recent-opens counter. Sliding window per domain.
 */
async function recordOpen(host) {
  const { [STORAGE_KEYS.COUNTS]: counts = {}, [STORAGE_KEYS.THRESHOLDS]: thresholds = DEFAULT_THRESHOLDS } =
    await ext.storage.local.get([STORAGE_KEYS.COUNTS, STORAGE_KEYS.THRESHOLDS])

  const now = Date.now()
  const cutoff = now - thresholds.windowMs
  const opens = (counts[host] ?? []).filter((t) => t > cutoff)
  opens.push(now)
  counts[host] = opens

  await ext.storage.local.set({ [STORAGE_KEYS.COUNTS]: counts })

  return { count: opens.length, threshold: thresholds.count }
}

/**
 * The main tab-switch handler. When a tab loads a watchlisted domain
 * AND the user has crossed the open-count threshold AND it's not
 * muted, signal the content script to render the interrupt overlay.
 */
async function handleTabUpdate(tabId, changeInfo, tab) {
  // Only process URL changes (not status, audible, etc.)
  if (!changeInfo.url && changeInfo.status !== 'loading') return

  const url = tab.url ?? changeInfo.url
  const host = hostnameOf(url)
  if (!host) return

  const {
    [STORAGE_KEYS.WATCHLIST]: watchlist = DEFAULT_WATCHLIST,
    [STORAGE_KEYS.MUTES]: mutes = {},
  } = await ext.storage.local.get([STORAGE_KEYS.WATCHLIST, STORAGE_KEYS.MUTES])

  if (!matchesWatchlist(host, watchlist)) return
  if (isMuted(host, mutes)) return

  const { count, threshold } = await recordOpen(host)
  if (count < threshold) return

  // Fire the interrupt. Content script handles the actual overlay
  // injection so we can render rich HTML without CSP issues from the
  // service worker.
  try {
    await ext.tabs.sendMessage(tabId, {
      type: 'COYL_FIRE_INTERRUPT',
      host,
      count,
      threshold,
    })
  } catch (err) {
    // Content script may not have loaded yet on document_start; the
    // next page event will retry. Don't log noisily.
  }
}

ext.tabs.onUpdated.addListener(handleTabUpdate)

/**
 * Keyboard shortcut — Cmd+Shift+L (Mac) / Ctrl+Shift+L (Win) fires a
 * one-tap slip log against coyl.ai. credentials: 'include' picks up the
 * Clerk session cookie if the user is signed in; on 401 we open the
 * sign-in popup. Removes the last bit of friction for the user who's
 * already inside a doom-scroll tab — no app switch, no modal, just confess.
 */
ext.commands.onCommand.addListener(async (command) => {
  if (command !== 'quick-slip') return
  try {
    const res = await fetch('https://coyl.ai/api/v1/slip/quick', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.status === 401) {
      await ext.tabs.create({ url: 'https://coyl.ai/sign-in?from=extension' })
      return
    }
    if (res.ok) {
      ext.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Slip logged.',
        message: 'Streak preserved. Tap the COYL tab if you need rescue.',
      })
    }
  } catch {
    // network or extension-context error — silent, user can retry
  }
})

/**
 * Inbound messages from content script — user reactions to the
 * interrupt overlay. Mute decisions, feedback, "open rescue" routing.
 */
ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    if (message.type === 'COYL_MUTE') {
      const { host, duration } = message
      const { [STORAGE_KEYS.MUTES]: mutes = {} } = await ext.storage.local.get(STORAGE_KEYS.MUTES)
      const expiresAt =
        duration === 'forever' ? 'forever' :
        duration === '1d' ? Date.now() + 24 * 60 * 60 * 1000 :
        Date.now() + 60 * 60 * 1000 // default 1h
      mutes[host] = expiresAt
      await ext.storage.local.set({ [STORAGE_KEYS.MUTES]: mutes })
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'COYL_FEEDBACK') {
      // v0.1: log locally. v0.2: POST to coyl.ai/api/v1/events with
      // INTERRUPT_FEEDBACK eventType (auth via OAuth flow first).
      console.log('[coyl-safari-ext] feedback', message)
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'COYL_OPEN_RESCUE') {
      await ext.tabs.create({ url: 'https://coyl.ai/rescue?from=extension' })
      sendResponse({ ok: true })
      return
    }
  })()
  return true // async sendResponse
})
