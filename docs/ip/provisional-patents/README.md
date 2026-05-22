# COYL Provisional Patent Drafts

**Status:** Three provisional patent drafts ready for IP attorney review.
**Drafted:** 2026-05-21
**Owner:** Founder
**Next step:** Identify and engage IP attorney within 2 weeks; file all three within 4 weeks.

---

## Why these exist

Per the $6B Acquisition Roadmap (see `docs/strategy/6b-action-plan.md`), the line item "no patents filed" reads as a critical vulnerability in pharma and large-acquirer diligence. A behavioral-health platform with no defended IP is harder to acquire at a strategic premium — the buyer cannot prevent a competitor from cloning the moat.

These three drafts are the scaffolds the founder hands to an IP attorney. The attorney polishes claim language to legal form and files them. The provisional filings establish the priority date — the calendar starts there.

---

## The three patents, in order of importance

### 1. `01-behavioral-context-object.md` — The Behavioral Context Object + LLM consumption pattern

**This is the platform-play patent.** It covers the structured JSON object (the BCO) that any downstream LLM consumes to become "psyche-aware." If COYL becomes the standard provider of behavioral context to Claude / GPT / Gemini consumer apps, this is the patent that defends the position.

Why it matters: it captures the *exchange format* between behavioral monitoring and LLM-powered applications. Without this, any consumer app could replicate the integration directly with the user's wearable; with this, COYL is the licensable intermediary.

Strategic weight: highest. File first if filing sequentially.

### 2. `02-multivariate-danger-window-inference.md` — Per-user logistic-regression danger-window predictor

**This is the technical moat patent.** It covers the per-user model trained on paired-outcome data, the active-vs-passive label blending, the accuracy threshold gate, and — most importantly — the intentional-withholding causal-effect measurement.

Why it matters: this is the patent that survives a "could a competitor just replicate the wearable integration?" diligence question. The paired-outcome learning loop and the per-user parameterization are the load-bearing technical inventions; the intentional-withholding measurement is the unique scientific contribution that lets the company make causal claims regulators care about.

Strategic weight: second highest. File concurrently with 01.

### 3. `03-state-matched-intervention-routing.md` — Three intervention modes + state classifier + outcome feedback

**This is the product patent.** It covers the three engineered intervention modes (high-arousal: pattern-interrupt + single action; low-arousal: pre-approved alternative; post-slip: shame-removal + minimal next action), the state classifier that routes to them, the redirect-choice prefetch, and the bandit / Bayesian routing policy update loop.

Why it matters: this is the patent a competitor with similar wearable integration would have to design around if they wanted to ship a working consumer product. The three modes are the user-visible product surface; without them, even a competitor with the BCO and the danger-window predictor still has nothing to deliver to the user.

Strategic weight: third. File concurrently with 01 and 02.

---

## Filing recommendation

**File all three simultaneously.** All three share priority-date logic — if any one is filed first, a competitor could file the others before us using public disclosure. Concurrent filing closes that window.

