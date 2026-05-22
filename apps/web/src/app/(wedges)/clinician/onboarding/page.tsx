'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * /clinician/onboarding — 4-step provisioning flow for the clinic.
 *
 * The marketing page (/clinician) hands the visitor over here and we
 * give them four screens to commit:
 *
 *   1. Clinic name + NPI
 *   2. Patient population (GLP-1 / weight maintenance / behavioral health)
 *   3. SSO setup (Azure AD / Google / manual)
 *   4. BAA execution (placeholder PDF link, real DocuSign in v0.2)
 *
 * On submit, we POST { clinicName, npi, population, sso } to a
 * lightweight wrapper around the existing /api/v1/user PATCH route
 * which will:
 *   - set User.planType = PRO (so the provider-rbac.ts gate accepts
 *     them as a clinician)
 *   - set User.role = "clinician"
 *   - set User.useCase = the patient population key
 *   - set User.biggestGoal = the clinic name + NPI as a denormalized
 *     identifier the v0.2 ProviderOrg migration will lift into a real
 *     model
 *
 * The schema-frozen v0.1 trick: we re-use existing free-text User
 * fields (role / useCase / biggestGoal) instead of adding a
 * ProviderOrg table. v0.2 will migrate these into a dedicated model.
 *
 * Style: cream + Geist Sans (NOT serif — this is a form, not a
 * marketing page). Mono micro-labels for the step indicator.
 */

type PopulationKey = 'glp1' | 'maintenance' | 'behavioral'
type SsoKey = 'azure' | 'google' | 'manual'

type FormState = {
  clinicName: string
  npi: string
  population: PopulationKey | ''
  sso: SsoKey | ''
}

const STEP_TITLES = [
  'Your clinic',
  'Patient population',
  'Single sign-on',
  'BAA execution',
] as const

const POPULATIONS: Array<{ key: PopulationKey; label: string; body: string }> = [
  {
    key: 'glp1',
    label: 'GLP-1 prescribing',
    body: 'Ozempic, Wegovy, Mounjaro, Zepbound, compounded. The drug suppresses appetite — COYL catches the script.',
  },
  {
    key: 'maintenance',
    label: 'Weight maintenance',
    body: 'Post-prescription, bariatric follow-up, lifestyle medicine. The 18-month window where regain becomes the story.',
  },
  {
    key: 'behavioral',
    label: 'Behavioral health',
    body: 'Compulsive patterns more broadly — focus, work follow-through, recurring loops. Patients who slip on autopilot.',
  },
]

const SSO_OPTIONS: Array<{ key: SsoKey; label: string; body: string }> = [
  {
    key: 'azure',
    label: 'Microsoft Entra (Azure AD)',
    body: 'For clinics on Microsoft 365. SCIM provisioning included.',
  },
  {
    key: 'google',
    label: 'Google Workspace',
    body: 'For clinics on Google Workspace. Auto-provisions from your directory.',
  },
  {
    key: 'manual',
    label: 'Skip for now',
    body: 'Manual invite codes. Add SSO later from clinic settings.',
  },
]

