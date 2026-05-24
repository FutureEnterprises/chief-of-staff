# COYL Business Associate Agreement — TEMPLATE

> **OUTSIDE-COUNSEL HANDOFF — DRAFT, NOT LEGAL ADVICE.**
>
> This is a scaffold for a healthcare attorney to take over. It is
> intentionally generic; jurisdictional terms, indemnification limits,
> data-use specifics, and the "Covered Entity vs Business Associate"
> classification all need legal review before any version of this
> agreement is executed with a clinical partner.
>
> Until executed, the public-facing language on `/clinician` and
> `/rebound/for-clinicians` reads "**HIPAA-aligned data layer · BAA
> available on request**" — softened from "HIPAA-compliant" per the
> May 2026 compliance posture brief (`compliance-posture-may-2026.md`).
> Do NOT restore the stronger claim on the marketing surface until this
> BAA has been executed with at least one Covered Entity AND upstream
> BAAs are in place with Anthropic, Supabase, Vercel, Resend, and
> Twilio (see §6 below).

---

## 1. Parties

This Business Associate Agreement ("**BAA**") is between:

**Covered Entity:** [CLINIC LEGAL NAME], a [STATE] [ENTITY TYPE], with
its principal place of business at [ADDRESS] ("**Covered Entity**").

**Business Associate:** COYL, Inc. (or COYL operating entity at time
of execution), a Delaware corporation, with its principal place of
business at [TBD] ("**Business Associate**").

Effective Date: [DATE]

## 2. Definitions

Terms used but not otherwise defined in this BAA have the meanings
assigned in the HIPAA Rules (45 CFR Parts 160 and 164), including:
PHI, Electronic PHI, Required by Law, Security Incident, Breach,
Unsecured PHI.

## 3. Permitted Uses and Disclosures by Business Associate

Business Associate may use and disclose PHI:

- To perform the services described in **Exhibit A** (the COYL
  behavioral interrupt protocol delivered to Covered Entity's
  patients), and
- As Required by Law, and
- For Business Associate's proper management and administration,
  provided that any disclosures are Required by Law OR Business
  Associate obtains reasonable assurances from the recipient that the
  PHI will be held confidentially and the recipient will notify
  Business Associate of any breaches.

Business Associate may NOT use or disclose PHI in a manner that would
violate Subpart E of 45 CFR Part 164 if done by Covered Entity, except
for the uses and disclosures permitted in this BAA.

## 4. Obligations of Business Associate

Business Associate agrees to:

a. Not use or disclose PHI other than as permitted by this BAA or
   Required by Law.

b. Use appropriate safeguards, and comply with Subpart C of 45 CFR
   Part 164 with respect to electronic PHI, to prevent use or
   disclosure of PHI other than as provided for by this BAA.

c. Report to Covered Entity any use or disclosure of PHI not provided
   for by this BAA of which it becomes aware, including Breaches of
   Unsecured PHI as required at 45 CFR 164.410 and any Security
   Incidents of which it becomes aware. **Notification window for
   Breaches: WITHOUT UNREASONABLE DELAY AND NO LATER THAN [10
   BUSINESS DAYS] AFTER DISCOVERY.** [Counsel: align with state
   breach-notification statutes; some states require <72 hours.]

d. Ensure that any subcontractors that create, receive, maintain, or
   transmit PHI on behalf of Business Associate agree to the same
   restrictions and conditions that apply to Business Associate (see
   §6 — Upstream BAAs).

e. Make available PHI in a Designated Record Set to Covered Entity
   as necessary to satisfy Covered Entity's obligations under 45 CFR
   164.524.

f. Make any amendment(s) to PHI in a Designated Record Set as
   directed or agreed to by Covered Entity pursuant to 45 CFR
   164.526, or take other measures as necessary.

g. Maintain and make available the information required to provide an
   accounting of disclosures to Covered Entity as necessary to
   satisfy Covered Entity's obligations under 45 CFR 164.528.

h. To the extent Business Associate is to carry out one or more of
   Covered Entity's obligations under Subpart E of 45 CFR Part 164,
   comply with the requirements of Subpart E that apply to Covered
   Entity in the performance of such obligations.

