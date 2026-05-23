# UAP-0.1 Irreversibility Floor

> Status: **DRAFT** · Released 2026-05-22 · Apache 2.0 · Companion to [UAP-0.1.md](./UAP-0.1.md).

This document defines the **irreversibility floor**: the set of actions that are NEVER eligible for standing authority under UAP v0.1, regardless of how broadly a user has scoped their grant. It expands the invariant in [UAP-0.1.md §3](./UAP-0.1.md):

> *Irreversibles ALWAYS require per-action confirmation, even under standing grant. The EAP irreversibility list (send_message, purchase, money_transfer, share_pii, delete_account, destroy_data) is the floor. Implementations may extend it, never shrink it.*

The floor exists to make a precise statement: **standing authority is for routine operation. Catastrophic, irreversible, or socially-consequential operations always require explicit user presence at the moment of action.**

---

## Why an irreversibility floor

The principle: even a user who explicitly grants standing authority to an LLM CANNOT, in v0.1, authorize the LLM to perform actions that cannot be undone within a reasonable window. The grant is for routine operation. Catastrophic operations always require explicit user presence.

The intuition is simple. A grant says "I trust this LLM enough that it does not need to wake me up for every action it takes on my behalf." But trust at the routine-operation grain is NOT the same as trust at the catastrophic-action grain. A user who is comfortable letting Claude schedule meetings is not, by virtue of that comfort, also comfortable letting Claude wire $10,000 to a counterparty while they sleep.

If UAP allowed standing authority to apply uniformly across all action classes, two failure modes follow:

1. **Cognitive over-grant.** Users would grant broad scopes without thinking, because the consent UI cannot enumerate every catastrophic edge case the grant might enable. Standing authority for "manage my finances" would, in the absence of a floor, technically authorize any monetary movement.
2. **Adversarial exploitation.** An attacker who confused-deputies the LLM (see [UAP-0.1-threat-model.md T1](./UAP-0.1-threat-model.md)) gets the broadest possible attack surface — every action class within scope is realizable without further consent.

The floor closes both. Actions on the floor ALWAYS require a fresh, per-action confirmation, no matter what the grant says.

---

## The floor (always require per-action confirmation)

The v0.1 floor is organized into four tiers. Actions in any tier are denied at EXECUTE under standing authority, with `decision: "denied", reason: "irreversibility_floor"`. The LLM partner is required to downshift to per-action consent.

### Tier 1 — Financial

Movement of money out of the user's control, or commitment to recurring financial obligation.

```
money_transfer         Wire, ACH, send-to-person (Venmo, Zelle, PayPal,
                        crypto transactions). Any operation that moves
                        currency from a user-owned account to a non-
                        user-owned destination.

purchase               Any commerce above a configurable threshold.
                        Default threshold is $0 — every purchase confirms.
                        Implementations MAY raise the threshold per
                        user preference but MUST NOT default it above $0.

financial_trade        Buy or sell of securities, options, derivatives,
                        crypto trading-pair operations. The reversibility
                        window of "I can sell what I just bought" does
                        NOT count as reversibility — market loss is real.

subscription_create    Creation of any new recurring charge. Cancellation
                        of an existing subscription is NOT on the floor
                        (cancelling is reversible-by-resubscribing).
```

### Tier 2 — Communication

Sending content to recipients outside the user's control, or sharing personally-identifiable information.

```
send_message           To any EXTERNAL recipient — email, SMS, DM, public
                        post — meaning any recipient not in the user's
                        own account/inbox. Sending a calendar event to a
                        person outside the user's contacts is `send_message`.
                        Internal-only operations (notes, drafts, calendar
                        events visible to the user only) are NOT on the floor.

share_pii              Sharing any field marked PII to any external system.
                        PII includes: legal name, government-ID numbers,
                        date of birth, address, phone, email, financial
                        account numbers, health-record content, biometric
                        identifiers. The floor applies regardless of the
                        recipient's purported legitimacy.

public_post            Posting to a public surface — Twitter/X, LinkedIn,
                        public Substack, Mastodon, public Reddit, Bluesky,
                        TikTok, Instagram public posts, YouTube comments.
                        Includes editing or deletion of existing public
                        posts (the public has already cached the content).
```