The patents are written as independent inventions with cross-references, so the attorney can file them as three separate provisionals or as a single combined application with three independent claim sets (attorney's call — both are defensible). Three separate filings is the safer route because each can be converted to a utility patent independently within the 12-month window, and dropping a weak one does not jeopardize the strong ones.

---

## Costs and timeline

**Per provisional, US-only:**
- Drafting and filing: $1,500 – $3,000 with a competent IP attorney
- USPTO filing fee: $130 (small entity) or $65 (micro entity)
- Total per provisional: ~$1,600 – $3,100

**Three provisionals, US-only:** $4,500 – $9,300

**International (PCT, files within 12 months):** $5,000 – $8,000 per patent, additional. For three patents: $15,000 – $24,000 extra.

**Conversion to full utility patent (required within 12 months of provisional filing):** $8,000 – $15,000 per patent (drafting + prosecution + USPTO fees). For three patents: $24,000 – $45,000.

**Total 12-month IP budget, US-only, all three filed and converted:** approximately $28,500 – $54,300.

**The 12-month clock:** the provisional filing date is the priority date. The applicant has 12 months from that date to file a full non-provisional (utility) application that converts the provisional. If the 12-month window passes without conversion, the priority date is lost and the invention is treated as if it had been publicly disclosed on the provisional filing date (which may bar later patents on the same disclosure depending on jurisdiction).

**Recommended timeline:**
- Week 0 (now): founder reviews drafts, fills in inventor name, assignee, and any technical confirmations.
- Week 1: engage IP attorney (recommend prior-art search first — $1,500 – $3,000 for the three together).
- Weeks 2-4: attorney polishes claim language, drafts formal sections, requests illustrator work for drawings.
- Week 4: file all three with USPTO. Priority date locked.
- Months 4-9: prior-art monitoring, evaluation of which to convert.
- Months 9-11: convert chosen subset to utility patents (recommend converting all three unless freedom-to-operate search uncovers blocking prior art).
- Month 12: conversion deadline.

---

## IP attorney brief (the 1-page memo)

> **To:** [IP attorney]
> **From:** [Founder]
> **Re:** Three provisional patents — COYL behavioral-health platform
>
> COYL is a behavioral-interrupt system that combines wearable physiological signal with smartphone environmental signal, infers per-user "danger windows" using a personalized predictive model, and routes interventions to users at moments of elevated slip risk.
>
> The system has three load-bearing technical inventions, each drafted as a provisional in the attached folder:
>
> 1. **Behavioral Context Object (BCO).** A structured JSON object representing the user's current behavioral state, designed to be consumed by downstream LLMs as input context. Independent claim covers the BCO data model, the API surface, and the LLM consumption pattern.
>
> 2. **Multivariate danger-window inference.** A per-user predictive model (logistic regression in V0, richer models in V1+) trained on paired-outcome data, with intentional-withholding causal-effect measurement.
>
> 3. **State-matched intervention routing.** A state classifier that maps multivariate signal to one of four state classes, plus three engineered intervention modes (high-arousal, low-arousal, post-slip) with per-user routing policy update via bandit / Bayesian feedback.
>
> Drafts include: title, field, background, brief summary, detailed description (~1,000-1,400 words each), 15 claims per patent (independent + dependent), and drawing descriptions for the illustrator.
>
> **What I need from you:**
> 1. **Prior-art search** across the three inventions, with specific emphasis on:
>    - JITAI (just-in-time adaptive intervention) literature in mHealth.
>    - Existing wearable + LLM personalization patents.
>    - Contextual bandits in consumer health.
> 2. **Claim polish** to legal form, with attention to:
>    - §101 abstract-idea risk on the BCO (consider apparatus-with-wearable framing).
>    - Divided-infringement risk on multi-device claims (consider server-only alternates).
>    - Whether the "shame-removal language" element in patent 3 survives §101.
> 3. **Filing logistics** — recommend US provisional vs PCT, suggest illustrator referral for the drawings.
> 4. **Timeline confirmation** — confirm 4-week filing target is realistic.
>
> **What I will provide:**
> - Inventor declarations (one per patent).
> - Technical confirmations on any open questions you flag.
> - Illustrator coordination if you do not have a preferred vendor.
> - Payment of filing fees and your retainer.

---

## Founder action items before the attorney call

1. **Confirm inventor of record** for each patent. If multiple inventors (e.g., co-founder, key engineer), each must be named correctly — inventor disputes are the single largest cause of patent invalidation.
2. **Confirm assignee** — the legal entity that will own the patents (typically the company, not the founder personally). If the company is not yet incorporated, file under the founder and assign later via a written assignment agreement.
3. **Public-disclosure audit** — check whether any of the three inventions has been publicly disclosed (e.g., in a blog post, podcast appearance, pitch deck shared with non-NDA investors, demo to non-NDA partners). The US has a 1-year grace period for inventor's own disclosures, but other jurisdictions are stricter. Document the earliest disclosure date for each invention.
4. **Specific technical confirmations** to give the attorney before the call:
   - **Patent 01:** Confirm the BCO taxonomy sizes (currently drafted as 6 archetypes and 8 excuse categories). Are these the production values? If the production system uses different N, update the dependent claims to match.
   - **Patent 01:** Confirm whether the BCO is generated server-side only, or whether on-device generation is also supported. Draft currently assumes server-side; on-device support changes the claim language.
   - **Patent 02:** Confirm the V0 model is in fact a logistic regression in production. If it is a different functional form (decision tree, neural net), the dependent claims need updating.
   - **Patent 02:** Confirm the intentional-withholding fraction f currently in production (drafted as 10%). Confirm whether the withholding is random per-window or follows a structured schedule.
   - **Patent 03:** Confirm the exact copy of the three intervention modes in production. The drafted examples are illustrative; the attorney may want representative actual production strings as illustrative figures.
   - **Patent 03:** Confirm voice-mode delivery is shipped or planned. If not yet shipped, draft a claim variant that does not require voice-mode (text-mode only) as a fallback in case voice-mode is contested.
5. **Confidentiality** — until the provisional is filed, treat all three drafts as confidential and disclose only under NDA. Do not post excerpts publicly.

---

## Files in this folder

- `README.md` — this document.
- `01-behavioral-context-object.md` — Behavioral Context Object + LLM consumption pattern. ~3,400 words.
- `02-multivariate-danger-window-inference.md` — Per-user danger-window predictor + paired-outcome training. ~3,400 words.
- `03-state-matched-intervention-routing.md` — Three intervention modes + state classifier + outcome feedback. ~3,300 words.

---

## Open questions that need founder + attorney decision

1. **Single combined application vs three separate provisionals.** Trade-off: combined is cheaper to file but harder to convert selectively; separate is more expensive but allows dropping a weak one without affecting the others. Recommend separate.
2. **US-only vs PCT.** US-only at provisional stage is cheap and sufficient if the company expects to be acquired by a US buyer. PCT is required if international defense is a priority. Recommend US-only at provisional stage, decide on PCT at conversion time (months 9-11).
3. **Trade-secret strategy in parallel.** Some elements of the system (specific model weights, specific copy strings, specific user behavioral data) are stronger as trade secrets than as patent disclosures. Confirm with attorney which elements to disclose in the patent vs hold as trade secret.
4. **Founder inventor declarations** — confirm the founder is the sole inventor on all three, or identify co-inventors. If there are engineers who contributed inventively (not merely implementatively), they must be named.
5. **Defensive vs offensive posture.** These patents can be used defensively (to protect against being sued by competitors) or offensively (to sue competitors). The drafting style is the same; the post-filing strategy diverges. This decision can be deferred to conversion time.
