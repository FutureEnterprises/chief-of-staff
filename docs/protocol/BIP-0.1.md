# Behavioral Interrupt Protocol (BIP) — v0.1

> The protocol that lets AI systems read, trigger, and observe behavioral
> interrupts in real-world human moments. The missing context layer between
> AI systems and human behavioral reality.
>
> **Status:** Draft v0.1 · May 2026
> **Editor:** Iman Schrock · COYL · iman@coyl.ai
> **License:** Apache License, Version 2.0

---

## 0. Why this protocol exists

Every Large Language Model deployed today can answer "should I eat this?"
when a user asks it. None of them can fire unprompted at 9:47 PM when the
user is standing at the open fridge, not asking anything. The LLM has no
persistent relationship with the user's behavioral state. It waits to be
called. It cannot reach into the moment when the moment matters.

The Behavioral Interrupt Protocol (BIP) closes that gap. It is to human
behavioral reality what the Model Context Protocol (MCP) is to software
systems: a standardized layer that lets AI systems access the right
context at the right moment to act on a person's real-world decisions.

This document defines the three primitives BIP v0.1 ships:

1. **The Behavioral Context Object** — a read API returning the user's
   current behavioral state.
2. **The Interrupt Trigger** — a write API for external signal sources
   to push events that the behavioral engine evaluates.
3. **The Outcome Webhook** — a push API delivering outcome events back
   to registered consumers.

BIP is intentionally minimal at v0.1. The goal is the protocol shape, not
the full taxonomy. Implementations may extend with vendor-specific fields
but MUST honor the contract below.

---

## 1. Terminology

- **Behavioral Engine** — a service that implements BIP. Owns the
  user-level behavioral model and decides whether a triggered interrupt
  fires, defers, or is ignored. COYL Cloud is the reference engine.
- **Consumer** — any application or AI system that reads a Behavioral
  Context Object, triggers an interrupt, or receives outcome webhooks.
  Examples: an LLM assistant, a Watch app, a telehealth platform.
- **Signal Source** — a system that emits raw behavioral signals to the
  engine via the Interrupt Trigger API. Examples: a wearable's HRV spike
  feed, a calendar entry indicating a high-risk meeting, a browser tab
  switch event.
- **Subject** — the user whose behavioral state is being reasoned about.
  All BIP calls scope to a subject identified by `user_id`. Consent is
  managed out-of-band; the protocol presumes a valid OAuth or signed
  delegation token is in scope (see §6).
- **Archetype** — one of the engine's enumerated behavioral identity
  classes (e.g. `9PM_NEGOTIATOR`, `MONDAY_RESETTER`, `DESERVER`,
  `ONE_MORE_TABBER`, `SPIRAL_EXTENDER`, `CAPITULATOR`). Implementations
  MAY add archetypes; consumers SHOULD treat unknown archetypes as
  opaque strings.
- **Danger Window** — a (day × hour) span the engine has learned is
  high-risk for the subject. Identified by a confidence score in [0, 1].
- **Interrupt** — a precisely-timed message delivered to the subject in
  the three-second window before the predicted behavior runs.

---

## 2. Conformance levels

A Behavioral Engine MAY implement any subset of these conformance levels
and MUST advertise the levels it implements in its `OPTIONS` response.

- **Level 1 — Read**: implements §3 Context Object.
- **Level 2 — Trigger**: implements §4 Interrupt Trigger.
- **Level 3 — Webhook**: implements §5 Outcome Webhook.
- **Level 4 — Reference**: implements all three plus §7 (model update
  feedback loop).

The COYL reference engine implements Levels 1–4.

---

## 3. The Behavioral Context Object

### 3.1 Endpoint

```http
GET /v1/context/{user_id}
Authorization: Bearer <token>
Accept: application/json
```

### 3.2 Response (200 OK)

