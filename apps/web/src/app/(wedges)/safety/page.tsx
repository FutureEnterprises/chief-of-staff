/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on the "and what it is not" half.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): two-column "for / not for"
 *     spread set as gallery columns, not card boxes.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): crisis routing
 *     cards become hairline-bordered editorial entries.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { SafetyBanner } from '@/components/safety/safety-banner'

export const metadata: Metadata = {
  title: 'Safety — what COYL is for, and what it is not',
  description:
    'COYL is behavioral support for recurring autopilot loops — not crisis services, not addiction treatment, not clinical care. If you are in crisis or need clinical care, 988 / SAMHSA / your doctor are the right routes.',
  keywords: [
    'coyl safety',
    'coyl is not therapy',
    'behavioral support boundaries',
    'crisis routing',
    'addiction treatment alternative',
  ],
  alternates: { canonical: '/safety' },
  openGraph: {
    title: 'Safety — what COYL is for, and what it is not',
    description:
      'COYL is behavioral support for recurring autopilot loops — not crisis services or clinical care.',
    url: 'https://coyl.ai/safety',
    images: [
      {
        url: '/api/og?title=What+COYL+is+for%2C+and+what+it+is+not.&kicker=Safety',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Safety',
    description: 'What COYL is for, and what it is not. Plus how to find real help fast.',
    images: ['/api/og?title=What+COYL+is+for%2C+and+what+it+is+not.&kicker=Safety'],
  },
}

/**
 * /safety — the regulatory shield + the honest framing.
 *
 * Per the May 2026 strategist final-architecture spec: "Safety:
 * mandatory." A dedicated page that names exactly what COYL is for
 * (recurring autopilot loops at the behavioral pattern layer) and
 * exactly what it is not (clinical treatment, crisis service,
 * addiction recovery, eating-disorder care). Routes anyone in those
 * categories to real help — 988, SAMHSA, their doctor.
 *
 * This page is non-negotiable infrastructure:
 *   - protects COYL legally (clear non-clinical claim)
 *   - protects users (clear path to real help when COYL is not it)
 *   - protects the category (signals that behavioral interfaces are
 *     not a replacement for clinical care)
 *
 * Linked from: footer, nav (Research dropdown), every page that
 * could attract a crisis-coded reader (via SafetyBanner component).
 */
export default function SafetyPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Safety', url: 'https://coyl.ai/safety' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Safety
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            What COYL is for,<br />
            <span className="italic text-orange-600">and what it is not.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL is a behavioral support tool. It works at the layer of
            recurring autopilot loops — the 9 PM kitchen, the tab switch,
            the &ldquo;I&rsquo;ll restart Monday&rdquo; reset.
          </p>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            It is not therapy. It is not addiction treatment. It is not a
            crisis service. It is not a substitute for clinical care.
          </p>
        </header>

        <SafetyBanner variant="prominent" />

        {/* TWO COLUMNS — what COYL IS / what COYL is NOT */}
        <section className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="border-t border-orange-500 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What COYL is for
            </p>
            <ul className="mt-6 space-y-4 text-base leading-[1.6] text-gray-900">
              <li>
                <strong className="font-serif font-normal italic">Recurring autopilot patterns.</strong>{' '}The same
                moments, the same scripts, the same outcomes — the loops
                you keep returning to even when you know better.
              </li>
              <li>
                <strong className="font-serif font-normal italic">The 3-second window before behavior.</strong>{' '}
                Interrupts at the actual moment — not the morning after.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Same-night recovery from a slip.</strong>{' '}Re-entry
                without the spiral, the &ldquo;I already messed up&rdquo;
                sentence caught and named.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Behavioral support around medication.</strong>{' '}
                GLP-1 users navigating the rebound windows; weight
                maintenance scripts that medication does not touch.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Workplace focus + follow-through.</strong>{' '}The tab
                switch, the deep-work block, the doc you said you&rsquo;d
                send.
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              What COYL is not
            </p>
            <ul className="mt-6 space-y-4 text-base leading-[1.6] text-gray-900">
              <li>
                <strong className="font-serif font-normal italic">Not a treatment for any medical condition.</strong>{' '}
                Not for substance use disorder, eating disorders,
                self-harm, or psychiatric crisis.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Not a replacement for therapy.</strong>{' '}If you are
                working with a therapist or considering one, please
                continue. COYL is an everyday layer; it does not replace
                clinical care.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Not a crisis hotline.</strong>{' '}If you are in
                immediate danger, in withdrawal, or feeling unsafe, this
                is not the right tool — use the routes below.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Not a diagnostic tool.</strong>{' '}The audit names
                an autopilot family. It does not diagnose any mental
                health, eating, or substance use condition.
              </li>
              <li>
                <strong className="font-serif font-normal italic">Not a medication management system.</strong>{' '}
                Talk to your prescriber about anything dose-related.
              </li>
            </ul>
          </div>
        </section>

        {/* CRISIS ROUTING — explicit numbers + when to use each */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              If COYL is not the right tool right now
            </span>
          </div>
          <h3 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Real help, <span className="italic text-orange-600">real fast.</span>
          </h3>

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 pt-4 md:grid-cols-2">
            {[
              {
                title: '988 — Suicide & Crisis Lifeline',
                href: 'tel:988',
                line: 'Call or text 988. 24/7. Free. Confidential. For yourself or for someone you are worried about.',
              },
              {
                title: 'SAMHSA National Helpline',
                href: 'tel:1-800-662-4357',
                line: '1-800-662-HELP (4357). 24/7 free treatment referral + information for substance use and mental health.',
              },
              {
                title: 'Crisis Text Line',
                href: 'sms:741741',
                line: 'Text HOME to 741741. Free, 24/7 crisis support over text.',
              },
              {
                title: 'NEDA — eating-disorder support',
                href: 'tel:1-800-931-2237',
                line: '1-800-931-2237 (NEDA helpline). Mon–Thu 11a–9p ET, Fri 11a–5p ET. Or chat at nationaleatingdisorders.org.',
              },
            ].map((r) => (
              <a
                key={r.title}
                href={r.href}
                className="group block border-t border-gray-200 pt-5 transition-colors hover:border-orange-500"
              >
                <p className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-orange-600">{r.title}</p>
                <p className="mt-3 text-sm leading-[1.65] text-gray-600">{r.line}</p>
              </a>
            ))}
          </div>

          <p className="mt-6 text-sm text-gray-600">
            If you are in immediate physical danger or someone else is,
            please call <strong>911</strong> (US) or your local emergency
            number.
          </p>
        </section>

        {/* PRIVACY / DATA — relevant safety topic */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Privacy + your data
            </span>
          </div>
          <h3 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">
            What COYL keeps. <span className="italic text-orange-600">What COYL does not.</span>
          </h3>
          <ul className="space-y-4 pt-4 text-base leading-[1.65] text-gray-700">
            <li>
              We do not read your work content — email, calendar, code,
              documents.
            </li>
            <li>
              We learn the shape of your autopilot from things you tell
              us directly (the audit, slip logs, the rescue flow) and,
              optionally, signals from wearables you connect.
            </li>
            <li>
              You can export or delete your data at any time from{' '}
              <Link href="/settings" className="font-serif italic text-orange-600 underline-offset-4 hover:underline">
                /settings
              </Link>
              .
            </li>
            <li>
              Aggregated, anonymized data may inform research. Individual
              user data stays with the individual user. Read{' '}
              <Link href="/privacy" className="font-serif italic text-orange-600 underline-offset-4 hover:underline">
                /privacy
              </Link>{' '}
              for the full policy.
            </li>
          </ul>
        </section>

        {/* CLOSING — soft CTA */}
        <section className="border-t border-gray-200 pt-16">
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            If COYL is the right layer for the everyday autopilot loop
            you keep losing in, the audit takes 60 seconds and reveals
            which of six families you belong to:
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
            >
              Take the audit →
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Read the manifesto
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