i. Make its internal practices, books, and records available to the
   Secretary for purposes of determining compliance with the HIPAA
   Rules.

## 5. Permitted Uses and Disclosures by Covered Entity

Covered Entity shall:

a. Notify Business Associate of any limitation(s) in the notice of
   privacy practices of Covered Entity that may affect Business
   Associate's use or disclosure of PHI.

b. Notify Business Associate of any changes in, or revocation of,
   permission by an individual to use or disclose PHI.

c. Notify Business Associate of any restriction on the use or
   disclosure of PHI that Covered Entity has agreed to or is required
   to abide by.

## 6. Upstream BAAs Required Before Execution

COYL Business Associate cannot execute this BAA in good faith until
the following upstream Business Associate Agreements are in place
(every subprocessor that may touch PHI):

- [ ] **Anthropic** — model inference. COYL routes user-authored chat
      content (including PHI when the user discloses it) through
      Anthropic. Anthropic offers a BAA on enterprise plans.
- [ ] **Supabase** — primary database hosting. Supabase offers a BAA
      on Pro and Team plans; verify which plan COYL is on and execute.
- [ ] **Vercel** — application hosting + edge functions. Vercel
      offers a BAA on Enterprise; if COYL is on Pro, this is the
      single largest blocker to genuine HIPAA Business Associate
      claims.
- [ ] **Resend** — transactional email. Verify BAA availability;
      Resend's status on PHI-bearing email is plan-dependent.
- [ ] **Twilio** — SMS delivery. Twilio offers a BAA via their
      Healthcare suite; verify edition.
- [ ] **Clerk** — auth. Clerk holds identifiers (name, email) that
      become PHI when associated with a clinical context. Verify BAA.
- [ ] **Resend / Apify / any other subprocessor that crosses the PHI
      boundary.**

## 7. Term and Termination

a. **Term.** This BAA is effective as of the Effective Date and
   continues in effect until terminated.

b. **Termination for Cause.** Either party may terminate this BAA
   immediately upon material breach by the other party not cured
   within [30] days after written notice.

c. **Obligations on Termination.** Upon termination, Business
   Associate shall return or destroy all PHI received from, or
   created or received by Business Associate on behalf of, Covered
   Entity. If return or destruction is not feasible, Business
   Associate shall extend the protections of this BAA to such PHI and
   limit further uses and disclosures to those purposes that make
   return or destruction infeasible.

## 8. Miscellaneous

a. **Amendment.** This BAA may be amended only by a written
   instrument signed by both parties.

b. **Governing Law.** This BAA shall be governed by the laws of the
   State of [TBD] without regard to its conflict-of-laws principles.

c. **Survival.** The respective rights and obligations of Business
   Associate under §7(c) shall survive termination.

d. **Regulatory References.** A reference to a section in HIPAA means
   the section as in effect or as amended.

---

## Exhibit A — Description of Services

Business Associate provides the COYL Behavioral Interrupt Protocol to
Covered Entity's patients. Services include:

- Patient onboarding (consent capture, archetype assignment)
- Behavioral pre-slip signal generation from passive + active inputs
- Three-second-window interrupt delivery via push notification, SMS,
  email, or in-app surface
- Clinician dashboard with aggregate cohort metrics
- HIPAA-aligned data retention and access controls

[Counsel: tighten scope based on the actual technical surface area
shipped at execution time. Reference the Privacy Policy + Terms of
Service in effect at execution.]

---

## Author + handoff state

- **Drafted by:** COYL founder (Iman Schrock) with engineering
  scaffolding from the May 2026 compliance posture work.
- **Next step:** outside healthcare counsel review. Recommended:
  retain a Foley Hoag / Manatt / Crowell tier firm with HIPAA + state
  privacy experience for a 30-day engagement to (a) execute upstream
  BAAs, (b) review this template, (c) advise on Covered Entity vs
  Business Associate classification (COYL is currently neither at the
  D2C tier — the question is what to call it when paired with a
  prescriber).
- **Until counsel-approved version exists:** do NOT execute any BAA
  with a clinical partner from this template. The marketing language
  on `/clinician` and `/rebound/for-clinicians` is softened to
  "available on request" — meaning a request triggers the legal
  conversation, not a paste of this draft.
