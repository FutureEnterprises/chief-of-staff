# Chrome Web Store — listing copy (v0.1)

> Submission target: Chrome Web Store. The Edge Add-ons listing and
> the Firefox AMO listing reuse 95% of this copy with store-specific
> length caps applied at submission.
>
> Per the May 2026 product blueprint memo: the browser extension is
> the off-phone surface that proves COYL is a behavioral OS not a
> phone app. Listing copy must read like a behavioral infrastructure
> product, not a "site blocker." The category is "Productivity" not
> "Accessibility."

---

## Field 1 — Extension name

**Primary:**
`COYL — Stop the script`

**Fallback (if "Stop the script" is rejected as a tagline within a name):**
`COYL — Behavioral Interrupt`

(Max 75 chars Chrome / 45 chars Edge. The primary fits both.)

---

## Field 2 — Short description (max 132 chars)

**Primary:**
`The tab-switch is the 3-second window. COYL fires before the day disappears into Reddit, X, YouTube, TikTok, Instagram.`

(131 chars — fits Chrome's 132-char cap. Drop "Instagram" for Edge's 128-char cap if needed → 121 chars.)

**Alt for A/B test after first 1K installs:**
`Catch yourself before the third tab open. COYL is the behavioral interrupt layer for the surface where your day disappears.`

---

## Field 3 — Detailed description (max 16,000 chars)

```
COYL is the behavioral interrupt layer for your browser.

The browser is the surface where most procrastination happens — the
third Reddit tab, the YouTube algorithm spiral, the X doomscroll
that started at 9 PM and ended at 2 AM. COYL fires at the exact
3-second window between trigger and action: the tab open before the
page loads.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install the extension. No account required for v0.1. Local-only
   by default. Your data does not leave your machine.

2. Set your watchlist. Comes pre-loaded with the eight highest-cost
   sites: Reddit, X (Twitter), YouTube, TikTok, Instagram, Facebook,
   Hacker News. Add or remove any site in one click.

3. Open a watchlisted site three times in ten minutes. COYL fires a
   full-screen interrupt before the page renders. Three choices:

      → Close the tab (the win path)
      → Open rescue (jumps to coyl.ai/rescue for a 90-second reset)
      → Continue one minute (the honest-with-yourself path)

4. Mute any domain for 1 hour, 1 day, or forever. You're in control.
   COYL doesn't block — it surfaces the choice.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT MAKES COYL DIFFERENT FROM A SITE BLOCKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Site blockers prevent. COYL interrupts.

Blockers fight you. They make a fortress. They lose the moment you
disable them — and you always disable them.

COYL doesn't lock the door. COYL shows up at the door and says:
"You opened Reddit three times in ten minutes. The third open is
the one. Do you want this?"

You decide. Every time. That's the difference. Behavioral change
research calls this a Just-In-Time Adaptive Intervention (JITAI).
We call it stopping the script.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COYL is built on the Behavioral Interrupt Protocol (BIP), an open
Apache 2.0 spec at coyl.ai/protocol. The browser extension is the
reference implementation of one signal source. The same protocol
powers iOS, Android, Watch, and a growing set of partner surfaces.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v0.1 is local-only. Your tab history, watchlist, mutes, and
interrupt feedback live in chrome.storage.local. Nothing is
transmitted to any server. No account required. No tracking. No
ads.

v0.2 (Q3 2026) will add an OPTIONAL coyl.ai account sync so your
watchlist and interrupt history follow you across machines and
unify with your iOS / web COYL data. Sync stays optional. The
extension will always work fully local.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERMISSIONS — WHY WE ASK FOR EACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• storage — to remember your watchlist, mutes, and stats locally
• tabs — to know when you open a watchlisted tab
• alarms — to expire timed mutes ("snooze for 1 hour")
• notifications — to deliver the interrupt
• host_permissions for coyl.ai — to open the rescue page when you
  click "Open rescue"
• content scripts on watchlisted sites — to render the interrupt
  overlay before the page becomes interactive

We do not collect your browsing history. We do not read page
content. The content script reads the URL host, increments a local
counter, and either does nothing or renders an overlay.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHO THIS IS FOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Knowledge workers losing 90 minutes a day to the tab loop
→ Founders who said the deep-work block out loud and then opened X
→ Students whose study session keeps becoming a Reddit session
→ Anyone in recovery from compulsive-feed behavior
→ Anyone who reads coyl.ai's manifesto and recognizes themselves

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT'S COMING NEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v0.2 — OAuth + coyl.ai account sync + cross-device watchlist
v0.3 — AI-written interrupt copy ("Why this fired" learns your
        pattern from your COYL behavioral model)
v0.4 — Calendar integration: stronger interrupts during scheduled
        deep-work blocks
v0.5 — Safari extension port

Submit feedback: feedback@coyl.ai
Open the protocol: https://coyl.ai/protocol
Read the manifesto: https://coyl.ai/manifesto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COYL is behavioral support, not medical treatment. If you are in
crisis, please contact a clinician or call 988 (US Suicide &
Crisis Lifeline).
```