### Tier 3 — Destructive

Operations that destroy data, accounts, or other users' access.

```
delete_account         Any account — the user's accounts at external
                        services, accounts the user administers, the
                        user's COYL account itself. Closing a service
                        is on the floor; deactivating reversibly is not.

destroy_data           Delete records that aren't soft-delete-eligible.
                        Hard delete that cannot be undone via a trash/
                        bin/recycling mechanism is on the floor. Soft
                        delete that auto-purges after 30 days is NOT
                        on the floor (the user still has a recovery
                        window for routine cleanup).

revoke_other_users_     Revoking access for someone OTHER than the
  access                grant-holder. Removing a collaborator from a
                        shared doc, kicking a user from a team, revoking
                        a child's access to a family-shared resource.
                        The grant-holder is acting on behalf of a third
                        party whose voice is not in the grant.
```

### Tier 4 — Authority extension

The LLM cannot self-extend its authority. These actions would let the LLM bootstrap broader power than the user granted.

```
grant_new_authority    An LLM CANNOT create a UAP grant on behalf of the
                        user. New grants always originate from a user-
                        present consent flow. (An LLM CAN suggest that
                        the user grant authority — but the EXECUTE path
                        does not include grant creation.)

rotate_keys            The LLM cannot rotate its own UAP credentials.
                        Credential rotation is administrative, executed
                        by the partner organization or the user, not by
                        the LLM at runtime.

modify_uap_rules       The LLM cannot loosen its own rule set. It MAY
                        suggest rule changes to the user via the partner's
                        UX. The EXECUTE path does not include rule
                        modification.
```

---

## Implementations may extend, never shrink

The floor above is the **minimum**. Implementations are free to add actions to the floor (e.g., a financial platform might add "transfer_above_$1000" as floor regardless of whether standing authority is involved). They MAY NOT remove any of the actions listed above from the floor.

If an implementation believes a floor action should be relaxed, the path is:

1. Open an issue against UAP-0.1 with the proposed change and reasoning.
2. Wait for v0.2 spec revision.
3. Until then, the action stays on the floor for that implementation. A unilateral relaxation makes the implementation non-conformant.

This rule exists because the floor is what makes the spec safe to refer to. A partner that builds against UAP-0.1 must be able to know — from reading the spec alone — what classes of action will ALWAYS confirm. If implementations could quietly shrink the floor, the spec loses that property.

---

## How the floor interacts with grants

When an LLM attempts `EXECUTE` for a floor action under a standing grant, the coordinator behaves as follows:

```
1. The coordinator returns decision=denied, reason=irreversibility_floor.
   The response includes which tier the action falls into and a hint:
   remediation: "request_per_action_confirmation".

2. The audit row records the attempt with operation=execute,
   decision=denied, decisionReason=irreversibility_floor,
   actionKind=<the requested action>. The user can see in their
   audit log that the LLM tried and was blocked by the floor.

3. The LLM partner MUST downshift to per-action consent. The partner's
   UX surfaces a confirmation prompt to the user; the underlying action
   only fires if the user explicitly taps confirm. The fresh confirmation
   is recorded in the audit log as a SEPARATE row with operation=execute,
   decision=allowed, decisionReason=per_action_consent.
```

The denied attempt is not a security failure — it is the floor working as designed. The audit chain reflects both the attempted-and-blocked execution and the followed-with-fresh-consent execution.

A partner that catches `irreversibility_floor` and silently swallows it (i.e., does NOT prompt the user) is non-conformant. The audit log makes this detectable, because the user sees the denied row without a corresponding consented success.

---

## The `always_confirm` rule

A user can pre-declare additional actions to confirm at GRANT time via the `rules` field on the grant:

```json
{
  "rules": [
    {
      "kind": "irreversible_floor",
      "always_confirm": ["money_transfer", "share_pii", "subscription_modify"]
    }
  ]
}
```

This `always_confirm` list **EXTENDS the floor for that grant; it does not shrink it.** Any action in `always_confirm` is treated identically to a Tier 1–4 action above. The user is layering additional caution on top of the spec floor.

