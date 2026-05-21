# COYL Design System — v2

> Synthesized from Refero references (May 2026):
> **Pipe** (black + molten orange, editorial), **Linear** (pitch-black command-center, operational), **Axelar** (institutional dark grid).
>
> The brand is functionally right today; this doc defines the discipline.

---

## Two surface systems, one brand

COYL has two kinds of pages. They share the palette and the wordmark; they don't share density.

| | Marketing surfaces | App surfaces |
|---|---|---|
| **Reference** | Pipe (pipe.com) | Linear (linear.app) |
| **Examples** | `/`, `/pricing`, `/clinical-study`, `/audit`, `/teams` | `/today`, `/rescue`, `/commitments`, `/patterns`, `/settings` |
| **Section gap** | 64–72px | 16–24px |
| **Card padding** | 16–24px | 8–16px |
| **Card radius** | `16px` (rounded-2xl) | `8px` (rounded-lg) for ops; `12px` (rounded-xl) for narrative blocks |
| **Density** | Comfortable, generous breathing room | Compact, info-dense |
| **Hero typography** | 56–80px display | 24–36px heading |
| **Imagery** | Atmospheric, low-key, no decoration | None — UI only |

The rule: a page should feel like a brochure or like a cockpit. Never both.

---

## Color tokens

```
Black canvas       #08090a   --coyl-bg            page background
Surface 1          #0f1011   --coyl-surface-1     elevated card, sidebar, inputs
Surface 2          #161718   --coyl-surface-2     prominent card, sticky bars
Border             #23252a   --coyl-border        all separators, input borders
Muted ash          #323334   --coyl-muted-border  subtle dividers
Text primary       #f7f8f8   --coyl-text          headlines, primary copy
Text secondary     #8a8f98   --coyl-text-muted    body secondary, eyebrows
Text tertiary      #62666d   --coyl-text-dim      metadata, captions
Accent             #ff6600   --coyl-orange        single-use, primary actions only
Accent gradient    #ff6600 → #ff3d00              CTAs, focal moments
Glow               rgba(255,102,0,0.35)           around primary CTAs only
```

**Rules:**

- Accent orange appears on **at most 1 button per section, 2 per page**. If a page has 3+ orange surfaces, demote two.
- Never use orange on borders, dividers, or backgrounds at >5% saturation. It's a focal-point color, not a decorative one.
- Green/red appear only as semantic signals (success, slip). No third brand color.

---

## Typography

Single typeface family: **Inter Variable** (substitute for Suisse/Geist). Single weight system: 400 body, 600 headlines, 900 display. Hierarchy through size + letter-spacing, not weight.

| Role | Size | Line height | Letter spacing | Weight |
|---|---|---|---|---|
| Eyebrow (mono, uppercase) | 10–11px | 1.4 | 0.28em | 600 |
| Caption | 11px | 1.4 | -0.1px | 500 |
| Body small | 12px | 1.4 | -0.1px | 400 |
| Body | 14px | 1.5 | -0.13px | 400 |
| Body lead | 16–18px | 1.5 | -0.15px | 400 |
| Heading sm | 20px | 1.3 | -0.2px | 700 |
| Heading | 24–28px | 1.25 | -0.4px | 800 |
| Heading lg | 36–48px | 1.1 | -0.6px | 800 |
| Display | 56–72px | 1.05 | -0.9px | 900 |

**Mono is the eyebrow's job, nothing else.** Use IBM Plex Mono / Berkeley Mono substitute. Mono in body copy reads as code, breaks brand voice.

---

## Border radius — the discipline

The current codebase has `rounded-3xl` (24px) scattered through marketing AND app surfaces. That's the single biggest visual inconsistency. Fix:

| Surface | Class | px |
|---|---|---|
| App-surface card (Linear-style) | `rounded-lg` | 8px |
| App-surface narrative block | `rounded-xl` | 12px |
| Marketing card | `rounded-2xl` | 16px |
| Marketing hero block / pricing card | `rounded-3xl` | 24px **only here** |
| Pills, badges, primary CTAs | `rounded-full` | 9999px |
| Inputs (app) | `rounded-md` | 6px |
| Inputs (marketing) | `rounded-2xl` | 16px |

**Migration rule:** if a card on `/today` or any `(app)/*` route uses `rounded-3xl`, change to `rounded-2xl` or `rounded-xl`. The 24px radius reads as "soft consumer app." We're operational software.

---

## Spacing scale (Tailwind tokens)

8px base unit. Use these and only these.

| Tailwind | px | Use |
|---|---|---|
| `space-1` / `gap-1` | 4px | Within icon-text pairs |
| `space-2` / `gap-2` | 8px | Element gap (Linear default) |
| `space-3` / `gap-3` | 12px | Compact card gap |
| `space-4` / `gap-4` | 16px | Card padding (compact) |
| `space-6` / `gap-6` | 24px | Card padding (comfortable) |
| `space-8` / `gap-8` | 32px | Section gap (compact) |
| `space-16` / `gap-16` | 64px | Marketing section gap |
| `space-24` / `gap-24` | 96px | Marketing hero gap (Pipe) |

