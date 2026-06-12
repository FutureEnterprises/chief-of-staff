/**
 * @coyl/protocol — internal fetch helper.
 *
 * Zero-dependency wrapper over the platform `fetch` (Node ≥18, browsers,
 * Deno, edge runtimes). Normalizes JSON encode/decode, attaches the
 * appropriate auth header, and converts every non-2xx into a
 * {@link CoylProtocolError}. Not part of the public API surface — the
 * clients use it; callers do not import it directly.
 */

import { coylErrorFromBody, CoylProtocolError } from './errors'

export type HttpMethod = 'GET' | 'POST' | 'DELETE'

export interface HttpRequestOptions {
  method: HttpMethod
  /** Path beginning with `/` — appended to the client baseUrl. */
  path: string
  /** Authorization header value, verbatim. Omit for public endpoints. */
  authorization?: string
  /** Parsed and JSON-stringified into the body for POST. */
  body?: unknown
  /** Optional query params; undefined values are skipped. */
  query?: Record<string, string | number | undefined>
  /** Optional AbortSignal for cancellation / timeouts. */
  signal?: AbortSignal
}

/** Strip a single trailing slash so `${baseUrl}${path}` never double-slashes. */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function buildUrl(baseUrl: string, path: string, query?: HttpRequestOptions['query']): string {
  let url = `${baseUrl}${path}`
  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }
  return url
}

export async function httpRequest<T>(baseUrl: string, options: HttpRequestOptions): Promise<T> {
  const url = buildUrl(baseUrl, options.path, options.query)

  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.authorization) headers['Authorization'] = options.authorization

  let res: Response
  try {
    res = await fetch(url, {
      method: options.method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (err) {
    // Network / DNS / abort — surface as a transport error with status 0.
    throw new CoylProtocolError(err instanceof Error ? err.message : 'Network request failed', {
      status: 0,
      code: 'network_error',
      path: options.path,
    })
  }

  const text = await res.text()
  let parsed: unknown = undefined
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    throw coylErrorFromBody(res.status, parsed, options.path)
  }

  return parsed as T
}
