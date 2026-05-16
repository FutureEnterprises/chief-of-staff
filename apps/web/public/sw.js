/* eslint-disable no-undef */
/**
 * COYL service worker — handles Web Push for users who don't have the
 * mobile app yet (Core/Free tier, pre-App-Store-launch).
 *
 * Two events:
 *   - push: a notification arrives from the danger-window-interrupt cron
 *   - notificationclick: user tapped the notification → focus or open
 *     the rescue page at the right query params
 *
 * Payload shape (matches Expo push so the cron code is unified):
 *   { title, body, data: { type, windowId, deepLinkPath } }
 *
 * Update versioning: bump SW_VERSION to force re-install during dev.
 */

const SW_VERSION = 'coyl-sw-v1'
const DEFAULT_ICON = '/favicon.svg'
const DEFAULT_BADGE = '/favicon.svg'

self.addEventListener('install', (event) => {
  // Activate immediately on install — no waiting for old SW to die.
  // Safe because we don't cache anything yet.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately.
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'COYL',
    body: 'This is the moment.',
    data: {},
  }

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch (err) {
    // If the payload isn't JSON, fall back to plain text body
    try {
      payload.body = event.data ? event.data.text() : payload.body
    } catch (_) {
      // ignore
    }
  }

  const title = payload.title || 'COYL'
  const options = {
    body: payload.body || 'This is the moment.',
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: payload.data && payload.data.tag ? payload.data.tag : 'coyl-interrupt',
    renotify: true,
    requireInteraction: false,
    data: payload.data || {},
    actions: [
      { action: 'open_rescue', title: 'Open rescue' },
      { action: 'dismiss', title: 'Not now' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const data = event.notification.data || {}
  // Default to /rescue with the source context so the "why this fired"
  // banner renders. windowId optional — propagated when present.
  let path = '/rescue?from=push'
  if (data.type === 'danger_window') {
    path = `/rescue?from=danger_window${data.windowId ? `&windowId=${encodeURIComponent(data.windowId)}` : ''}`
  } else if (data.deepLinkPath) {
    path = data.deepLinkPath
  }

  const targetUrl = new URL(path, self.location.origin).toString()

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If a window is already open, focus it and navigate it.
        for (const client of clients) {
          if ('focus' in client && 'navigate' in client) {
            return client.focus().then(() => client.navigate(targetUrl))
          }
          if ('focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window.
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
        return null
      }),
  )
})
