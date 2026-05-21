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

      <div className="space-y-12 pb-12">
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              Safety
            </span>
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-gray-900 md:text-7xl">
            What COYL is for,<br />
            <span className="text-orange-600">and what it is not.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            COYL is a behavioral support tool. It works at the layer of
            recurring autopilot loops — the 9 PM kitchen, the tab switch,
            the &ldquo;I&rsquo;ll restart Monday&rdquo; reset.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            It is not therapy. It is not addiction treatment. It is not a
            crisis service. It is not a substitute for clinical care.
          </p>
        </header>

        <SafetyBanner variant="prominent" />

        {/* TWO COLUMNS — what COYL IS / what COYL is NOT */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-orange-700">
              What COYL is for
            </p>
            <ul className="mt-4 space-y-3 text-base text-gray-900">
              <li>
                <strong>Recurring autopilot patterns.</strong> The same
                moments, the same scripts, the same outcomes — the loops
                you keep returning to even when you know better.
              </li>
              <li>
                <strong>The 3-second window before behavior.</strong>{' '}
                Interrupts at the actual moment — not the morning after.
              </li>
              <li>
                <strong>Same-night recovery from a slip.</strong> Re-entry
                without the spiral, the &ldquo;I already messed up&rdquo;
                sentence caught and named.
              </li>
              <li>
                <strong>Behavioral support around medication.</strong>{' '}
                GLP-1 users navigating the rebound windows; weight
                maintenance scripts that medication does not touch.
              </li>
              <li>
                <strong>Workplace focus + follow-through.</strong> The tab
                switch, the deep-work block, the doc you said you&rsquo;d
                send.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              What COYL is not
            </p>
            <ul className="mt-4 space-y-3 text-base text-gray-900">
              <li>
                <strong>Not a treatment for any medical condition.</strong>{' '}
                Not for substance use disorder, eating disorders,
                self-harm, or psychiatric crisis.
              </li>
              <li>
                <strong>Not a replacement for therapy.</strong> If you are
                working with a therapist or considering one, please
                continue. COYL is an everyday layer; it does not replace
                clinical care.
              </li>
              <li>
                <strong>Not a crisis hotline.</strong> If you are in
                immediate danger, in withdrawal, or feeling unsafe, this
                is not the right tool — use the routes below.
              </li>
              <li>
                <strong>Not a diagnostic tool.</strong> The audit names
                an autopilot family. It does not diagnose any mental
                health, eating, or substance use condition.
              </li>
              <li>
                <strong>Not a medication management system.</strong>{' '}
                Talk to your prescriber about anything dose-related.
              </li>
            </ul>
          </div>
        </section>

        {/* CRISIS ROUTING — explicit numbers + when to use each */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            If COYL is not the right tool right now
          </h2>
          <h3 className="text-3xl font-black leading-tight text-gray-900 md:text-4xl">
            Real help, real fast.
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                className="block rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300 hover:bg-orange-50"
              >
                <p className="text-base font-bold text-gray-900">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{r.line}</p>
              </a>
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-600">
            If you are in immediate physical danger or someone else is,
            please call <strong>911</strong> (US) or your local emergency
            number.
          </p>
        </section>

        {/* PRIVACY / DATA — relevant safety topic */}
        <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            Privacy + your data
          </h2>
          <h3 className="text-2xl font-bold text-gray-900 md:text-3xl">
            What COYL keeps. What COYL does not.
          </h3>
          <ul className="space-y-3 text-base text-gray-700">
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
              <Link href="/settings" className="text-orange-600 underline">
                /settings
              </Link>
              .
            </li>
            <li>
              Aggregated, anonymized data may inform research. Individual
              user data stays with the individual user. Read{' '}
              <Link href="/privacy" className="text-orange-600 underline">
                /privacy
              </Link>{' '}
              for the full policy.
            </li>
          </ul>
        </section>

        {/* CLOSING — soft CTA */}
        <section className="border-t border-gray-200 pt-12">
          <p className="max-w-2xl text-base leading-relaxed text-gray-700">
            If COYL is the right layer for the everyday autopilot loop
            you keep losing in, the audit takes 60 seconds and reveals
            which of six families you belong to:
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Take the audit →
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
