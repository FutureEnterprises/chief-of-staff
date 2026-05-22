# Provisional Patent Application

**Application Type:** Provisional Patent Application (35 U.S.C. § 111(b))
**Status:** DRAFT — to be polished by IP attorney before filing
**Drafted:** 2026-05-21
**Inventor of record:** [Founder Full Legal Name]
**Assignee (anticipated):** [Company Legal Entity Name]

---

## Title of Invention

**System and Method for Routing Behavioral Interventions Based on Real-Time Classification of User Physiological and Behavioral State**

---

## Cross-Reference to Related Applications

This application is filed concurrently with two related provisional applications by the same inventor:
1. "System and Method for Generating and Distributing a Behavioral Context Object for Use by Downstream Large Language Models" (Attorney Docket No. [TBD])
2. "System and Method for Inferring Behavioral Danger Windows from Multivariate Physiological and Environmental Signal Clusters" (Attorney Docket No. [TBD])

---

## Field of the Invention

This invention relates to behavioral health intervention systems, and more particularly to the selection and routing of intervention content as a function of a real-time classification of the user's physiological and behavioral state. The invention addresses the technical problem that a single, fixed intervention template — for example, a motivational message or a breathing exercise — is mismatched against the heterogeneity of states in which a user may receive it, and is therefore frequently counterproductive (annoying a stressed user, boring a depleted user, shaming a post-slip user).

---

## Background of the Invention

Mobile and wearable behavioral interventions for habit change, addiction recovery, weight management, and mental health typically deliver a fixed or randomly selected content template at the moment of intervention. The intervention is typically authored once, tested in a controlled study, and shipped to all users in all states. Examples include:

- A breathing exercise prompt triggered by elevated heart rate.
- A motivational quote pushed at a scheduled time of day.
- A self-talk reframing exercise offered after a self-reported slip.
- A static "tap to log craving" button that opens the same logging interface regardless of state.

These intervention designs presuppose that the user is in a state in which the content will be useful. In practice, a user receiving the same intervention may be:

- In a high-arousal state (acutely stressed, with low cognitive bandwidth) — long-form text is rejected, breathing exercises feel patronizing, the user needs a single physical action they can perform without thought.
- In a low-arousal state (depleted, bored, end-of-day) — motivational language is grating, the user needs an alternative stimulus that is itself rewarding enough to displace the slip-eliciting stimulus.
- In a post-slip state (after a tagged slip) — shame-evoking language ("you broke your streak") triggers withdrawal, the user needs explicit shame-removal language and a minimal next action.
- In a calm baseline state — most prior-art interventions perform acceptably here, but in this state the user is not at risk and intervention is typically unnecessary.

Existing intervention systems do not classify the user's state and route to a state-appropriate intervention template. Some systems offer "personalization" — the user picks favorite content during onboarding — but this is time-invariant, not state-contingent.

The present invention addresses this gap by classifying the user's current state in real time and routing to one of a finite set of state-matched intervention modes, each engineered for the specific psychological dynamics of its target state.

---

## Brief Summary of the Invention

The invention provides a method and system for state-matched behavioral intervention routing, comprising:

(a) receiving from a behavioral monitoring system a multivariate signal cluster indicating the user's current physiological and behavioral state;

(b) classifying said state into one of a finite set of state classes, including at minimum: high-arousal, low-arousal, post-slip, and calm;

(c) selecting an intervention mode from a finite set of intervention modes, each engineered to match a specific state class;

(d) prefetching, for the user's current context, a ranked list of pre-approved alternative stimuli ("redirect choices") from a user-managed library, ranked by historical acceptance count;

(e) delivering the selected intervention via either a text-mode delivery (in-app notification or screen overlay) or a voice-mode delivery (audio playback via a paired smart speaker, earbuds, or smartphone speaker), with the delivery mode selected as a function of the user's currently inferred attention modality;

(f) capturing user response feedback — whether the user accepted the intervention (caught-me), declined it (ignored), or slipped despite it (slipped) — and pairing the feedback with the intervention mode and state class; and

(g) updating, per-user, the routing function such that the intervention mode most consistently producing caught-me outcomes for a given state class is preferentially selected in future occurrences of that state class.

---

## Detailed Description of the Invention

### 1. The three intervention modes

The system defines, at minimum, three state-matched intervention modes:

**Mode A — High-arousal intervention: pattern-interrupt + single-physical-action.**

