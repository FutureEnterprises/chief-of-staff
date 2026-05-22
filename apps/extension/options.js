/**
 * Options page — manage watchlist, thresholds, mutes, AND EAP scope
 * toggles. All non-EAP state is local (chrome.storage.local). EAP
 * scope grants are dual-written: cached in storage so the coordinator
 * can advertise them in the manifest, AND POSTed to
 * /api/v1/scope/grant so the backend ScopeGrant table is the source
 * of truth.
 */

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  MUTES: 'coyl_mutes',
  THRESHOLDS: 'coyl_thresholds',
  EAP_SCOPES: 'coyl_eap_user_granted_scopes',
  EAP_PARTNER_SLUG: 'coyl_eap_partner_slug',
}

/**
 * The 9 EAP scope toggles surfaced to the user. Eight proactive
 * categories + one read scope (so the LLM can observe context without
 * yet having authority to fire). The full vocabulary is broader (see
 * docs/protocol/edge-ai-protocol.md §8 and proactive-ai-protocol.md
 * §Auth); we surface only the user-facing categories on this page.
 * Browser-specific edge:browser:* scopes are implicitly granted by
 * having the extension installed and don't need a checkbox.
 */
const EAP_SCOPE_OPTIONS = [
  { id: 'proactive_food', label: 'Food + eating', hint: 'late-night snack, binge prevention' },
  { id: 'proactive_focus', label: 'Focus + work', hint: 'doom-scroll mid-flow, distraction during deep work' },
  { id: 'proactive_relational', label: 'Relational', hint: "messages you shouldn't send" },
  { id: 'proactive_sleep', label: 'Sleep', hint: 'late-night wind-down nudges' },
  { id: 'proactive_purchase', label: 'Purchase', hint: 'impulse buy prevention' },
  { id: 'proactive_recovery', label: 'Recovery', hint: 'post-slip support' },
  {
    id: 'proactive_substance',
    label: 'Substance (sensitive)',
    hint: 'alcohol / nicotine — extra confirmation enforced',
  },
  {
    id: 'proactive_mood',
    label: 'Mood (clinical caveat)',
    hint: 'mood-state interventions — not a substitute for clinical care',
  },
  { id: 'read_observation', label: 'Read observation', hint: 'read BCO only, no firing authority' },
]

const DEFAULT_PARTNER_SLUG = 'anthropic-claude-sonnet-3.7'

async function load() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.WATCHLIST,
    STORAGE_KEYS.MUTES,
    STORAGE_KEYS.THRESHOLDS,
    STORAGE_KEYS.EAP_SCOPES,
    STORAGE_KEYS.EAP_PARTNER_SLUG,
  ])

  renderWatchlist(data[STORAGE_KEYS.WATCHLIST] ?? [])
  renderMutes(data[STORAGE_KEYS.MUTES] ?? {})
  renderThresholds(data[STORAGE_KEYS.THRESHOLDS] ?? { count: 3, windowMs: 600000 })
  renderEapScopes(
    data[STORAGE_KEYS.EAP_SCOPES] ?? [],
    data[STORAGE_KEYS.EAP_PARTNER_SLUG] ?? DEFAULT_PARTNER_SLUG,
  )
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

// ----------------------------------------------------------------------
// EAP scope toggles
// ----------------------------------------------------------------------

/**
 * Render the 9 EAP scope checkboxes. `granted` is the array of scope
 * ids currently saved. `partnerSlug` is the LLM partner the grants
 * target — defaults to anthropic-claude-sonnet-3.7 but the user can
 * override it (rare; mostly there for the second-foundation-lab
 * partnership when it lands).
 */
function renderEapScopes(granted, partnerSlug) {
  const ul = document.getElementById('eap-scopes')
  if (!ul) return
  const grantedSet = new Set(Array.isArray(granted) ? granted : [])
  ul.innerHTML = ''
  for (const opt of EAP_SCOPE_OPTIONS) {
    const li = document.createElement('li')
    li.innerHTML = `
      <label style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer;">
        <input type="checkbox" data-eap-scope="${escapeHtml(opt.id)}" ${grantedSet.has(opt.id) ? 'checked' : ''} />
        <span>
          ${escapeHtml(opt.label)}
          <small class="muted" style="display:block; margin-top:2px;">${escapeHtml(opt.hint)}</small>
        </span>
      </label>
    `
    ul.appendChild(li)
  }

  const slugInput = document.getElementById('eap-partner-slug')
  if (slugInput && !slugInput.value) slugInput.value = partnerSlug
}

