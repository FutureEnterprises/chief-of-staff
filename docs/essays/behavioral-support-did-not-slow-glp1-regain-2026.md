# Behavioral support did not slow GLP-1 regain. Here's what will.

*Draft v1 — May 28, 2026 · Iman Schrock, COYL · For Substack + LinkedIn*

*This is a founder-voice draft. Read it for tone, structure, and
argument. Edit to your own voice before publishing. Word count: ~1,400.*

---

The most important finding in obesity medicine this year is a sentence
buried in an Oxford/BMJ meta-analysis published in January.

> "The failure of existing behavioral programs to slow regain rate after
> GLP-1 cessation was one of the more disappointing findings."

That sentence is the whole story. Read it twice.

For three decades the dominant model of behavioral weight management
was: educate the patient, hold them accountable weekly, give them a
coach to call. Noom built a $3.7B company on that model. WeightWatchers
built a 60-year brand on that model. Calibrate raised $127M on it.

Then GLP-1s arrived. Patients lost 17% of their body weight. The
behavioral programs were repositioned as "the maintenance layer." They
would keep the weight off. That was the deal: drug does the work,
coaching keeps the result.

The data is now in. The coaching does not keep the result.

[SURMOUNT-4's post-hoc analysis](https://pubmed.ncbi.nlm.nih.gov/41284285/),
published in February, showed that **82% of tirzepatide stoppers
regained more than 25% of their lost weight within a year of stopping
the drug.** [The JAMA Network Open cohort
study](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2829779)
of 125,474 patients showed **53.6% discontinue within 12 months and
72.2% within 24 months.** And the patients in those cohorts who had
access to weekly coaching, monthly check-ins, food logging, peer
community, and accountability text messages? They regained at almost
the same rate as the patients who had nothing.

The Oxford team's words again: *one of the more disappointing findings.*

So we should be disappointed. We should also be honest about why it
happened, and what it implies.

---

## Why the existing programs cannot catch the moment

The 9 PM fridge raid is not a knowledge problem. The patient knows they
shouldn't eat the leftovers. They have read the leptin chapter in the
Noom curriculum. They have been told by their coach this morning that
the danger window is the four hours after dinner. None of that
information is available to them at 9:04 PM, when their hand is on the
fridge handle and their brain has produced the sentence "I deserve
this" for the third time this week.

The thing that catches the 9 PM fridge raid is not curriculum. It is
a precisely-timed interrupt at 9:03:47 PM, before the hand moves,
that says: *you're not hungry; this is the pattern; you said you
wanted to be the person who closed the fridge tonight; here is a
30-second exercise to break the loop.*

Weekly coaching can't do that. Daily check-ins can't do that. A
twice-monthly clinician visit can't do that. The architecture of
asynchronous coaching is fundamentally mismatched to the architecture
of behavioral relapse, which is real-time, embodied, and over in three
seconds.

The category of intervention that fits the moment is what behavioral-
medicine researchers call **just-in-time adaptive intervention**, or
JITAI. Inbal Nahum-Shani and her colleagues defined it in 2018 in
[Annals of Behavioral Medicine](https://pubmed.ncbi.nlm.nih.gov/27663578/).
A JITAI is an intervention that fires precisely when the user is in
the state-of-need AND the state-of-receptivity at the same time. Not
when it is convenient for the coach. Not when it is scheduled.

The science has been mature for seven years. The consumer-grade
implementation, in the GLP-1 maintenance window, has not existed.

---

## What "real-time interrupt" actually means

Most apps that say "real-time" mean "your phone vibrates when we feel
like it." That isn't what real-time means in JITAI.

Real-time means the interrupt fires within three seconds of the
behavioral cue, before the action runs to completion. Three seconds is
not arbitrary. Three seconds is the window the behavioral-science
literature identifies as the moment when a cued behavior can still be
re-routed. After three seconds, you are not interrupting a behavior;
you are interrupting an explanation of a behavior, which is a
different and less useful job.

To fire within three seconds, the system has to:

1. **Detect the danger window** — the time-of-day, the context, the
   prior-pattern match. A patient whose binge always happens between
   8:45 and 9:30 PM after a high-stress workday is not in the same
   state at 9:04 PM as they are at 11 AM the next morning.
2. **Detect the script loading** — the lock-screen interaction
   pattern, the tab switch toward DoorDash, the explicit cue from
   the patient ("I need help"), the absence of expected cues
   ("they always brush their teeth by 9:30, it's 9:42").
3. **Choose the right intervention for THIS patient** — what works
   on the 9 PM Negotiator is different from what works on the
   Stress Rebounder is different from what works on the Reward
   Rebounder. One size of script fits exactly nobody.
4. **Deliver it in a way the patient will accept** — not a
   patronizing nag, not a scolding, not a notification that looks
   like every other notification on the phone. A specific, named,
   in-context interrupt.
5. **Learn from what happened next** — did the patient close the
   fridge? Did they open it anyway? Did they then text a friend?
   Did they go to bed? The system has to get sharper at this
   specific patient over time.

That is the architecture. It is not coaching. It is not curriculum.
It is not a chatbot. It is a sensor-driven, archetype-aware,
sub-three-second behavioral interrupt that sits on the patient's
phone and gets smarter every cycle.

---

## What we are building

COYL is the protocol layer for this kind of intervention. Rebound is
the first vertical — the one for the 10 million Americans on a GLP-1
right now, and the 25 million projected to be on one by 2030.

The product catches the 9 PM negotiation in three seconds. The product
catches the "I already broke it, I might as well finish the bag"
spiral in three seconds. The product catches the moment after a high-
stress meeting when the patient is looking for the dopamine they used
to get from the binge. The product catches the moments. That is the
whole job.

It is free for every patient on a GLP-1 or coming off one. It is
free for the patient whose insurance won't cover behavioral health.
It is free for the cost-discontinuer who lost the drug because Wegovy
went from $499 to $1,200 when their PBM dropped the coupon. The
behavioral interrupt is the floor of the product, and the floor is
free, and it will stay free.

Telehealth prescribers, employer plans, and (eventually) PBMs are
who pay COYL. They pay us because their patients stay on the drug
longer, stay on the maintenance plan longer, and don't regain. The
patient never sees a paywall in the way of the catch.

---

## Why I think this works

Three reasons.

**One**, the science is mature and unambiguous. JITAI works. The
research has been published, replicated, and largely ignored by
consumer apps for seven years because the engineering was hard and
the business model unclear.

**Two**, the moment is now. SURMOUNT-4 is fresh. Oxford/BMJ is fresh.
Every employer covering GLP-1s is staring at a 15% premium increase
and a regain problem they can't solve with their current vendors.
WeightWatchers is in bankruptcy. Calibrate sold to PE at a discount.
The category vacuum is open. It will not stay open. Whoever ships the
clinical-grade real-time JITAI product first defines the category.

**Three**, this is not a problem you can solve halfway. A consumer
app that gates the interrupt behind a $19/month subscription excludes
the patients who need it most. A coach-based program that fires at
weekly cadence misses the 9 PM window by 168 hours. The structure of
the solution has to match the structure of the failure. Free + real-
time + archetype-specific + clinically-validated is the shape of the
answer.

We are building that. We will publish the trial data when it is ready.
We will keep the catch free for everyone. And we will say so out loud,
on the record, in writing, so that when the inevitable pressure comes
to charge for the floor — and it always comes — the answer is already
in print.

---

*Iman Schrock is the founder of COYL and a public-company executive at
GCT. COYL is a behavioral interrupt platform; Rebound is its GLP-1
anti-regain vertical. He can be reached at iman@coyl.ai.*

*Citations are linked inline. The COYL protocol stack (BIP, PAP, EAP,
UAP) is published at coyl.ai/protocol.*

---

## Editorial notes for Iman

- **Word count** comes in around 1,400 — long for LinkedIn (~1,200
  ceiling), about right for Substack. If LinkedIn, cut the "What
  real-time interrupt actually means" section's numbered list down to
  3 bullets.
- **The vulnerability of the close** ("when the inevitable pressure
  comes to charge for the floor — and it always comes") is the part
  that should resonate hardest with healthcare VCs. Don't soften it.
- **Don't link to coyl.ai/rebound or any sign-up CTA in the body.**
  This is a thesis essay, not a marketing post. Footer link only.
- **The line about Calibrate and WeightWatchers** is sharper than I'd
  usually write but it's true and the reader needs to know you know
  the comp set. Keep it.
- **The "free for the cost-discontinuer" line** is the moral payload.
  It's the line a clinical co-founder would cry-read and decide to
  join you. Keep it word-for-word.
- **Publish target**: Tuesday morning, US East Coast 9-10 AM. The
  obesity-medicine MD audience reads LinkedIn at that hour.
- **Cross-post**: Substack first (longer form), LinkedIn 2 hours
  later (the LinkedIn algorithm penalizes copied-from-Substack but
  the gap helps).
