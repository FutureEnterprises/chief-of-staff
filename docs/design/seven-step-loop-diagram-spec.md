# The Seven-Step Loop — diagram spec (v1)

> Designer brief for the most important visual asset COYL ships. This
> is the single illustration that explains the entire product
> architecture — used on `/how-it-works` (replaces the current text
> ladder), `/science` (as the behavioral-model exhibit), `/psyche` (as
> the platform-architecture exhibit), and as a shareable social asset
> in 1080×1350 + 1200×630 + 2400×1260 sizes.
>
> Output: a single editorial illustration, dark warm-canvas, orange
> connectors, one Lucide-aligned icon per node, Instrument Serif for
> the seven node labels, Geist Mono for the four phase headers.
>
> Per the May 2026 audit brief: "This is the most complete behavioral
> model on any consumer app. It should look like one."

---

## The seven nodes (verbatim labels)

```
Commitment → Drift → Excuse → Interrupt → Action → Recovery → Learning
```

Each node carries one verbatim label and one Lucide icon. The labels
DO NOT change. Each node also has a one-sentence accessory caption
shown on hover (web) and below the node (print).

| # | Label | Lucide icon | Accessory caption |
|---|---|---|---|
| 01 | Commitment | `Anchor` | "What you said you'd do. Out loud. Logged." |
| 02 | Drift | `Wind` | "The quiet pull away from the commitment. Pre-conscious." |
| 03 | Excuse | `MessagesSquare` | "The story your psyche tells to license the slip." |
| 04 | Interrupt | `Zap` | "The three-second window. COYL fires here." |
| 05 | Action | `ArrowDownRight` (or `Footprints`) | "What actually happens — the win path or the slip path." |
| 06 | Recovery | `RotateCw` | "What COYL does in the 90 seconds after a slip." |
| 07 | Learning | `Brain` | "The model updates. Next time, the interrupt is sharper." |

Lucide icons must be drawn at the same stroke weight as the rest of
the COYL site (1.5px stroke). All seven icons sit inside a 56×56
warm-cream circle (color `#fafaf7`) with a 1.5px `#ff6600` stroke.

---

## Four phase brackets

The seven nodes group into four phases, shown above the loop as
small Geist Mono uppercase labels with a thin orange bracket
underline:

| Phase | Spans | Treatment |
|---|---|---|
| INTENTION | Commitment → Drift | Geist Mono 11px uppercase, tracking 0.2em |
| AUTOPILOT | Excuse → Action | Same |
| RECOVERY | Recovery | Same |
| MODEL | Learning | Same |

The four phases tell the reader why the loop has seven nodes — the
front half is intention, the middle is autopilot, the back is what
COYL adds on top.

---

## Layout — the master illustration

**Canvas:** 2400×1350 (16:9 master). All other crops derive from this.

**Background:** warm dark `#0e0d0b` (the COYL app shell color, not
black-black). Subtle film-grain texture at 4% opacity.

**Composition:** circular flow, NOT a horizontal line.

```
                  01  COMMITMENT
                 /
               /
   07 LEARNING                02 DRIFT
       |                            \
       |                             \
   06 RECOVERY                  03 EXCUSE
                \                  /
                 \                /
                  05 ACTION  ◀  04 INTERRUPT
```

The seven nodes sit on a slightly-imperfect oval (NOT a perfect
circle — perfect circles read mechanical; an editorial oval reads
intentional). The oval's major axis is horizontal. The "loop" reads
clockwise from 01 at top to 07 at left, returning to 01.

**Connectors:** orange (`#ff6600`) lines, 1.5px, with a single small
arrowhead halfway along each connector (not at the destination — at
the midpoint, which feels more like motion than termination). Each
connector is broken by a small Geist Mono micro-label naming the
transition:

```
01 → 02   "the slow pull"
02 → 03   "the story arrives"
03 → 04   "COYL fires"
04 → 05   "the choice"
05 → 06   "if slip"
06 → 07   "what changed"
07 → 01   "next time"
```

The 07→01 connector is what closes the loop. It should feel slightly
different from the others — slightly thicker, or with a tiny `+1`
glyph near it, to imply "the model is now sharper than the last
revolution."

---

## Typography

| Element | Font | Size at 2400px | Color |
|---|---|---|---|
| Phase header | Geist Mono uppercase | 14px tracked 0.25em | `#ff6600` |
| Phase bracket | hairline rule | 1px | `#ff6600` at 40% opacity |
| Node label | Instrument Serif | 28px | `#fafaf7` (cream) |
| Node accessory caption | Geist Sans | 14px | `#fafaf7` at 60% opacity |
| Transition micro-label | Geist Mono lowercase | 11px tracked 0.1em | `#ff6600` at 70% opacity |
| Diagram title | Instrument Serif italic | 56px | `#fafaf7` |
| Diagram subtitle | Geist Mono uppercase | 12px tracked 0.3em | `#ff6600` |

