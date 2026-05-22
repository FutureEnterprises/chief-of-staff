/**
 * Safari extension options page — manage watchlist, thresholds, mutes.
 * All state in browser.storage.local. Future v0.2 syncs across devices
 * via OAuth.
 */

const ext = typeof browser !== 'undefined' ? browser : chrome

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  MUTES: 'coyl_mutes',
  THRESHOLDS: 'coyl_thresholds',
}

async function load() {
  const data = await ext.storage.local.get([
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
      const { [STORAGE_KEYS.WATCHLIST]: wl = [] } = await ext.storage.local.get(STORAGE_KEYS.WATCHLIST)
      const next = wl.filter((x) => x !== b.dataset.remove)
      await ext.storage.local.set({ [STORAGE_KEYS.WATCHLIST]: next })
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
      const { [STORAGE_KEYS.MUTES]: m = {} } = await ext.storage.local.get(STORAGE_KEYS.MUTES)
      delete m[b.dataset.unmute]
      await ext.storage.local.set({ [STORAGE_KEYS.MUTES]: m })
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
  const { [STORAGE_KEYS.WATCHLIST]: wl = [] } = await ext.storage.local.get(STORAGE_KEYS.WATCHLIST)
  if (!wl.includes(raw)) wl.push(raw)
  await ext.storage.local.set({ [STORAGE_KEYS.WATCHLIST]: wl })
  input.value = ''
  load()
})

document.getElementById('threshold-count').addEventListener('change', persistThresholds)
document.getElementById('threshold-window').addEventListener('change', persistThresholds)

async function persistThresholds() {
  const count = parseInt(document.getElementById('threshold-count').value, 10) || 3
  const minutes = parseInt(document.getElementById('threshold-window').value, 10) || 10
  await ext.storage.local.set({
    [STORAGE_KEYS.THRESHOLDS]: { count, windowMs: minutes * 60000 },
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

// ---------- EAP scope-grant toggles ----------

const EAP_SCOPES = [
  {
    scope: 'edge:browser:notification',
    label: 'Show notifications',
    desc: 'macOS Notification Center pings. Requires per-site grant in System Settings.',
  },
  {
    scope: 'edge:browser:overlay',
    label: 'Fire interrupt overlays',
    desc: 'Render an LLM-composed message over the active tab.',
  },
  {
    scope: 'edge:browser:tab_close',
    label: 'Close tabs',
    desc: 'Programmatically close tabs (e.g. close a Reddit tab during a focus block).',
  },
  {
    scope: 'edge:browser:tab_open',
    label: 'Open and navigate tabs',
    desc: 'Create new tabs or navigate the active tab to a URL.',
  },
  {
    scope: 'edge:browser:read:active_url',
    label: 'Read active URL host',
    desc: 'Host-only — never the path or query string. e.g. "reddit.com".',
  },
  {
    scope: 'edge:browser:read:tab_count',
    label: 'Read open-tab count',
    desc: 'Total tab count for context. No URLs.',
  },
]

function renderEapScopes(granted) {
  const container = document.getElementById('eap-scopes')
  if (!container) return
  const grantedSet = new Set(Array.isArray(granted) ? granted : [])
  container.innerHTML = ''
  for (const s of EAP_SCOPES) {
    const row = document.createElement('div')
    row.className = 'eap-row'
    row.innerHTML = `
      <label>
        <span class="scope">${escapeHtml(s.label)}</span>
        <span class="desc">${escapeHtml(s.scope)} — ${escapeHtml(s.desc)}</span>
      </label>
      <input type="checkbox" data-eap-scope="${escapeHtml(s.scope)}" ${grantedSet.has(s.scope) ? 'checked' : ''} />
    `
    container.appendChild(row)
  }
  container.querySelectorAll('input[data-eap-scope]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const target = e.currentTarget
      const scope = target.dataset.eapScope
      const checked = target.checked
      const current = new Set(Array.isArray(granted) ? granted : [])
      if (checked) current.add(scope)
      else current.delete(scope)
      granted = Array.from(current)
      await ext.runtime.sendMessage({ type: 'COYL_EAP_SET_SCOPES', scopes: granted })
      void refreshEapStatus()
    })
  })
}

async function refreshEapStatus() {
  const status = await ext.runtime.sendMessage({ type: 'COYL_EAP_STATUS' })
  const el = document.getElementById('eap-status')
  if (!el || !status) return
  if (!status.enabled) {
    el.innerHTML = 'EAP status: <strong>disabled</strong>.'
    return
  }
  if (!status.paired) {
    el.innerHTML = 'EAP status: <strong>enabled but not paired</strong> — set userId + token above.'
    return
  }
  const lastPoll = status.lastPollAt ? new Date(status.lastPollAt).toLocaleTimeString() : 'never'
  const lastReg = status.lastRegisterAt ? new Date(status.lastRegisterAt).toLocaleTimeString() : 'never'
  el.innerHTML =
    `EAP status: <strong>active</strong>. Device <code>${escapeHtml(status.deviceId ?? 'pending')}</code>. ` +
    `Last poll: ${escapeHtml(lastPoll)}. Last register: ${escapeHtml(lastReg)}. ` +
    `Granted scopes: ${status.scopes.length}.`
}

async function loadEapState() {
  const status = await ext.runtime.sendMessage({ type: 'COYL_EAP_STATUS' })
  const enabledInput = document.getElementById('eap-enabled')
  if (status && enabledInput) {
    enabledInput.checked = status.enabled === true
  }
  renderEapScopes(status?.scopes ?? [])
  void refreshEapStatus()
}

const enabledToggle = document.getElementById('eap-enabled')
if (enabledToggle) {
  enabledToggle.addEventListener('change', async (e) => {
    const checked = e.currentTarget.checked
    await ext.runtime.sendMessage({
      type: checked ? 'COYL_EAP_ENABLE' : 'COYL_EAP_DISABLE',
    })
    void refreshEapStatus()
  })
}

const pairingBtn = document.getElementById('eap-save-pairing')
if (pairingBtn) {
  pairingBtn.addEventListener('click', async () => {
    const userId = document.getElementById('eap-user-id').value.trim()
    const partnerToken = document.getElementById('eap-partner-token').value.trim()
    if (!userId || !partnerToken) return
    await ext.runtime.sendMessage({
      type: 'COYL_EAP_SET_PAIRING',
      userId,
      partnerToken,
    })
    // Clear the token field — never display the token after save.
    document.getElementById('eap-partner-token').value = ''
    void refreshEapStatus()
  })
}

load()
void loadEapState()