```json
{
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "archetype": "9PM_NEGOTIATOR",
  "archetype_confidence": 0.83,
  "danger_window_active": true,
  "danger_window": {
    "label": "Late-night drift",
    "start_local": "21:00",
    "end_local": "23:00",
    "day_of_week": [0, 1, 2, 3, 4, 5, 6],
    "confidence": 0.87
  },
  "current_excuse_category": "DESERVER",
  "self_trust_score": 74,
  "self_trust_delta_7d": +3,
  "slip_streak": 2,
  "last_interrupt": {
    "id": "in_2pa9ld8w0",
    "ago_seconds": 172800,
    "outcome": "STOPPED"
  },
  "recovery_mode": false,
  "risk_level": "HIGH",
  "freshness": {
    "computed_at": "2026-05-21T21:04:00Z",
    "ttl_seconds": 60
  }
}
```

### 3.3 Field semantics

| Field | Type | Required | Description |
|---|---|:-:|---|
| `spec_version` | string | ✓ | Always `"0.1"` for this revision. |
| `user_id` | string | ✓ | Engine-scoped opaque identifier. |
| `archetype` | string enum | ✓ | One of the published families. May be vendor-extended. |
| `archetype_confidence` | float [0,1] | ✓ | Engine's confidence the user belongs to this family. |
| `danger_window_active` | bool | ✓ | Whether the current wall-clock moment is inside a learned danger window. |
| `danger_window` | object \| null | ✓ | Active window descriptor; `null` if not active. |
| `current_excuse_category` | string enum | optional | The most-likely excuse the engine predicts the user is running RIGHT NOW. Empty when confidence is low. |
| `self_trust_score` | int [0,100] | ✓ | Calibrated trust score; higher is better. |
| `self_trust_delta_7d` | int | ✓ | 7-day delta. |
| `slip_streak` | int ≥ 0 | ✓ | Consecutive days with at least one slip. |
| `last_interrupt` | object \| null | ✓ | Most recent interrupt + outcome. |
| `recovery_mode` | bool | ✓ | Whether the user entered post-slip recovery in the last 24h. |
| `risk_level` | string enum | ✓ | One of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `freshness` | object | ✓ | When this object was computed + how long it stays valid. |

### 3.4 Caching

The `freshness.ttl_seconds` field tells the consumer how long to cache
this response. Consumers MUST NOT cache beyond TTL. Implementations
SHOULD return `Cache-Control: max-age=<ttl>` on the HTTP response.

### 3.5 Privacy

The Context Object MUST NOT contain personally identifiable information
(name, email, phone, address, precise location). Only behavioral
abstractions. The engine is the trusted boundary; the consumer is
untrusted with respect to identity data.

---

## 4. The Interrupt Trigger API

### 4.1 Endpoint

```http
POST /v1/interrupt
Authorization: Bearer <token>
Content-Type: application/json
```

### 4.2 Request body

```json
{
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "trigger_source": "apple_watch_hrv_spike",
  "trigger_type": "physiological",
  "context_hint": "elevated_stress_detected",
  "urgency": "HIGH",
  "evidence": {
    "hrv_baseline": 52,
    "hrv_current": 38,
    "duration_seconds": 240
  },
  "request_id": "req_b2x7p1q9"
}
```

### 4.3 `trigger_type` enum

| Value | Use |
|---|---|
| `physiological` | Biometric/sensor data (HRV, sleep, heart rate, breathing). |
| `behavioral` | Observed user action (tab switch, app open, calendar event start). |
| `contextual` | Environment shift (location entry, time-of-day, weather). |
| `self_report` | User-initiated trigger ("I want to binge"). |
| `predicted` | Engine-internal scheduled trigger from a learned danger window. |

### 4.4 Response (200 OK)

```json
{
  "spec_version": "0.1",
  "interrupt_id": "in_3kf02n9w",
  "decision": "FIRE",
  "decision_reason": "danger_window_active + reward_excuse_pattern_match",
  "delivery_channels": ["push", "browser_extension"],
  "scheduled_at": "2026-05-21T21:04:15Z",
  "expires_at": "2026-05-21T21:07:15Z"
}
```

### 4.5 `decision` enum

