# RAP — Risk Assessment Protocol v0.1

**Status:** Draft (May 23, 2026)
**License:** Apache 2.0
**Position in the COYL protocol stack:** the safety routing layer that sits orthogonal to BIP / PAP / EAP / UAP and answers _"when does an AI agent stop coaching and start escalating to human support?"_

---

## 1. Why RAP exists

The other four COYL protocols handle the happy path of behavior-aware AI:

| Protocol | Concern |
|---|---|
| BIP | What behavioral state is the user in? |
| PAP | When should an LLM propose an intervention? |
| EAP | How does the LLM act across the user's device fleet? |
| UAP | What standing authority has the user granted? |

None of those protocols answer the question the AI Safety community asks first when an LLM is deployed in a behavioral context:

> _"At what point does the model stop being a coach and start being a barrier to clinical care?"_

That gap is what kills the foundation-lab integration conversation. A Trust & Safety reviewer at Anthropic, OpenAI, or Google won't certify a behavioral interrupt protocol without an explicit, audited answer for **when the AI should refuse to coach and route the user to a human professional**.

RAP is that protocol. One small, focused spec. Three risk classes. Four routing envelopes. Cleanly separable from BIP/PAP/EAP/UAP so each can be implemented independently.

---

## 2. The four risk classes

Every behavioral moment the AI evaluates falls into exactly one class:

### `routine_friction`
The default. The user is in a familiar loop the AI has authority to coach on. BIP context permits PAP proposals. PAP proposals fire through EAP under UAP-granted scope.

**Example:** Late-night scrolling, mild procrastination, the "one more snack" moment.

**RAP routing:** none required. Coaching proceeds.

### `pattern_relapse`
The user has crossed back into a behavioral pattern they previously committed to leaving. Heavier interventions warranted; intensify EAP modality; consider PAP confidence threshold reduction. No human routing yet.

**Example:** Returning to nicotine after a 30-day quit. Resuming binge-purge cycle after a recovery week.

**RAP routing:** AI may notify a user-pre-designated accountability contact (pod member, partner, sponsor) if the user opted in via UAP scope `notify:relapse_signal`. No automatic clinical routing.

### `crisis_indication`
The behavioral signal carries a credible indication of psychological crisis. AI must stop coaching IMMEDIATELY. Active referral envelope generated.

**Example:** Suicidal ideation phrases in chat. Self-harm imagery. Acute substance crisis. Domestic-violence signals.

**RAP routing:** AI emits a `crisis_referral_envelope` (see §4). Coaching path closed for the session. The envelope contains: jurisdictional crisis-line numbers (988 in US, Samaritans in UK, etc.), the user's pre-set emergency contact if UAP scope `route:emergency_contact` is granted, and a self-care holding pattern. No further PAP proposals fire until a human-reviewed re-open is logged.

### `legal_or_medical_emergency`
Imminent danger to life or limb. RAP supersedes every other protocol — even active UAP grants. The AI must not attempt to coach, intervene, or delay routing.

**Example:** Acute overdose signals. Active bleeding. Stroke / cardiac signals. Active violence.

**RAP routing:** AI emits an `emergency_referral_envelope` (see §4) with 911 / equivalent jurisdictional emergency number, location services prompt (subject to user grant), and explicit refusal to coach. AI must not propose ANY non-routing action. EAP irreversibility floor automatic-overrides any IRREVERSIBLE pending action.

---

## 3. The classification process

Risk classification is a per-moment evaluation, not a per-user state. A user can be in `routine_friction` at 2:00 PM and `crisis_indication` at 2:47 PM. RAP is stateless in that sense — every signal is classified fresh.

### Inputs

```
{
  user_state: BIP_BehavioralContextObject,
  proposed_action: PAP_ProposalEnvelope | EAP_ActionRequest,
  signal_chain: BIP_RecentSignalSequence,  // last N signals from BIP
  user_jurisdiction: ISO_3166_2,            // for crisis-line routing
  uap_scopes: UAP_GrantSet,                 // for accountability + emergency routing
}
```

### Output

```
{
  risk_class: 'routine_friction' | 'pattern_relapse'
              | 'crisis_indication' | 'legal_or_medical_emergency',
  rationale_signature: 'sha256:<hash of classifying signals>',
  classifier_version: 'rap-v0.1-<model_revision>',
  routing_envelope: RAP_RoutingEnvelope | null,
  ttl_seconds: number,
}
```

The `rationale_signature` is the deterministic hash of the signal chain that drove the classification. Used for audit replay — a Trust & Safety reviewer can re-run RAP against the same signal chain six months later and confirm the classifier would have produced the same risk class.