Engineered for the high-arousal state class. The intervention copy is short (under 20 words), uses a pattern-interrupt opening (an unexpected sensory cue, a question instead of a statement, or a name address), and proposes exactly one immediate physical action that requires minimal cognitive bandwidth.

Example copy structure (illustrative, not limiting):
- "Hey. Push your feet into the floor for five seconds."
- "Stop. Find one object in the room that is blue."
- "[Name]. Hold your breath for four seconds, then exhale."

Rationale: in high-arousal states, prefrontal cortex bandwidth is reduced; long-form reasoning is rejected; a single concrete physical action can interrupt the arousal cascade and create a small window of regained executive control.

**Mode B — Low-arousal intervention: alternative-stimulus from pre-approved list.**

Engineered for the low-arousal state class. The intervention does not attempt to motivate; it offers a specific alternative stimulus drawn from the user's own pre-approved list, selected to be at least as rewarding as the slip-eliciting stimulus would be.

Example copy structure (illustrative, not limiting):
- "You're bored. Top three alternatives right now: [option 1], [option 2], [option 3]. Tap to pick."
- "Low-energy moment. Your saved 5-minute reset: [user-curated activity]. Start?"

Rationale: in low-arousal states, the slip-eliciting behavior is functioning as a stimulant or reward; mere prohibition fails because no alternative reward is provided. The user's own pre-approved alternatives are higher-acceptance than generic motivational content.

**Mode C — Post-slip intervention: shame-removal + minimal-next-action.**

Engineered for the post-slip state class. The intervention copy explicitly removes shame language, normalizes the slip, and proposes the smallest possible re-engagement action.

Example copy structure (illustrative, not limiting):
- "It happened. That's data, not a verdict. One small thing now: [minimal action]."
- "Slip logged. The next 60 seconds are the only thing that matters. Pick: [option 1] or [option 2]."

Rationale: post-slip, the dominant cognitive state is shame-driven avoidance; shaming language ("you broke your streak") triggers further avoidance. Explicit shame-removal combined with a minimal action increases the probability of re-engagement.

### 2. Additional intervention modes

The system may be extended with additional modes for additional state classes, including without limitation:

- **Mode D — Calm-baseline intervention: skill-building or pre-commitment.** When the user is in a calm state but approaching a known danger window, the intervention proposes a pre-commitment action ("set up your alternative for this afternoon now").
- **Mode E — Social-trigger intervention.** When the multivariate signal indicates a social-context trigger, intervention copy addresses the social dynamic explicitly.
- **Mode F — Travel/disruption intervention.** When the user's context indicates routine disruption, intervention copy acknowledges the disruption and offers a routine-substitution suggestion.

The system architecture supports an extensible mode registry, where new modes may be added without modification to the state classifier or the routing function.

### 3. The state classifier

The state classifier accepts the multivariate signal cluster as input and outputs a state class. The classifier may be implemented as:

- A **logistic regression** over the signal vector, with one output unit per state class and softmax normalization.
- A **decision tree** with hand-engineered or learned splits on signal features.
- A **state machine** with explicit transition rules (for example: "if a slip was logged in the last 4 hours, force state_class := post_slip").
- A **small neural network** for richer feature interactions.
- A **rule-based pre-empt** that always routes to post-slip if a slip has been logged within the recovery window, regardless of physiological signal.

The invention is agnostic to the specific classifier form. The novelty is in the routing function — the mapping from state class to intervention mode — and the outcome-feedback update loop, both described below.

### 4. Redirect-choice prefetch

For Mode B (low-arousal) and Mode C (post-slip), the intervention copy includes a list of user-curated alternatives ("redirect choices"). The system maintains a per-user library of pre-approved alternatives, populated during onboarding and updated over time.

At the moment of intervention, the system prefetches the user's library, ranks alternatives by historical acceptance count (the number of times the user has selected each alternative when offered), and presents the top K (typically K=3). This ensures the offered alternatives are both familiar and historically effective for the specific user.

The ranking function may include additional factors: time-of-day appropriateness (a workout is inappropriate at 11pm), location compatibility (cooking is inappropriate in transit), and recency (suppressing alternatives offered too recently to avoid repetition fatigue).

### 5. Voice-mode versus text-mode delivery

The system selects the delivery modality based on the user's currently inferred attention modality:

- **Text-mode** — delivery as a push notification, in-app notification, or screen overlay. Selected when the user's phone is in active use, screen is on, or the user is in a context (e.g., a meeting, transit on public transport) where audio delivery would be inappropriate.
- **Voice-mode** — delivery as audio playback via paired earbuds, a smart speaker, or the smartphone's speaker. Selected when the user has audio output available, is not in a no-audio context, and has consented to audio delivery.

The modality selector reads from device-state signal: paired-device list, current audio output route, ambient noise level, calendar event type, and user-set preferences.

### 6. Outcome feedback loop

Each intervention generates one of three labeled outcomes:

- **caught_me** — the user explicitly acknowledged the intervention as helpful (e.g., tapped a confirmation, selected an offered alternative, did not slip in the forward window).
- **ignored** — the user did not respond to the intervention and did not slip in the forward window.
- **slipped** — the user slipped despite the intervention.

The outcome is paired with: the state class at the time of intervention, the intervention mode delivered, the delivery modality, and the time-of-day. This (state, mode, modality, time, outcome) tuple is stored per-user.

The routing function consults the user's accumulated tuples to update routing preferences. Specifically, for a given state class, the routing function preferentially selects the intervention mode and modality combination with the highest empirical caught_me rate for that user. This produces a per-user, per-state-class routing policy that improves with experience.

The update may be implemented as:

- **Frequentist** — direct empirical caught_me-rate per (state, mode, modality) bucket, with the highest rate winning.
- **Bayesian / Thompson sampling** — a beta-Bernoulli model per bucket, with sampling from the posterior to balance exploration and exploitation.
- **Contextual bandit** — a contextual multi-armed bandit formulation where context is the signal cluster and arms are (mode, modality) pairs.

### 7. System architecture

The system comprises:

- **State classifier service** — receives the multivariate signal cluster, emits state class.
- **Mode registry** — declarative catalog of intervention modes, their copy templates, and their state-class compatibility.
- **Redirect library service** — per-user store of pre-approved alternatives with ranking metadata.
- **Modality selector** — reads device-state signal and outputs text-mode or voice-mode.
- **Delivery layer** — push notification dispatcher, in-app overlay renderer, audio playback dispatcher.
- **Outcome capture layer** — endpoints for explicit user response and adapters for implicit response inference.
- **Routing policy service** — maintains the per-user (state, mode, modality, time, outcome) tuple store and serves routing decisions.

### 8. Integration with related inventions

This invention consumes the behavioral state information produced by the Behavioral Context Object (related application 01) and the danger-window inference engine (related application 02). The three inventions form a coordinated stack: 02 produces predictions, 03 routes interventions on those predictions, and 01 packages the user's state for downstream LLM consumers. Each invention is independently useful and independently claimed.

---

## Claims

**Claim 1.** A computer-implemented method comprising:

(a) receiving a multivariate signal cluster indicating a user's physiological and behavioral state;

(b) classifying said state into one of a finite set of state classes including at least: high-arousal, low-arousal, and post-slip;

(c) selecting an intervention mode from a finite set of intervention modes, each said intervention mode being engineered for a specific said state class;

(d) delivering the selected intervention to the user via an output device;

(e) capturing a user response feedback indicating whether the user accepted the intervention, declined the intervention, or slipped subsequent to the intervention; and

(f) updating, per-user, a routing function such that the intervention mode most consistently producing user-accepted outcomes for a given state class is preferentially selected in future occurrences of that state class.

**Claim 2.** The method of claim 1, wherein the finite set of intervention modes comprises at least:

a high-arousal intervention mode comprising a pattern-interrupt opening and a single proposed physical action;

a low-arousal intervention mode comprising an alternative-stimulus selection drawn from a user-managed library of pre-approved alternatives; and

a post-slip intervention mode comprising shame-removal language and a minimal next action proposal.

**Claim 3.** The method of claim 2, wherein the low-arousal intervention mode further comprises prefetching the user-managed library and ranking the pre-approved alternatives by historical acceptance count specific to the user.

**Claim 4.** The method of claim 1, further comprising selecting a delivery modality from a set including text-mode and voice-mode, said selection being a function of the user's currently inferred attention modality.

**Claim 5.** The method of claim 4, wherein the voice-mode delivery comprises audio playback via at least one of: paired earbuds, a smart speaker, and a smartphone speaker.

**Claim 6.** The method of claim 1, wherein the routing function is updated using a contextual multi-armed bandit formulation in which the context comprises the multivariate signal cluster and the arms comprise the intervention modes.

