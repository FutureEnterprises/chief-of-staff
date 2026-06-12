/**
 * @coyl/protocol — typed error surface.
 *
 * Every non-2xx response from a COYL protocol endpoint is normalized
 * into a {@link CoylProtocolError}. The error carries the HTTP status,
 * the machine-readable `code` the server returned (its `error` field),
 * the human message, and any structured `detail` payload — so callers
 * can branch on `err.code` without re-parsing the response body.
 *
 * The live handlers shape errors as one of:
 *   { error: '<code>', message: '<text>', detail?: <any> }   // UAP
 *   { error: '<code>' }                                        // EAP (terse)
 *
 * Note: a `decision: 'denied'` EXECUTE/PRECHECK body is NOT an error —
 * it is a successful 200 response carrying a denial. CoylProtocolError
 * is reserved for transport/auth/validation failures (4xx/5xx).
 */

export interface CoylProtocolErrorInit {
  status: number
  code: string
  detail?: unknown
  /** The endpoint path that failed, for debugging. */
  path?: string
}

export class CoylProtocolError extends Error {
  /** HTTP status code (e.g. 401, 403, 404, 500). */
  readonly status: number
  /** Machine-readable error code from the server's `error` field. */
  readonly code: string
  /** Structured detail payload, when the server attached one. */
  readonly detail?: unknown
  /** Request path that produced the error, when known. */
  readonly path?: string

  constructor(message: string, init: CoylProtocolErrorInit) {
    super(message)
    this.name = 'CoylProtocolError'
    this.status = init.status
    this.code = init.code
    this.detail = init.detail
    this.path = init.path
    // Restore the prototype chain for instanceof across transpile targets.
    Object.setPrototypeOf(this, CoylProtocolError.prototype)
  }

  /** True for 401/403 — credential or authorization failures. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }

  /** True for 404 — grant/device/audit row not found. */
  get isNotFound(): boolean {
    return this.status === 404
  }
}

/**
 * Build a {@link CoylProtocolError} from a fetched Response whose body
 * has already been parsed (or failed to parse). Internal helper used by
 * the clients; exported so advanced callers can reuse the normalization.
 */
export function coylErrorFromBody(status: number, body: unknown, path?: string): CoylProtocolError {
  let code = `http_${status}`
  let message = `Request failed with status ${status}`
  let detail: unknown

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.error === 'string') code = b.error
    if (typeof b.message === 'string') message = b.message
    else if (typeof b.error === 'string') message = b.error
    if ('detail' in b) detail = b.detail
  } else if (typeof body === 'string' && body.length > 0) {
    message = body
  }

  return new CoylProtocolError(message, { status, code, detail, path })
}