- `FIRE` — engine accepted the trigger and queued an interrupt.
- `DEFER` — engine accepted the signal but is waiting on confirmation
  before firing (e.g. waiting for a second corroborating signal).
- `IGNORE` — engine rejected the trigger (low confidence, user in
  recovery mode, quiet hours, etc.).

The decision is final from the trigger's perspective. If the engine
later fires, the `INTERRUPT_FIRED` outcome webhook is the only further
notification.

### 4.6 Trigger source registration

Implementations MUST require that `trigger_source` strings be
pre-registered. Unknown sources MUST be rejected with HTTP 403. This
prevents arbitrary external systems from firing interrupts.

---

## 5. The Outcome Webhook

### 5.1 Registration

Consumers register a webhook URL per integration:

```http
POST /v1/webhooks
Authorization: Bearer <token>

{
  "url": "https://example.com/coyl/webhooks",
  "events": ["INTERRUPT_FIRED", "INTERRUPT_RESOLVED",
             "PATTERN_DRIFT_DETECTED", "RECOVERY_INITIATED"],
  "signing_secret_format": "sha256"
}
```

### 5.2 Delivery

Webhooks are delivered as `POST` requests with:

- Content-Type: `application/json`
- `X-BIP-Signature`: HMAC-SHA256 of body using the registered signing secret
- `X-BIP-Event`: event name
- `X-BIP-Delivery-Id`: unique delivery ID for idempotency

### 5.3 Event types

#### `INTERRUPT_FIRED`

Emitted the moment an interrupt is delivered to the subject.

```json
{
  "event": "INTERRUPT_FIRED",
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "interrupt_id": "in_3kf02n9w",
  "fired_at": "2026-05-21T21:04:15Z",
  "channels": ["push"],
  "trigger_source": "apple_watch_hrv_spike",
  "predicted_outcome_probability": 0.71
}
```

#### `INTERRUPT_RESOLVED`

Emitted when the subject responds (stop, slip, dismiss, defer).

```json
{
  "event": "INTERRUPT_RESOLVED",
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "interrupt_id": "in_3kf02n9w",
  "outcome": "STOPPED",
  "elapsed_seconds": 47,
  "pattern_update": {
    "danger_window_accuracy": 0.03,
    "self_trust_score": 1
  },
  "resolved_at": "2026-05-21T21:05:02Z"
}
```

#### `PATTERN_DRIFT_DETECTED`

Emitted when the engine detects a meaningful change in the user's
behavioral model (archetype shift, danger-window relocation, etc.).

```json
{
  "event": "PATTERN_DRIFT_DETECTED",
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "drift_type": "danger_window_shifted",
  "from": { "label": "Late-night drift", "hours": "21:00-23:00" },
  "to":   { "label": "After-work drift", "hours": "17:30-19:30" },
  "confidence": 0.78,
  "detected_at": "2026-05-21T08:12:00Z"
}
```

#### `RECOVERY_INITIATED`

Emitted when the engine flips the user into post-slip recovery mode.

```json
{
  "event": "RECOVERY_INITIATED",
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "slip_id": "sl_4q9p2zy",
  "recovery_protocol": "same_night_re_entry",
  "initiated_at": "2026-05-21T22:31:00Z"
}
```

### 5.4 Retry policy

Delivery is at-least-once. Failed deliveries are retried with
exponential backoff: 1s, 5s, 30s, 5m, 30m, 2h, 12h. After 12h the
delivery is marked as `failed` and surfaced in the consumer's dashboard.

Consumers MUST handle duplicate deliveries idempotently via
`X-BIP-Delivery-Id`.

---

## 6. Authentication and consent

BIP v0.1 supports two auth modes:

### 6.1 API key

Server-to-server. The consumer holds a long-lived bearer token scoped to
a registered integration. Tokens MUST NOT be exposed to clients.

### 6.2 OAuth 2.0 with PKCE

User-consented. The consumer obtains an access token via the standard
OAuth 2.0 authorization-code flow with PKCE. The token's scope MUST
include at least one of:

- `context:read` — read the Context Object
- `interrupt:trigger` — fire interrupts
- `outcome:subscribe` — receive webhooks
- `pattern:update` — write model updates (Level 4 only)

Consent screens MUST explain the scope in human terms and MUST surface
the engine's data-retention policy.

### 6.3 Subject revocation

A subject MUST be able to revoke access at any time. The engine MUST
return HTTP 410 Gone for revoked subjects until a new consent flow
re-grants access.

---

## 7. Model update feedback loop (Level 4)

Implementations at Level 4 MAY expose endpoints for consumers to push
back observations:

```http
POST /v1/observations
Authorization: Bearer <token>

{
  "user_id": "u_2sj8xks0a",
  "observation_type": "user_self_reported_excuse",
  "data": {
    "excuse_text": "I deserve this",
    "category_guess": "DESERVER"
  },
  "observed_at": "2026-05-21T21:05:02Z"
}
```

These observations are NOT guaranteed to update the engine's model. The
engine decides what to integrate, when, and at what weight. The
endpoint exists to let trusted consumers contribute signal back.

---

## 8. Rate limits

Implementations MUST publish per-token rate limits. The COYL reference
engine ships with:

| Endpoint | Default limit |
|---|---|
| GET /v1/context | 600 requests/min/user |
| POST /v1/interrupt | 60 requests/min/user |
| POST /v1/webhooks | 10 requests/min/integration |
| POST /v1/observations | 120 requests/min/user |

Limits are returned in `X-RateLimit-Limit` / `X-RateLimit-Remaining` /
`X-RateLimit-Reset` headers on every response.

---

## 9. Errors

All errors return JSON with a stable schema:

```json
{
  "error": {
    "code": "subject_revoked",
    "message": "Subject u_2sj8xks0a has revoked access for scope context:read.",
    "spec_version": "0.1",
    "request_id": "req_b2x7p1q9"
  }
}
```

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `invalid_request` | Malformed body or missing required field. |
| 401 | `unauthenticated` | Missing or invalid bearer token. |
| 403 | `forbidden` | Token does not grant required scope. |
| 403 | `unregistered_trigger_source` | `trigger_source` not registered. |
| 404 | `subject_unknown` | `user_id` is not known to the engine. |
| 410 | `subject_revoked` | Subject revoked the integration. |
| 429 | `rate_limited` | Rate limit exceeded; honor `Retry-After`. |
| 5xx | `internal_error` | Server-side failure; client SHOULD retry idempotent calls. |

---

## 10. Compatibility badge program

An implementation MAY display the "BIP-Compatible" badge once it passes
the reference conformance suite (open-source, at
`github.com/coyl/bip-conformance`). The suite covers:

- All endpoints respond with the spec-conforming schema.
- Auth flows honor OAuth 2.0 + PKCE correctly.
- Rate-limit headers are present.
- Webhook signatures verify.
- Subject revocation returns 410.

Engines that fail the suite MAY NOT use the badge.

---

## 11. Versioning

BIP uses semver-shaped versions in the `spec_version` field of every
payload. The protocol commits to:

- **Minor version bumps** are backwards-compatible additions (new
  optional fields, new event types, new archetypes).
- **Major version bumps** may break shape. Consumers MUST pin a major
  version in their integration manifest.

Reference implementations SHOULD support the current major version + the
previous major version for at least 12 months.

---

## 12. License

This specification is licensed under the Apache License, Version 2.0.

```
Copyright 2026 COYL, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you
may not use this file except in compliance with the License. You may
obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
```

---

## 13. Acknowledgments

This protocol is inspired by the Model Context Protocol (MCP) from
Anthropic, the JITAI (Just-in-Time Adaptive Interventions) academic
framework (Nahum-Shani et al., 2018, *Annals of Behavioral Medicine*),
and the OAuth 2.0 + Webhooks design language that has become the de
facto standard for cross-vendor coordination on the web.

We thank the early COYL community for stress-testing the primitives
across the consumer surfaces that shipped between January and May 2026.

— Iman Schrock · COYL · May 2026