**Diagram title** (top-left of canvas, NOT centered — editorial
asymmetry):

> *The seven-step loop*

**Diagram subtitle** (above the title):

> COYL · behavioral interrupt protocol · v0.1

---

## Color discipline

Only three colors on the canvas. Anything else is a mistake.

- `#0e0d0b` — warm-dark background (the COYL app shell)
- `#fafaf7` — cream foreground (node circles, labels, illustration whites)
- `#ff6600` — signature orange (connectors, accents, phase brackets)

No greys. No teals. No purples. No blues. No mint. The constraint is
the brand.

---

## Export sizes + crop logic

| Use | Size | Crop |
|---|---|---|
| `/how-it-works` hero | 2400×1350 | Full master |
| `/science` exhibit | 2400×1350 | Full master with the title moved to top-center |
| `/psyche` platform exhibit | 2400×1350 | Full master with the 07→01 closing arrow emphasized (`+1` glyph visible) |
| Social — Instagram feed square | 1080×1080 | Crop centered on nodes 03–06 (the autopilot phase); show partial phase headers; the four key nodes get full labels |
| Social — Instagram story | 1080×1920 | Stack vertically: title at top, phase brackets staggered, oval scaled to fit width |
| Open Graph card | 1200×630 | Crop centered on the full oval; title bottom-left |
| Twitter card | 2400×1260 | Same as OG but wider; title top-left |
| Print poster (founder studio wall) | 18×24" at 300dpi | Master scaled |

Export both PNG (transparent BG variant for compositing) and a
flattened JPG for delivery.

---

## Variants

Build three variants of the master:

1. **Flat** — what's described above. Use on `/how-it-works`.
2. **Annotated** — adds a small data callout near node 04 ("COYL fires
   in the 3-second window. Average reaction: 1.4 seconds."). Use on
   `/science`.
3. **Platform** — adds a code-block call-out near node 07 showing the
   Behavioral Context Object JSON snippet. Use on `/psyche`. The
   code-block treatment matches the `/protocol` page's existing JSON
   sample blocks.

All three variants share the same master file. The variants are
non-destructive overlays — turning off the variant layer returns the
flat master.

---

## What this replaces

- The text ladder on `/how-it-works` listing 01–07 with body
  paragraphs. The diagram replaces the LIST; the body paragraphs
  stay as supporting text below the diagram.
- The "behavioral model" placeholder on `/science`.
- The "platform architecture" section on `/psyche` (currently
  pending).

---

## What this is NOT

- NOT a state machine diagram. No boxes with internal sub-states.
- NOT a swim-lane diagram. No actor columns.
- NOT a UML diagram. No tooling vocabulary.
- NOT an infographic. Infographics decorate; this teaches.

It is an editorial illustration of a single behavioral cycle, drawn
with the discipline of a New Yorker cover and the precision of a
technical figure.

---

## References (for the illustrator)

- The "Pocket Universe" diagrams from the original Apple Watch Series 0
  marketing — circular flow, asymmetric label placement, restraint.
- The journal-figure aesthetic of *Nature Human Behaviour* — clean
  vector linework, no decorative gradients, every glyph earns its
  pixel.
- The Whitney logo lockup — Instrument Serif handling, italic accent
  letter, comfortable letterspacing.
- Reject anything that looks like: SVG icon-pack flowcharts, Notion
  diagrams, Figma whiteboard sketches, deck-template arrows.

---

## Delivery checklist

- [ ] Master 2400×1350 PNG (flat variant)
- [ ] Master 2400×1350 PNG (annotated variant)
- [ ] Master 2400×1350 PNG (platform variant)
- [ ] 1080×1080 social square crop
- [ ] 1080×1920 social story crop
- [ ] 1200×630 OG card
- [ ] 2400×1260 Twitter card
- [ ] 18×24" 300dpi print master
- [ ] Source Figma file with named layers per node
- [ ] All connectors as editable vector paths
- [ ] Three variants as non-destructive layer groups

---

## Acceptance criteria

- A non-COYL reader can look at the diagram for 30 seconds and
  describe the seven steps in their own words.
- The 04 → 05 transition ("COYL fires") visually feels like the
  pivot point of the entire diagram — it's where the product
  intervenes.
- The 07 → 01 closing arc visually communicates "the next revolution
  is sharper than the last."
- No element on the canvas violates the three-color rule.
- The diagram reads at 1080×1080 social crop without the seven labels
  becoming illegible.

---

*Diagram spec v1 — May 2026. Owner: founder + commissioned
illustrator. Delivery target: 14 days from brief.*