(Word count ~620, char count ~3,800 — well under Chrome's 16,000-char
cap. Edge and AMO both accept the same body. AMO truncates at 10,000
chars if we ever exceed it.)

---

## Field 4 — Category

**Primary:** Productivity
**Secondary (if multi-select allowed):** Workflow & Planning Tools

NOT "Accessibility" (wrong audience). NOT "Social & Communication"
(misframes the product).

---

## Field 5 — Language

`English (United States)`

(EN only for v0.1 launch. v0.2 adds ES, PT-BR, DE.)

---

## Field 6 — Single purpose statement (Chrome-specific)

```
COYL fires a behavioral interrupt when the user opens a
self-identified high-cost website (Reddit, X, YouTube, TikTok,
Instagram, Facebook, Hacker News, or any site the user adds) more
than three times in a ten-minute window. The interrupt asks the
user whether they want to continue, close the tab, or open a
rescue session. The single purpose is to deliver a Just-In-Time
Adaptive Intervention (JITAI) at the tab-switch event.
```

---

## Field 7 — Privacy practices declaration (Chrome-specific)

Required checkboxes / answers:

- [x] **Does not collect or use** any user data.
- [x] **No data sold to third parties.**
- [x] **No data used for purposes unrelated to the single purpose.**
- [x] **No data used or transferred to determine creditworthiness.**

Justification text (max 500 chars):
```
COYL v0.1 is fully local. All user data — watchlist, mutes, tab
counters, interrupt feedback — is stored in chrome.storage.local
on the user's machine. Nothing is transmitted to any server. No
account is required. The host permission for coyl.ai is used only
to open the public rescue URL when the user clicks "Open rescue."
No browsing data, page content, or analytics events leave the
user's browser.
```

---

## Field 8 — Support email / URL

- Support email: `support@coyl.ai`
- Support URL: `https://coyl.ai/help`
- Privacy policy URL: `https://coyl.ai/privacy`
- Homepage URL: `https://coyl.ai`

(Confirm all four URLs return 200 before submission.)

---

## Field 9 — Promotional summary (used on Chrome Web Store category pages)

`The behavioral interrupt layer for the browser. Catch yourself before the third tab open.`

(89 chars — fits Chrome's 132-char cap with room.)

---

## Field 10 — Keywords (Edge + AMO; Chrome auto-extracts)

```
behavioral interrupt, focus, procrastination, deep work, tab blocker,
site blocker alternative, productivity, JITAI, COYL, behavioral
change, addiction recovery, doomscroll, attention, ADHD, executive
function
```

(Keep under 10 per store cap; the above is a superset.)

---

## Submission sequence (do in this order)

1. Pay $5 one-time Chrome Web Store developer fee → developer dashboard
2. Add real designed icons (see `asset-checklist.md`) — replace placeholders
3. Generate 5 screenshots at 1280×800 (see `asset-checklist.md`)
4. Generate one promo tile at 440×280 + one marquee at 1400×560
5. Zip the extension: `cd apps/extension && zip -r coyl-extension-v0.1.zip . -x "*.zip" -x "README.md" -x "store/*"`
6. Upload to Chrome Web Store developer dashboard
7. Paste the listing copy above into the matching fields
8. Submit for review (typical first-review: 24–72 hours)
9. While Chrome reviews: submit identical package to Edge Add-ons (free, ~3 day review) and Firefox AMO (free, <24h auto-review)
10. Safari extension: deferred to v0.3 — requires Xcode wrapper + paid Apple Developer Program ($99/yr, already covered by iOS account)

---

## After approval

- Add the install link to `apps/web/src/components/landing/social-proof-band.tsx` ("Available in Chrome, Edge, Firefox")
- Add the install CTA to the `/audit` results page ("Install the browser interrupt — 30 seconds, free")
- Email the existing waitlist with the install link
- Cross-post to r/ADHD, r/getdisciplined, HN Show — same Lucide-icon screenshots, different framing per subreddit
- Track install → activation funnel: install → first interrupt fired → first "caught me" feedback. Target activation ≥ 35% within 7 days.

---

*Chrome Web Store listing copy v1.0 — May 2026. Reviewed against
Chrome Web Store Program Policies, the Manifest V3 single-purpose
rule, and Edge Add-ons category guidelines.*
