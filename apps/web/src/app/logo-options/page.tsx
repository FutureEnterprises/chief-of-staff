import type { Metadata } from 'next'
import { CoylLogo, CoylMark } from '@/components/brand/logo'

/**
 * /logo-options — internal logo concept review page.
 *
 * Renders the three logo redesign concepts (Aperture, Held Pause,
 * Engraved) at multiple sizes and against both light + dark surfaces,
 * with the current production mark inline for direct comparison.
 *
 * Public route (so the founder can review on mobile / share a link to
 * advisors) but `robots: noindex` — not part of the marketing surface.
 *
 * Once a concept is chosen, this page is deleted and the chosen mark
 * replaces `apps/web/src/components/brand/logo.tsx` + the public SVG
 * assets. Until then, the page is the single visual decision surface.
 */

export const metadata: Metadata = {
  title: 'Logo options — internal review',
  description: 'Three logo concepts for COYL — internal review only.',
  robots: { index: false, follow: false },
}

const OPTIONS = [
  {
    key: 'a',
    title: 'Option A — APERTURE',
    subtitle: 'The decisive moment, rendered as negative space.',
    concept:
      'Solid filled disk in COYL orange with a single precise wedge cut from 12 o\'clock. The wedge is the interrupt — the moment before behavior happens, made visible as a deliberate breath in the form. Solid fill, no gradient. The most distinctive silhouette in the category — none of Headspace, Calm, Lyra, Noom, Whoop, or Big Health use anything like it.',
    src: '/logo-options/option-a-aperture.svg',
    bestFor:
      'Memorability. The single strongest thumbnail in the set — survives social-feed scroll, app-store grid, and partner co-brand surfaces.',
    risk:
      'A wider wedge would read as Pac-Man. The current 8° wedge is small enough to keep the disk reading as a complete form with a precise detail. Stay disciplined on the wedge angle.',
  },
  {
    key: 'b',
    title: 'Option B — HELD PAUSE',
    subtitle: 'Hairline restraint. The magazine-cover aesthetic.',
    concept:
      'Hairline orange arc forming a 270° C, opening to the right, with a small precise dot at the geometric center. The arc is the bracket; the dot is the moment being held. Reads as a fashion-house logo (Hermès, Aesop, Letter magazine) rather than a tech mark.',
    src: '/logo-options/option-b-held-pause.svg',
    bestFor:
      'Editorial sophistication. Matches the Instrument Serif italic + cream + hairline-rule sweep already on the site. Highest perceived quality for an audience that knows luxury design.',
    risk:
      'Hairlines can disappear at sub-14px favicon. Ship a "favicon-only" variant where the arc thickens to 2px and the dot stays — keeps the concept legible in the browser tab while marketing surfaces use the hairline original.',
  },
  {
    key: 'c',
    title: 'Option C — ENGRAVED',
    subtitle: 'No mark. The wordmark IS the logo.',
    concept:
      'No separate symbol. COYL set in Instrument Serif italic, tight tracking, with the Y descender extended into a deliberate stamped flourish, sitting on a hairline orange rule. The luxury houses (Hermès, Bulgari, Aesop, A24) don\'t have marks — they have wordmarks. A wordmark says: "we are confident enough in our name that we don\'t need a glyph."',
    src: '/logo-options/option-c-engraved.svg',
    bestFor:
      'Editorial gravity. Eliminates the favicon-vs-wordmark drift entirely. There is one logo. The favicon becomes a single italic Y in orange — instantly distinctive in a browser tab full of square colored marks.',
    risk:
      'No standalone glyph for app icons, social avatars, partner co-branding. Mitigation: ship a square variant where a single large italic Y serves as the standalone glyph — pairs cleanly with the wordmark in any context.',
  },
]

const SIZE_RAMP = [
  { px: 16, label: 'favicon' },
  { px: 30, label: 'nav' },
  { px: 64, label: 'hero' },
  { px: 144, label: 'billboard' },
]