---

## The hero CTA stack

Every marketing-page hero should follow the same order:

1. Eyebrow (mono, uppercase, accent color)
2. Display headline (56–80px)
3. Subhead (16–18px lead)
4. **Two CTAs maximum:** primary (orange gradient pill) + secondary (ghost border)
5. Pricing-anchor line (12px muted) — one line, no decoration
6. Optional: one micro-funnel chip (the `/audit` quiz invite). Small, low-saturation, single line.

**Anti-patterns to remove:**
- 3+ CTAs in the hero stack (dilutes the primary)
- Eyebrow + multiple sub-eyebrows ("BETA", "NEW", "MAY 2026") — pick one
- Animated decorative elements unrelated to the moment (gratuitous gradient meshes, particle effects)

---

## Buttons — the discipline

| Variant | Use | Spec |
|---|---|---|
| Primary | The one action on the page | `bg-gradient-to-r from-orange-500 to-red-500` + glow shadow + white text + pill or 8px radius |
| Secondary | Alt path | `border-white/10 bg-white/[0.02]` + ghost text + same radius as primary |
| Tertiary | Inline link | `text-orange-400 hover:text-orange-300` + no chrome |
| Destructive | Account delete, slip-mode-only | `border-red-500/40 bg-red-500/10 text-red-300` |

**No more than one primary per visible viewport.** If you're tempted to add a second, demote it to secondary.

---

## Shadows + elevation

Both Pipe and Linear: **no heavy drop shadows.** Depth from:
- Surface layering (canvas → surface-1 → surface-2)
- Thin 1px borders in `--coyl-border`
- Subtle orange glow on primary CTAs *only* (max 1 per viewport)

Remove existing `shadow-[0_8px_32px_rgba(0,0,0,0.4)]` and similar diffuse shadows. They read 2018-era SaaS.

---

## Imagery + decoration

- **No photography** unless it's a partner logo wall or a specific brand moment
- **No emoji** in marketing copy (app surfaces can use them sparingly, brand-voice contextual)
- **No gradient mesh backgrounds on every section** — use the orange-tinted radial gradient once, at the hero, then let the canvas breathe
- **Product screenshots** (the in-app moments we're selling) belong in marketing. Real UI > stock illustration.

---

## Migration priorities (in order of visibility)

1. **Homepage hero** — tighten CTA stack, demote the audit chip to a single line, kill any 3rd CTA
2. **`/today` cards** — `rounded-3xl` → `rounded-2xl` (or `rounded-xl` for compact)
3. **`/pricing` card grid** — already 24px which is OK for marketing, but tighten internal spacing
4. **`/rescue` modal + cards** — currently mixed, settle on `rounded-2xl` for the response card
5. **`/clinical-study`** — already good, light pass to verify
6. **Settings cards** — too soft (`rounded-3xl`). Move to `rounded-2xl`
7. **Footer** — already correct

Each PR moves ~5 files. Cumulative effect: the app stops feeling soft. It starts feeling fast.

---

## What the references taught us

| Insight | Source | Where to apply |
|---|---|---|
| Single accent color discipline | Pipe, Linear | Audit every page for orange overuse |
| 8px button radius (not pill everywhere) | Pipe | Inline buttons in app surfaces |
| Eyebrow + mono treatment | Linear, Vapi | Standardize across all sections |
| Inset border for elevation, not shadow | Linear | Replace all `shadow-2xl` with `border + bg-surface-1` |
| Section rhythm via single canvas + breath, not alternating bands | Krea, Pipe | Stop alternating section backgrounds |
| Imagery is contained, never full-bleed decorative | All refs | Remove any full-page gradient mesh |
| Mono for technical metadata, never body | Linear | Audit all `font-mono` usage |

---

## Anti-aesthetics for COYL (what we're NOT)

- ❌ Headspace (warm, friendly, rounded — wrong category)
- ❌ Calm (lavender gradients — anti-pattern)
- ❌ Duolingo (gamified, playful — too youth-app)
- ❌ Function Health (cream + serif — too clinical/luxury)
- ❌ Noom (the competitor we're defining ourselves against)

The closest aesthetic peers:
- ✅ Pipe (black + orange, financial infra)
- ✅ Linear (operational dark)
- ✅ Vercel/Neon (developer-tools sharpness, sans the green/neon)
- ✅ Krea (cinematic monochrome with restraint)
- ✅ Peloton (dark + single red accent + premium performance)
- ✅ Axelar (institutional, structural, single orange)

If a design choice would make us look more like Headspace and less like Pipe, it's wrong.

---

*Design system v2 — May 2026. Source refs preserved in this commit's research output.*
