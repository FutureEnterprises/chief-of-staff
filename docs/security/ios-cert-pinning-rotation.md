# iOS certificate-pinning rotation runbook

*Owner: founder (today) → CTO (post-seed). Reviewed quarterly.*

The Rebound iOS app pins the SPKI of `api.coyl.ai`'s TLS leaf
certificate. If we rotate the cert without pre-staging a backup pin,
every installed copy of the app stops working until users force-update.
This document is the runbook so that doesn't happen.

---

## Pinning strategy at a glance

- **Pinned host**: `api.coyl.ai` only. Marketing surface (`coyl.ai`) is
  intentionally not pinned because it's on Vercel and rotates on
  Vercel's schedule, and there is no sensitive iOS traffic to it.
- **Pin type**: `NSPinnedLeafIdentities` (leaf SPKI hash, not CA). See
  apps/ios-rebound/Sources/Rebound/Info.plist.
- **Always pin TWO values**: the current primary pin AND a pre-staged
  backup pin. Single-pin deployment is forbidden — one rotation
  miscoordination bricks the install base.

---

## When to run a rotation

1. **Scheduled**: every 60 days. Calendar reminder; do not skip.
2. **Triggered**: cert renewal, hosting migration, suspected CA
   compromise, or any infra change touching `api.coyl.ai`.

---

## The 5-step rotation procedure

These steps assume the iOS app is currently shipping with `pin_A` as
primary and `pin_B` as backup. Goal: rotate to `pin_B` as primary and
introduce `pin_C` as the new backup.

### Step 1 — Generate the new leaf cert

Use the existing cert provisioning flow (Let's Encrypt via ACME, or
whatever provisioning runs against `api.coyl.ai`). **Critically: keep
the existing private key** for the renewal so that `pin_B` (computed
in advance against the same key) matches.

Most ACME clients have a `--reuse-key` flag. Verify before issuing.

### Step 2 — Compute the new backup pin (`pin_C`)

Generate a **new** private key + CSR. Either:

- Issue the cert from this CSR immediately into a staging subdomain
  (e.g. `api-next.coyl.ai`) and pull the cert from there to compute
  the pin, or
- Use `openssl` directly against the key file:

```bash
openssl pkey -in next-rotation.key -pubout -outform der \
  | openssl dgst -sha256 -binary \
  | base64
```

Store `next-rotation.key` in 1Password / your secrets vault. It is the
seed for the rotation AFTER the next one.

### Step 3 — Ship the app with `pin_B` primary + `pin_C` backup

Update `apps/ios-rebound/Sources/Rebound/Info.plist`:

```xml
<key>NSPinnedLeafIdentities</key>
<array>
  <dict>
    <key>SPKI-SHA256-BASE64</key>
    <string>pin_B</string>  <!-- now primary -->
  </dict>
  <dict>
    <key>SPKI-SHA256-BASE64</key>
    <string>pin_C</string>  <!-- new backup -->
  </dict>
</array>
```

Submit to App Store. Wait for ≥80% of the active install base to
update (track in App Store Connect). **Do not advance to step 4 before
this threshold.** Typical wait: 7-14 days.

### Step 4 — Rotate the cert on `api.coyl.ai`

Issue the renewed cert using the key that matches `pin_B` (the same
private key from Step 1's `--reuse-key`). Deploy it.

Verify with the pin-compute script:

```bash
scripts/compute-spki-pin.sh api.coyl.ai
# Output must equal pin_B exactly.
```

If the output is anything else, the cert was issued against the wrong
key. **Halt.** Roll back to the previous cert. Investigate.

### Step 5 — Promote `pin_C`'s key to live

After the next 60-day cycle, repeat from Step 1 with the
`next-rotation.key` from Step 2 as the new primary. Generate
`pin_D` as the new backup. And so on.

---

## What you must never do

1. **Never ship an app with only one pin.** Single-pin = single point
   of failure = entire install base bricked on miscoordination.
2. **Never rotate the cert before the new app version has
   ≥80% adoption.** This is the only window during which the OLD primary
   pin still has to work.
3. **Never use the same private key forever.** The whole point of
   rotating is to limit blast radius if a key leaks. Rotate the key
   every two cycles minimum.
4. **Never commit the private key (`*.key`) to git.** Use 1Password,
   Vercel's secret store, or AWS Secrets Manager. The `.gitignore`
   already excludes `*.key` — keep it that way.
5. **Never paste pin values into Slack or email.** They're not secret,
   but they're identifying — flag them for review if a teammate posts
   one publicly.

---

## Emergency: cert compromise

If `api.coyl.ai`'s private key is suspected leaked (laptop stolen,
HSM breach, etc.):

1. Issue a new cert with a completely fresh key pair against
   `api.coyl.ai`. Deploy it.
2. Old iOS apps now hard-fail TLS to `api.coyl.ai` (they pinned the
   old key). This is intentional — fail-closed.
3. Force a server-side soft-block on the old cert via CRL/OCSP.
4. Ship a new iOS build with the new pin as primary + a fresh backup.
5. Send a push notification to the install base via APNs (which goes
   through Apple's pinned infra, not yours) saying "update the app."
6. Postmortem within 7 days. File under `docs/security/incidents/`.

The fail-closed behavior is the entire point of pinning. If the install
base ate a forged cert silently, the pinning was decorative.

---

## Tooling

- **`scripts/compute-spki-pin.sh <host> [<port>]`** — compute the
  current leaf SPKI pin for any HTTPS host. Always check both the
  live pin and the pre-staged backup before shipping a new app
  version.
- **Pre-deploy CI check** (TODO): a CI step that runs
  `compute-spki-pin.sh api.coyl.ai` against the staging environment
  and asserts the result matches the primary pin in Info.plist. Add
  before the first TestFlight build.

---

## Quick reference

| Action | Command |
|---|---|
| Compute current pin | `scripts/compute-spki-pin.sh api.coyl.ai` |
| Compute pin from a key file | `openssl pkey -in KEY -pubout -outform der \| openssl dgst -sha256 -binary \| base64` |
| Inspect what's in Info.plist | `grep -A2 SPKI-SHA256-BASE64 apps/ios-rebound/Sources/Rebound/Info.plist` |