export default function LogoOptionsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900">
      {/* HEADER */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Internal review · choose one
            </span>
          </div>
          <h1 className="mt-8 font-serif text-5xl font-normal italic leading-[1.0] tracking-[-0.025em] text-gray-900 md:text-6xl">
            Three logos.{' '}
            <span className="not-italic">One brand.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
            Each option is a distinct conceptual take, not a variation of the current
            mark. Compare them at every size from browser-tab favicon to billboard,
            against both light and warm-dark surfaces. The current production mark
            sits at the top for reference.
          </p>
        </div>
      </header>

      {/* CURRENT LOGO — for direct comparison */}
      <section className="border-b border-gray-200 bg-white/50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Current mark (for reference)
          </p>
          <h2 className="mt-3 font-serif text-2xl font-normal text-gray-900">
            Bold gradient C — 270° arc, orange→red
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-[1.65] text-gray-600">
            Serviceable but reads close to Capital One, Citrix, Cox. Gradient feels
            2018-vintage; bold solid letterforms are crowded territory. The
            three options below take distinct routes away from this.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-12">
            {SIZE_RAMP.map((s) => (
              <div key={s.px} className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center"
                  style={{ width: s.px, height: s.px }}
                >
                  <CoylMark size={s.px} />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  {s.label} · {s.px}px
                </span>
              </div>
            ))}
            <div className="ml-4 border-l border-gray-200 pl-12">
              <CoylLogo size="lg" />
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                wordmark
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OPTIONS */}
      {OPTIONS.map((opt) => (
        <section key={opt.key} className="border-b border-gray-200">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="space-y-4">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {opt.title}
              </p>
              <h2 className="font-serif text-4xl font-normal italic leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
                {opt.subtitle}
              </h2>
              <p className="max-w-3xl text-base leading-[1.7] text-gray-700">
                {opt.concept}
              </p>
            </div>

            {/* Size ramp on light surface */}
            <div className="mt-12 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                On cream (light surface)
              </p>
              <div className="flex flex-wrap items-end gap-12 rounded-lg border border-gray-200 bg-[#fafaf7] p-10">
                {opt.key === 'c' ? (
                  // Option C is wordmark-only; show at typographic ramp instead of size ramp
                  <>
                    <div className="flex flex-col items-start gap-2">
                      <img
                        src={opt.src}
                        alt=""
                        style={{ width: 120, height: 'auto' }}
                      />
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        small · 120px
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <img
                        src={opt.src}
                        alt=""
                        style={{ width: 200, height: 'auto' }}
                      />
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        nav · 200px
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <img
                        src={opt.src}
                        alt=""
                        style={{ width: 360, height: 'auto' }}
                      />
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        hero · 360px
                      </span>
                    </div>
                  </>
                ) : (
                  SIZE_RAMP.map((s) => (
                    <div key={s.px} className="flex flex-col items-center gap-2">
                      <div
                        className="flex items-center justify-center"
                        style={{ width: s.px, height: s.px }}
                      >
                        <img
                          src={opt.src}
                          alt=""
                          width={s.px}
                          height={s.px}
                          style={{ width: s.px, height: s.px }}
                        />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        {s.label} · {s.px}px
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Same on warm-dark surface */}
            <div className="mt-8 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                On warm-dark (app surface)
              </p>
              <div className="flex flex-wrap items-end gap-12 rounded-lg border border-white/10 bg-[#0e0c0a] p-10">
                {opt.key === 'c' ? (
                  <>
                    {/* Engraved option on dark needs the letters in cream */}
                    <p className="font-serif text-[80px] italic leading-none tracking-[-1.5px] text-[#f5f3ee]">
                      COYL
                    </p>
                    <span className="self-end font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      (dark surface: letters render in cream #f5f3ee, hairline rule
                      stays orange)
                    </span>
                  </>
                ) : (
                  SIZE_RAMP.map((s) => (
                    <div key={s.px} className="flex flex-col items-center gap-2">
                      <div
                        className="flex items-center justify-center"
                        style={{ width: s.px, height: s.px }}
                      >
                        <img
                          src={opt.src}
                          alt=""
                          width={s.px}
                          height={s.px}
                          style={{ width: s.px, height: s.px }}
                        />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                        {s.label} · {s.px}px
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Best for / Risk */}
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="border-t border-orange-500 pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-600">
                  Best for
                </p>
                <p className="mt-2 text-sm leading-[1.65] text-gray-800">
                  {opt.bestFor}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Risk · mitigation
                </p>
                <p className="mt-2 text-sm leading-[1.65] text-gray-700">{opt.risk}</p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CHOOSING */}
      <section className="bg-white/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            How to choose
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal italic leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-4xl">
            Different priorities point to different options.
          </h2>
          <ul className="mt-8 space-y-6 text-base leading-[1.7] text-gray-700">
            <li className="border-t border-gray-200 pt-5">
              <strong className="font-serif font-normal italic text-gray-900">
                If memorability is the highest priority
              </strong>{' '}
              — pick <strong>Option A (Aperture)</strong>. The solid disk-with-wedge
              is the single most distinct silhouette in the behavioral-health and
              proactive-AI categories. It will not be confused with another brand.
            </li>
            <li className="border-t border-gray-200 pt-5">
              <strong className="font-serif font-normal italic text-gray-900">
                If editorial sophistication is the highest priority
              </strong>{' '}
              — pick <strong>Option B (Held Pause)</strong>. The hairline arc and
              interior dot match the magazine-cover restraint already running
              through the site. Highest perceived quality among readers who notice
              type and detail.
            </li>
            <li className="border-t border-gray-200 pt-5">
              <strong className="font-serif font-normal italic text-gray-900">
                If brand-gravity (vs corporate-tech) is the highest priority
              </strong>{' '}
              — pick <strong>Option C (Engraved)</strong>. The wordmark-only route
              is what Hermès, Bulgari, Aesop, A24, and Letter magazine use. It
              says: we are confident enough in our name that we don&apos;t need a
              glyph. The italic Y becomes the standalone favicon.
            </li>
          </ul>
          <p className="mt-12 max-w-3xl text-base leading-[1.7] text-gray-700">
            Tell me which one (or which two — they can be combined: Option B&apos;s
            mark + Option C&apos;s wordmark is a real composition that gets the
            best of both). I&apos;ll then replace the production logo component,
            the public SVG asset, the favicon, the OG-image templates, and the
            partner co-brand surfaces in one commit.
          </p>
        </div>
      </section>
    </div>
  )
}