**Claim 7.** The method of claim 1, wherein the routing function is updated using a Bayesian model in which a posterior distribution over each (state class, intervention mode) bucket is updated using the captured user response feedback.

**Claim 8.** The method of claim 1, wherein the post-slip state class is determined at least in part by a rule-based pre-empt that forces classification to post-slip if a slip event has been logged within a defined recovery window, regardless of physiological signal.

**Claim 9.** The method of claim 1, wherein the intervention copy delivered to the user is selected from a copy template registry that associates each intervention mode with at least one parameterized copy template, and wherein parameters are substituted at delivery time including at least one of: user name, current time, location class, and selected alternative.

**Claim 10.** The method of claim 1, further comprising publishing a state-class field to a behavioral context object as defined in a related application, said state-class field being consumable by a downstream large language model.

**Claim 11.** A non-transitory computer-readable storage medium storing instructions that, when executed by one or more processors, cause the one or more processors to perform the method of claim 1.

**Claim 12.** A behavioral intervention routing system comprising:

a state classifier configured to receive a multivariate signal cluster and emit a state class selected from a finite set including at least high-arousal, low-arousal, and post-slip;

a mode registry configured to maintain a declarative catalog of intervention modes and their state-class compatibility;

a redirect library service configured to maintain, per-user, a store of pre-approved alternative stimuli with ranking metadata;

a modality selector configured to read device-state signal and select between a text-mode delivery and a voice-mode delivery;

a delivery layer configured to render and emit the selected intervention to the user via the selected modality; and

a routing policy service configured to update, per-user, the mapping from state class to intervention mode using captured user response feedback.

**Claim 13.** The system of claim 12, wherein the redirect library service ranks pre-approved alternatives using at least: historical user acceptance count, time-of-day appropriateness, location compatibility, and recency of prior offering.

**Claim 14.** The system of claim 12, further comprising a copy template registry, wherein each intervention mode is associated with a parameterized copy template and wherein the delivery layer substitutes parameters at delivery time.

**Claim 15.** The method of claim 1, wherein the user response feedback comprises one of: an explicit acknowledgement entered by the user, an implicit inference derived from the user's behavior in the forward window after delivery, and a tagged slip event in the forward window after delivery.

---

## Drawing Descriptions (for illustrator)

**Fig. 1 — Routing system block diagram.** Boxes for state classifier, mode registry, redirect library, modality selector, delivery layer, outcome capture, and routing policy service. Arrows showing the data flow from signal cluster ingestion through to intervention emission and outcome capture.

**Fig. 2 — Three intervention modes side-by-side.** Three columns labeled Mode A (High-arousal), Mode B (Low-arousal), Mode C (Post-slip). Each column shows: target state, copy structure template, example rendering, and rationale.

**Fig. 3 — Redirect-choice ranking flow.** A flowchart showing the user-managed library, the ranking function (with inputs: acceptance count, time, location, recency), and the top-K selection emitted to the delivery layer.

**Fig. 4 — Modality selection decision tree.** A decision tree showing the device-state signal inputs (paired devices, audio route, ambient noise, calendar event type, user preference) and the binary text-vs-voice output.

**Fig. 5 — Outcome feedback loop and routing policy update.** A diagram showing the tuple capture (state, mode, modality, time, outcome), the per-user store, the bandit / Bayesian update, and the updated routing policy flowing back to the mode selector for next-intervention selection.

---

## Notes for IP Attorney

1. The independent claim recites three intervention modes (high-arousal, low-arousal, post-slip) as minimums. Confirm whether to narrow to exactly three (stronger novelty argument) or generalize to "a plurality of intervention modes, each engineered for a specific state class" (broader coverage).
2. Prior art search should emphasize: just-in-time adaptive interventions (JITAI) in mHealth literature, contextual bandits in personalization, and any prior work on shame-removal language in post-slip recovery (this last one may be the most novel of the three modes).
3. The voice-mode versus text-mode modality selection has prior art in general assistant systems; the inventive distinction here is the coupling to state class, which the attorney should ensure is recited.
4. The copy template registry could be claimed separately as a sub-invention. Consider a divisional or separate claim set.
5. Confirm whether the "shame-removal language" claim element survives §101 — it may read as a printable-matter abstract idea unless tied tightly to the technical state-classifier-and-routing system.