Conversely: a user CANNOT use any rule mechanism to remove an action FROM the floor. There is no `never_confirm` list. The spec floor is not user-overridable.

This asymmetry is deliberate: the floor protects the user even from their own future self who, at 11 PM after a long day, might be tempted to grant standing authority to a money-movement action. The floor says "no, not even with explicit per-grant override."

---

## Future: graduated reversibility (v0.2)

v0.1 treats irreversibility as binary — an action is on the floor or it isn't. v0.2 may introduce graduated reversibility windows:

- *"send_message is reversible for 60 seconds via unsend; treat as reversible during that 60-second window, then permanent."*
- *"purchase is reversible within 1 hour of placement via cancel-order API; floor applies only for purchases that would ship within the hour."*

This direction is tracked as an open question in [UAP-0.1.md §11.3](./UAP-0.1.md) (multi-LLM concurrency adjacent) and as a standalone item under future-spec backlog. The challenge is that a reversibility window has to be MACHINE-VERIFIABLE by the coordinator at EXECUTE time — partners cannot self-attest to their action being reversible without verification.

Until v0.2 ships a verified-reversibility extension, the floor is binary as defined above.

---

## Real-world examples

The floor is easiest to understand through concrete scenarios. The following examples illustrate how the floor interacts with realistic standing grants. They are illustrative, not exhaustive.

1. **"Manage my calendar" grant.** A user grants standing authority for `calendar.write`. The LLM may schedule, reschedule, and decline events on the user's own calendar — these are reversible (the user can undo a scheduling change). The LLM is NOT allowed under this grant to send a calendar invite to a recipient OUTSIDE the user's contacts, because dispatching an invite to an external party is `send_message` to an external recipient (Tier 2). The LLM must downshift to per-action consent for that.

2. **"Run my grocery reorders" grant.** A user grants standing authority for `purchase.recurring` with a $50/item spending cap. The LLM CAN reorder a $40 weekly grocery box from a previously-used merchant if the user has explicitly carved out that single recurring purchase pattern in the grant rules. The LLM CANNOT use the same grant to place a one-off $30 purchase from a new merchant, because `purchase` is on the Tier 1 floor — every purchase confirms by default, even ones below the cap.

3. **"Triage my inbox and reply to routine emails" grant.** A user grants standing authority for `messaging.routine`. The LLM may archive, label, and draft replies. Drafts saved to the user's drafts folder are NOT on the floor. The act of sending a drafted reply to an external recipient IS on the floor (`send_message` Tier 2). The user reviews drafts in their normal inbox flow and confirms send per-message.

4. **"Pay my recurring bills" grant.** A user grants standing authority for `bill_pay.recurring`. The LLM CAN initiate payment of a known, pre-approved recurring bill (utilities, rent) IF the user has previously confirmed the specific recipient + amount pattern as a rule on the grant. The LLM CANNOT initiate payment to a new recipient, because that would be `money_transfer` to a destination not previously confirmed (Tier 1). It also cannot raise the payment amount above the historical pattern without fresh confirmation.

5. **"Clean up my old files" grant.** A user grants standing authority for `storage.organize`. The LLM may move files between folders, rename them, and soft-delete (move to trash) items it identifies as redundant — trash is recoverable, so soft delete is NOT on the floor. The LLM CANNOT empty the trash, permanently delete files, or delete entire folders/accounts — all of those are `destroy_data` or `delete_account` (Tier 3). They require per-action consent.

In every example, the pattern is the same: the grant covers routine, reversible operation. The floor catches the catastrophic edge case before it lands.

---

## Appendix A. Cross-references

- Base spec: [UAP-0.1.md](./UAP-0.1.md) — §3 (Hard Invariants) and §5 (Wire Format) reference the floor.
- Threat model companion: [UAP-0.1-threat-model.md](./UAP-0.1-threat-model.md) — T1 (confused-deputy) and T3 (privilege escalation) explicitly cite the floor as a primary mitigation.
- EAP irreversibility list: see [edge-ai-protocol.md](./edge-ai-protocol.md), which defines the per-action-confirmation set that UAP inherits as floor.
- Issues, comments, contributions: https://github.com/FutureEnterprises/chief-of-staff