### Classifier

The reference engine uses a hybrid:

- **Hard rules** for `crisis_indication` and `legal_or_medical_emergency` — keyword + phrase pattern + structured-signal triggers that bypass the LLM entirely. False-positive rate accepted in exchange for zero false-negative tolerance.
- **LLM evaluation** for `routine_friction` vs. `pattern_relapse` — the foundation model evaluates the recent signal chain against the user's BIP pattern history.
- **Confidence floor** at 0.7. Below the floor, fall back to the next-higher risk class (when in doubt, escalate, never de-escalate).

The hard-rule set is open-source in this spec; the LLM classifier is the proprietary reference engine.

---

## 4. The routing envelopes

### `crisis_referral_envelope`

Returned when `risk_class === 'crisis_indication'`.

```json
{
  "envelope_kind": "crisis_referral",
  "jurisdictional_lines": [
    { "name": "988 Suicide & Crisis Lifeline", "number": "988", "channel": ["call", "text"] },
    { "name": "Crisis Text Line", "number": "741741", "channel": ["text"] }
  ],
  "user_emergency_contact": "<contact_token>" | null,
  "holding_pattern": {
    "modality": "in_app_card",
    "headline": "Pause. Right now.",
    "body": "What you're feeling matters. A trained human can sit with this. Reach out to 988 (call or text) — it's free, confidential, 24/7. We're stopping here so they can help.",
    "action": "primary_call_988"
  },
  "coaching_path_closed_until": "<iso8601_timestamp>" | "human_reopen_required"
}
```

### `emergency_referral_envelope`

Returned when `risk_class === 'legal_or_medical_emergency'`. Maximum-priority envelope. UAP-bypass authorized.

```json
{
  "envelope_kind": "emergency_referral",
  "jurisdictional_emergency_number": "911",
  "location_prompt": "share_location_to_responders" | "decline",
  "irreversibility_override": true,
  "ai_must_refuse_coaching": true,
  "coaching_path_closed_until": "human_reopen_required"
}
```

### `accountability_referral_envelope`

Optional, returned with `risk_class === 'pattern_relapse'` when the user has granted `notify:relapse_signal` via UAP.

```json
{
  "envelope_kind": "accountability_referral",
  "notify_contact_token": "<contact_token>",
  "intensity": "soft" | "direct",
  "message_template": "We noticed <user> just returned to <pattern>. They asked you to know if this happened."
}
```

---

## 5. Open questions (community input requested)

1. **False-positive cost of `crisis_indication` triggers.** Hard rules trigger on phrase patterns. Edge cases — quoting song lyrics, discussing the topic in a research context, dark humor — fire false positives that close the coaching path for the session. What's the right re-open mechanism?
2. **Per-jurisdiction routing tables.** This spec defaults to US-centric crisis lines (988). The full international table needs community curation. PRs welcome.
3. **`pattern_relapse` definition under partial recovery.** A user who is mid-rebuild with three slips in a month — is that `routine_friction` (they're still trying) or `pattern_relapse` (they've crossed back)? The reference engine treats this as user-configurable; the spec needs clearer guidance.
4. **EAP irreversibility-floor interaction.** RAP `emergency_referral_envelope` overrides ALL UAP-granted scope. The exact handshake with EAP's reversibility envelope (when an EAP IRREVERSIBLE action is mid-flight and RAP fires) needs more thought.

---

## 6. Implementation status

- **Reference engine:** the COYL coordinator currently exposes `PanicState` (the user-tripped panic switch). That's the seed of RAP's `coaching_path_closed_until` mechanism. The full RAP classifier, the three risk classes, and the routing envelopes are pending implementation.
- **Open spec:** this document is the v0.1 draft. PRs at github.com/FutureEnterprises/chief-of-staff/tree/main/docs/protocol/RAP-0.1.md.
- **First production integration target:** the existing PAP self-integration (COYL Internal partner) will adopt RAP classification before the next foundation-lab Trust & Safety review.

---

## 7. The line

RAP exists because behavior-aware AI without a safety floor is worse than chat-only AI. The category COYL is trying to define depends on having an answer for the question every Trust & Safety reviewer asks first — _"when does the AI stop being part of the user's life and become a barrier between them and clinical care?"_

The answer is RAP. Cleanly separable, audit-traceable, jurisdiction-aware, and able to override every other protocol in the stack when it has to.

The same architecture that lets an AI catch you before you fold has to know when to step out of the way.