export default function ClinicianOnboardingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    clinicName: '',
    npi: '',
    population: '',
    sso: '',
  })

  // Auth gate — clinic onboarding requires a Clerk session. If the
  // visitor isn't signed in, kick them to sign-up first with a redirect
  // back to this page. Showing the form before sign-in would let them
  // fill it in and lose the entries on the auth round-trip.
  if (isLoaded && !isSignedIn) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
          One step first
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
          Sign in to provision your clinic.
        </h1>
        <p className="mt-3 max-w-prose text-base text-gray-600">
          The clinic record is bound to your COYL account so you can revisit
          settings, add patients, and pull cohort reports from the same login.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/sign-up?ref=clinician&redirect_url=/clinician/onboarding"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Create your account
          </Link>
          <Link
            href="/sign-in?redirect_url=/clinician/onboarding"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
          >
            I already have one
          </Link>
        </div>
      </div>
    )
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      // Single POST that flips the user's planType + writes the clinic
      // metadata. The route is /api/v1/user (PATCH) — but to avoid
      // touching that route in this milestone we use the dedicated
      // provider invite route to bootstrap the clinic in passing.
      // (v0.2 will move this to its own /api/v1/clinic route.)
      const res = await fetch('/api/v1/provider/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bootstrapClinic: true,
          clinicName: form.clinicName,
          npi: form.npi,
          population: form.population,
          sso: form.sso,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      router.push('/provider')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to provision clinic')
      setSubmitting(false)
    }
  }

  const canAdvance =
    (step === 0 && form.clinicName.trim().length >= 2 && form.npi.trim().length >= 10) ||
    (step === 1 && form.population !== '') ||
    (step === 2 && form.sso !== '') ||
    step === 3

  return (
    <div>
      {/* Step indicator — mono micro-labels, hairline under the active
          step. Reads as editorial chrome, not a SaaS progress bar. */}
      <div className="mb-10 flex flex-wrap items-center gap-4">
        {STEP_TITLES.map((title, i) => (
          <div key={title} className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                i === step
                  ? 'text-orange-600'
                  : i < step
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              {String(i + 1).padStart(2, '0')} {title}
            </span>
            {i < STEP_TITLES.length - 1 ? (
              <span className="text-gray-300" aria-hidden>
                ·
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
        {step === 0 ? (
          <ClinicStep
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />
        ) : null}
        {step === 1 ? (
          <PopulationStep
            value={form.population}
            onChange={(population) =>
              setForm((f) => ({ ...f, population }))
            }
          />
        ) : null}
        {step === 2 ? (
          <SsoStep
            value={form.sso}
            onChange={(sso) => setForm((f) => ({ ...f, sso }))}
          />
        ) : null}
        {step === 3 ? <BaaStep /> : null}

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
          <button
            type="button"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 hover:text-gray-900 disabled:opacity-40"
          >
            &larr; Back
          </button>

          {step < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              disabled={!canAdvance || submitting}
              onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] disabled:opacity-50"
            >
              Continue &rarr;
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] disabled:opacity-50"
            >
              {submitting ? 'Provisioning…' : 'Provision the clinic'}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        First 5 patients are free. After that, $9/patient/mo. No card
        required to onboard.
      </p>
    </div>
  )
}

function ClinicStep({
  value,
  onChange,
}: {
  value: { clinicName: string; npi: string }
  onChange: (patch: Partial<{ clinicName: string; npi: string }>) => void
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
        Step 01
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
        What’s the clinic called?
      </h2>
      <p className="mt-3 max-w-prose text-base text-gray-600">
        We use this for the dashboard header, patient-facing invite copy,
        and BAA paperwork.
      </p>

      <label className="mt-8 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
          Clinic name
        </span>
        <input
          type="text"
          autoFocus
          value={value.clinicName}
          onChange={(e) => onChange({ clinicName: e.target.value })}
          placeholder="Lakeside Endocrinology"
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </label>

      <label className="mt-6 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
          NPI (National Provider Identifier)
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value.npi}
          onChange={(e) => onChange({ npi: e.target.value })}
          placeholder="1234567890"
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <span className="mt-2 block text-xs text-gray-500">
          10 digits. We don’t verify in v0.1 — you take responsibility for
          accuracy. v0.2 ships NPPES lookup.
        </span>
      </label>
    </div>
  )
}

function PopulationStep({
  value,
  onChange,
}: {
  value: '' | PopulationKey
  onChange: (key: PopulationKey) => void
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
        Step 02
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
        What patients are we catching?
      </h2>
      <p className="mt-3 max-w-prose text-base text-gray-600">
        This sets the default intervention library and the cohort metric
        defaults. You can mix patients later.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3">
        {POPULATIONS.map((p) => {
          const active = value === p.key
          return (
            <button
              type="button"
              key={p.key}
              onClick={() => onChange(p.key)}
              className={`rounded-2xl border p-5 text-left transition-colors ${
                active
                  ? 'border-orange-500 bg-orange-50 shadow-[0_0_14px_-4px_rgba(255,102,0,0.4)]'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'
              }`}
            >
              <p
                className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                  active ? 'text-orange-700' : 'text-gray-500'
                }`}
              >
                {active ? 'Selected' : 'Choose'}
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {p.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {p.body}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SsoStep({
  value,
  onChange,
}: {
  value: '' | SsoKey
  onChange: (key: SsoKey) => void
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
        Step 03
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
        How does your team log in?
      </h2>
      <p className="mt-3 max-w-prose text-base text-gray-600">
        Pick one. Skipping is fine — you can wire SSO from clinic settings
        once you’re in.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3">
        {SSO_OPTIONS.map((s) => {
          const active = value === s.key
          return (
            <button
              type="button"
              key={s.key}
              onClick={() => onChange(s.key)}
              className={`rounded-2xl border p-5 text-left transition-colors ${
                active
                  ? 'border-orange-500 bg-orange-50 shadow-[0_0_14px_-4px_rgba(255,102,0,0.4)]'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'
              }`}
            >
              <p
                className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                  active ? 'text-orange-700' : 'text-gray-500'
                }`}
              >
                {active ? 'Selected' : 'Choose'}
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {s.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {s.body}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BaaStep() {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
        Step 04
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
        Sign the BAA.
      </h2>
      <p className="mt-3 max-w-prose text-base text-gray-600">
        Business Associate Agreement covering data handling, breach
        notification, and de-identification. Standard HIPAA terms — we
        don’t custom-paper it.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
          Document
        </p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          COYL Business Associate Agreement &mdash; v0.1
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Download, sign, return to{' '}
          <a
            href="mailto:baa@coyl.ai"
            className="font-medium text-orange-600 underline-offset-2 hover:underline"
          >
            baa@coyl.ai
          </a>
          . Provisioning happens immediately on submit; the BAA covers
          retroactively once countersigned. v0.2 ships DocuSign embedded
          signing.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/docs/coyl-baa-v0.1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:border-orange-500 hover:text-orange-700"
          >
            Download BAA (PDF)
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Clicking <strong>Provision the clinic</strong> below indicates you
        accept COYL’s standard BAA terms and will return a signed copy
        within 30 days.
      </p>
    </div>
  )
}
