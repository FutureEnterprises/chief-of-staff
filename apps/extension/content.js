/**
 * COYL Browser Extension — content script
 *
 * Injected into watchlisted domains. Listens for the
 * COYL_FIRE_INTERRUPT message from the background service worker and
 * renders a full-screen overlay BEFORE the page is interactable. This
 * is the "tab-switch interrupt before the doom-scroll starts."
 *
 * The overlay is built in vanilla JS (no React) to keep the bundle
 * <5KB and the inject-to-render latency <50ms.
 */

let overlayShown = false

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'COYL_FIRE_INTERRUPT' && !overlayShown) {
    overlayShown = true
    showInterruptOverlay(message.host, message.count)
  }
})

function showInterruptOverlay(host, count) {
  // Idempotency — never double-render
  if (document.getElementById('coyl-interrupt-root')) return

  const root = document.createElement('div')
  root.id = 'coyl-interrupt-root'
  root.setAttribute(
    'style',
    [
      'all: initial',
      'position: fixed',
      'inset: 0',
      'z-index: 2147483647',
      'background: rgba(8, 9, 10, 0.96)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-family: -apple-system, system-ui, sans-serif',
      'color: #f7f8f8',
      'backdrop-filter: blur(8px)',
    ].join(';'),
  )

  const card = document.createElement('div')
  card.setAttribute(
    'style',
    [
      'max-width: 540px',
      'width: 90%',
      'background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
      'border: 1px solid #23252a',
      'border-radius: 16px',
      'padding: 32px',
      'box-shadow: 0 0 60px -10px rgba(255, 102, 0, 0.35)',
    ].join(';'),
  )

  card.innerHTML = `
    <p style="all: initial; font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #ff8533; margin: 0;">
      ${count}× in 10 minutes &middot; this is the loop
    </p>
    <h1 style="all: initial; display: block; font-family: -apple-system, system-ui, sans-serif; color: #ffffff; font-size: 32px; font-weight: 900; line-height: 1.1; letter-spacing: -0.02em; margin-top: 12px; margin-bottom: 12px;">
      ${escapeHtml(host)}.
    </h1>
    <p style="all: initial; display: block; font-family: -apple-system, system-ui, sans-serif; color: #8a8f98; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
      You opened this ${count} times in the last 10 minutes. The next 30 seconds is the decision.
    </p>

    <div style="all: initial; display: flex; flex-direction: column; gap: 8px;">
      <button data-coyl-action="close-tab" style="all: initial; cursor: pointer; display: block; box-sizing: border-box; width: 100%; padding: 12px 20px; border-radius: 9999px; background: linear-gradient(to right, #ff6600, #ff3d00); color: white; font-family: -apple-system, system-ui, sans-serif; font-size: 14px; font-weight: 700; text-align: center;">
        Close the tab
      </button>
      <button data-coyl-action="open-rescue" style="all: initial; cursor: pointer; display: block; box-sizing: border-box; width: 100%; padding: 12px 20px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: #f7f8f8; font-family: -apple-system, system-ui, sans-serif; font-size: 14px; font-weight: 600; text-align: center;">
        Open rescue on coyl.ai
      </button>
      <button data-coyl-action="continue-1min" style="all: initial; cursor: pointer; display: block; box-sizing: border-box; width: 100%; padding: 10px 20px; border-radius: 9999px; background: transparent; color: #8a8f98; font-family: -apple-system, system-ui, sans-serif; font-size: 13px; text-align: center;">
        Continue (1 minute, then I&rsquo;m out)
      </button>
    </div>

    <div style="all: initial; display: flex; gap: 8px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
      <button data-coyl-action="mute-1h" style="all: initial; cursor: pointer; padding: 6px 12px; border-radius: 9999px; background: rgba(255,255,255,0.03); color: #8a8f98; font-family: -apple-system, system-ui, sans-serif; font-size: 11px;">
        Mute 1h
      </button>
      <button data-coyl-action="mute-1d" style="all: initial; cursor: pointer; padding: 6px 12px; border-radius: 9999px; background: rgba(255,255,255,0.03); color: #8a8f98; font-family: -apple-system, system-ui, sans-serif; font-size: 11px;">
        Mute 1d
      </button>
      <button data-coyl-action="mute-forever" style="all: initial; cursor: pointer; padding: 6px 12px; border-radius: 9999px; background: rgba(255,255,255,0.03); color: #8a8f98; font-family: -apple-system, system-ui, sans-serif; font-size: 11px;">
        Mute forever
      </button>
    </div>
  `

  root.appendChild(card)
  document.documentElement.appendChild(root)

  // Action wiring
  card.querySelectorAll('[data-coyl-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.coylAction, host))
  })
}

function dismissOverlay() {
  const root = document.getElementById('coyl-interrupt-root')
  if (root) root.remove()
  overlayShown = false
}

function handleAction(action, host) {
  switch (action) {
    case 'close-tab':
      sendFeedback('helpful', host)
      window.close()
      // window.close() doesn't work on top-level tabs — fall back to
      // navigating to about:blank so the user can close manually
      window.location.replace('about:blank')
      break
    case 'open-rescue':
      sendFeedback('helpful', host)
      chrome.runtime.sendMessage({ type: 'COYL_OPEN_RESCUE' })
      dismissOverlay()
      break
    case 'continue-1min':
      sendFeedback('not_helpful', host)
      dismissOverlay()
      break
    case 'mute-1h':
      chrome.runtime.sendMessage({ type: 'COYL_MUTE', host, duration: '1h' })
      dismissOverlay()
      break
    case 'mute-1d':
      chrome.runtime.sendMessage({ type: 'COYL_MUTE', host, duration: '1d' })
      dismissOverlay()
      break
    case 'mute-forever':
      chrome.runtime.sendMessage({ type: 'COYL_MUTE', host, duration: 'forever' })
      dismissOverlay()
      break
  }
}

function sendFeedback(verdict, host) {
  chrome.runtime.sendMessage({ type: 'COYL_FEEDBACK', verdict, host, timestamp: Date.now() })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}