/**
 * Diff the checkboxes against the stored scope list, persist locally,
 * and POST any newly-checked scopes to /api/v1/scope/grant. Currently
 * unchecked-from-checked are surfaced as a status message — full
 * revoke wiring will land via /api/v1/scope/revoke once the surface
 * is finalized (handled by the sibling backend agent).
 */
async function saveEapScopes() {
  const statusEl = document.getElementById('eap-save-status')
  const setStatus = (msg, color) => {
    if (!statusEl) return
    statusEl.textContent = msg
    statusEl.style.color = color || ''
  }

  const slugInput = document.getElementById('eap-partner-slug')
  const partnerSlug =
    (slugInput && slugInput.value && slugInput.value.trim()) || DEFAULT_PARTNER_SLUG

  // Read current checkbox state.
  const boxes = document.querySelectorAll('[data-eap-scope]')
  const nextScopes = []
  boxes.forEach((b) => {
    if (b.checked) nextScopes.push(b.dataset.eapScope)
  })

  // Diff vs. prior state to detect newly granted scopes.
  const prior = await chrome.storage.local.get([STORAGE_KEYS.EAP_SCOPES])
  const priorList = Array.isArray(prior[STORAGE_KEYS.EAP_SCOPES])
    ? prior[STORAGE_KEYS.EAP_SCOPES]
    : []
  const priorSet = new Set(priorList)
  const newlyGranted = nextScopes.filter((s) => !priorSet.has(s))
  const newlyRevoked = priorList.filter((s) => !nextScopes.includes(s))

  // Persist locally first so a network failure on the POST doesn't
  // strand the UI in a half-saved state.
  await chrome.storage.local.set({
    [STORAGE_KEYS.EAP_SCOPES]: nextScopes,
    [STORAGE_KEYS.EAP_PARTNER_SLUG]: partnerSlug,
  })

  // POST newly granted scopes. /api/v1/scope/grant is idempotent on
  // (user, partner, scope) so re-POSTing an already-granted scope is
  // a refresh, not a duplicate row.
  if (newlyGranted.length > 0) {
    setStatus('Saving…')
    try {
      const res = await fetch('https://coyl.ai/api/v1/scope/grant', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmPartnerSlug: partnerSlug,
          scope: newlyGranted,
        }),
      })
      if (res.status === 401) {
        setStatus('Sign in to coyl.ai first.', '#ff6600')
        return
      }
      if (!res.ok) {
        setStatus(`Grant failed (${res.status})`, '#ff6600')
        return
      }
    } catch (err) {
      setStatus('Grant failed — network error.', '#ff6600')
      return
    }
  }

  // Notify the EAP coordinator to re-register the device manifest so
  // the backend's view of userGrantedScopes catches up immediately
  // (otherwise we'd wait up to an hour for the re-register alarm).
  try {
    chrome.runtime.sendMessage({ type: 'COYL_EAP_SCOPES_UPDATED' }, () => {
      // Swallow lastError — the message channel may have no listener
      // in some edge cases (e.g. options page opened before SW boot).
      void chrome.runtime.lastError
    })
  } catch {
    // sendMessage may throw in some browsers when there's no listener;
    // we surface it as a successful save anyway since storage IS updated.
  }

  if (newlyRevoked.length > 0) {
    setStatus(
      `Saved. ${newlyRevoked.length} scope${newlyRevoked.length === 1 ? '' : 's'} marked revoked — re-grant from coyl.ai to remove server-side.`,
      '#8a8f98',
    )
  } else if (newlyGranted.length > 0) {
    setStatus(`Saved. ${newlyGranted.length} new grant${newlyGranted.length === 1 ? '' : 's'}.`, '#8a8f98')
  } else {
    setStatus('Saved.', '#8a8f98')
  }
}

const eapSaveBtn = document.getElementById('eap-save-scopes')
if (eapSaveBtn) eapSaveBtn.addEventListener('click', saveEapScopes)

load()
