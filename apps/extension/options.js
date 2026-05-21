/**
 * Options page — manage watchlist, thresholds, mutes. All state in
 * chrome.storage.local. Future v0.2 syncs across devices via OAuth.
 */

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  MUTES: 'coyl_mutes',
  THRESHOLDS: 'coyl_thresholds',
}

async function load() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.WATCHLIST,
    STORAGE_KEYS.MUTES,
    STORAGE_KEYS.THRESHOLDS,
  ])

  renderWatchlist(data[STORAGE_KEYS.WATCHLIST] ?? [])
  renderMutes(data[STORAGE_KEYS.MUTES] ?? {})
  renderThresholds(data[STORAGE_KEYS.THRESHOLDS] ?? { count: 3, windowMs: 600000 })
}

function renderWatchlist(domains) {
  const ul = document.getElementById('watchlist')
  ul.innerHTML = ''
  if (domains.length === 0) {
    ul.innerHTML = '<li class="muted">No domains watched yet.</li>'
    return
  }
  for (const d of domains) {
    const li = document.createElement('li')
    li.innerHTML = `<span>${escapeHtml(d)}</span><button data-remove="${escapeHtml(d)}">Remove</button>`
    ul.appendChild(li)
  }
  ul.querySelectorAll('[data-remove]').forEach((b) => {
    b.addEventListener('click', async () => {
      const { [STORAGE_KEYS.WATCHLIST]: wl = [] } = await chrome.storage.local.get(STORAGE_KEYS.WATCHLIST)
      const next = wl.filter((x) => x !== b.dataset.remove)
      await chrome.storage.local.set({ [STORAGE_KEYS.WATCHLIST]: next })
      load()
    })
  })
}

function renderMutes(mutes) {
  const ul = document.getElementById('muted')
  const entries = Object.entries(mutes)
  ul.innerHTML = ''
  if (entries.length === 0) {
    ul.innerHTML = '<li class="muted">Nothing muted.</li>'
    return
  }
  for (const [host, expiresAt] of entries) {
    const li = document.createElement('li')
    const expiresText =
      expiresAt === 'forever'
        ? 'Forever'
        : expiresAt > Date.now()
          ? new Date(expiresAt).toLocaleString()
          : 'Expired'
    li.innerHTML = `<span>${escapeHtml(host)} <small class="muted">— ${escapeHtml(expiresText)}</small></span><button data-unmute="${escapeHtml(host)}">Unmute</button>`
    ul.appendChild(li)
  }
  ul.querySelectorAll('[data-unmute]').forEach((b) => {
    b.addEventListener('click', async () => {
      const { [STORAGE_KEYS.MUTES]: m = {} } = await chrome.storage.local.get(STORAGE_KEYS.MUTES)
      delete m[b.dataset.unmute]
      await chrome.storage.local.set({ [STORAGE_KEYS.MUTES]: m })
      load()
    })
  })
}

function renderThresholds(t) {
  document.getElementById('threshold-count').value = String(t.count ?? 3)
  document.getElementById('threshold-window').value = String(Math.round((t.windowMs ?? 600000) / 60000))
}

document.getElementById('add-domain').addEventListener('click', async () => {
  const input = document.getElementById('new-domain')
  const raw = input.value.trim().toLowerCase().replace(/^www\./, '')
  if (!raw) return
  const { [STORAGE_KEYS.WATCHLIST]: wl = [] } = await chrome.storage.local.get(STORAGE_KEYS.WATCHLIST)
  if (!wl.includes(raw)) wl.push(raw)
  await chrome.storage.local.set({ [STORAGE_KEYS.WATCHLIST]: wl })
  input.value = ''
  load()
})

document.getElementById('threshold-count').addEventListener('change', persistThresholds)
document.getElementById('threshold-window').addEventListener('change', persistThresholds)

async function persistThresholds() {
  const count = parseInt(document.getElementById('threshold-count').value, 10) || 3
  const minutes = parseInt(document.getElementById('threshold-window').value, 10) || 10
  await chrome.storage.local.set({
    [STORAGE_KEYS.THRESHOLDS]: { count, windowMs: minutes * 60000 },
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

load()
