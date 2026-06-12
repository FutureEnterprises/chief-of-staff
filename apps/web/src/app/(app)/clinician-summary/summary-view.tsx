import type { ClinicianSummary, Metric } from './summary-data'
import { PrintButton } from './print-button'

/**
 * SummaryView — the print-optimized clinician one-pager.
 *
 * TWO RENDER MODES, ONE MARKUP:
 *  • On SCREEN: warm-dark, matching the app shell (the (app) layout adds
 *    `dark` + charcoal canvas). The summary "paper" sits on the dark
 *    canvas as a slightly raised card.
 *  • On PRINT: the scoped @media print block below forces a clean clinical
 *    sheet — white background, black text, app chrome (sidebar, the action
 *    bar, anything marked [data-print-hidden]) removed, and the layout
 *    collapsed to a single page. Browser print-to-PDF is the export.
 *
 * NEDA-safe: every label here is behavioral / pattern / engagement only.
 * No weight, calories, BMI, body, or diet terms — including the GLP-1
 * block, which is framed as a post-medication maintenance window and a
 * pattern-stability signal.
 */
export function SummaryView({ summary }: { summary: ClinicianSummary }) {
  return (
    <div className="clinician-summary-root min-h-full bg-[#0e0d0b] px-4 py-8 sm:px-8">
      {/* Print rules. Scoped to this route via the .clinician-summary-root
          ancestor so they never leak into the rest of the app. */}
      <style>{PRINT_CSS}</style>

      {/* Action bar — screen only. */}
      <div
        data-print-hidden
        className="mx-auto mb-6 flex max-w-[760px] items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a847a]">
            Rebound
          </p>
          <h1 className="text-lg font-bold text-[#f5f3ee]">Clinician summary</h1>
        </div>
        <PrintButton />
      </div>

      {/* The paper. */}
      <article className="clinician-paper mx-auto max-w-[760px] rounded-2xl border border-white/[0.08] bg-[#16140f] p-8 text-[#f5f3ee] shadow-xl sm:p-10">
        {/* 1. HEADER */}
        <header className="border-b border-white/[0.1] pb-6">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xl font-black tracking-tight text-[#f5f3ee]">
              COYL
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#8a847a]">
              {summary.reportDateLabel}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#f5f3ee]">
            Behavioral Pattern Summary
          </h2>
          <p className="mt-1 text-sm text-[#a8a195]">
            {summary.firstName} · Tracking since {summary.trackingSinceLabel}
          </p>
          <p className="mt-3 text-sm font-medium text-orange-500 clinician-accent">
            Prepared for discussion with your clinician
          </p>
        </header>

        {/* 2. ARCHETYPE + SIGNATURE SCRIPT */}
        <Section title="Autopilot archetype">
          <p className="text-lg font-bold text-[#f5f3ee]">{summary.familyName}</p>
          <p className="mt-1 text-sm text-[#a8a195]">{summary.familyEssence}</p>
          <p className="mt-3 text-sm text-[#cfc8bb]">
            <span className="text-[#8a847a]">Signature script: </span>
            <span className="font-medium italic">{summary.signatureScript}</span>
          </p>
          {summary.patternSignature && (
            <p className="mt-2 text-sm text-[#cfc8bb]">
              <span className="text-[#8a847a]">Most recent weekly pattern: </span>
              {summary.patternSignature}
            </p>
          )}
        </Section>

        {/* 3. DANGER WINDOWS */}
        <Section title="Pattern windows">
          {summary.dangerWindows.length === 0 ? (
            <p className="text-sm text-[#8a847a]">
              No pattern windows mapped yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.dangerWindows.map((w, i) => (
                <li
                  key={`${w.label}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-white/[0.06] pb-2 last:border-0 last:pb-0 clinician-row"
                >
                  <span className="text-sm font-medium text-[#f5f3ee]">{w.label}</span>
                  <span className="text-sm text-[#a8a195]">
                    {w.dayLabel} · {w.timeLabel}
                    {w.triggerType ? ` · ${w.triggerType}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 4. LAST-28-DAYS NUMBERS */}
        <Section title={`Last ${summary.windowDays} days`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 clinician-metrics">
            <MetricCell
              label="Interrupts fired"
              metric={summary.interruptsFired}
              suffix=""
              trackingSince={summary.trackingSinceLabel}
            />
            <MetricCell
              label="Check-in response rate"
              metric={summary.checkinResponseRate}
              suffix="%"
              trackingSince={summary.trackingSinceLabel}
            />
            <MetricCell
              label="Recovery rate"
              metric={summary.recoveryRate}
              suffix="%"
              trackingSince={summary.trackingSinceLabel}
            />
          </div>
        </Section>

        {/* 5. GLP-1 CONTEXT — conditional. */}
        {summary.glp1 && (
          <Section title="Post-medication maintenance window">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 clinician-box">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {summary.glp1.drug && (
                  <Field label="Medication on file" value={summary.glp1.drug} />
                )}
                {summary.glp1.injectionDayLabel && (
                  <Field label="Dose day" value={summary.glp1.injectionDayLabel} />
                )}
                {summary.glp1.startedAtLabel && (
                  <Field label="Maintenance tracking since" value={summary.glp1.startedAtLabel} />
                )}
                {summary.glp1.offMedication && summary.glp1.endedAtLabel && (
                  <Field
                    label="Post-taper window since"
                    value={summary.glp1.endedAtLabel}
                  />
                )}
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-[#8a847a]">
                {summary.glp1.offMedication
                  ? 'Self-reported as off medication. COYL is running the post-taper pattern-stability protocol — surfacing engagement around the windows where established routines are most likely to drift.'
                  : 'Self-reported as on medication. COYL surfaces pattern-stability support around the maintenance window — the recurring moments where established routines are most likely to drift.'}
              </p>
            </div>
          </Section>
        )}

        {/* 6. FOOTER — verbatim, required. */}
        <footer className="mt-8 border-t border-white/[0.1] pt-5">
          <p className="text-[11px] leading-relaxed text-[#8a847a] clinician-footer">
            COYL provides behavioral support, not medical treatment. This summary
            describes self-reported behavioral patterns and app engagement. It is
            not a diagnosis, lab result, or treatment record.
          </p>
        </footer>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 clinician-section">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a847a] clinician-section-title">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[#8a847a]">{label}</dt>
      <dd className="text-sm font-medium text-[#f5f3ee]">{value}</dd>
    </div>
  )
}

function MetricCell({
  label,
  metric,
  suffix,
  trackingSince,
}: {
  label: string
  metric: Metric
  suffix: string
  trackingSince: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 clinician-box">
      <p className="text-[11px] uppercase tracking-wide text-[#8a847a]">{label}</p>
      {metric.kind === 'no-data' ? (
        <p className="mt-1 text-[13px] leading-snug text-[#a8a195]">
          Not enough data yet (started {trackingSince})
        </p>
      ) : (
        <>
          <p className="mt-1 text-3xl font-black tabular-nums text-[#f5f3ee]">
            {metric.value}
            {suffix}
          </p>
          {metric.kind === 'value' && (
            <p className="mt-0.5 text-[11px] text-[#8a847a]">
              {metric.numerator} of {metric.denominator}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Print stylesheet. Selectors are scoped under .clinician-summary-root so
 * nothing here affects other routes, and we reach UP to the app shell to
 * strip the sidebar (the (app) layout's <aside>) and reset the canvas.
 *
 * Single-page intent: generous but bounded spacing, color-adjust exact so
 * the (few) brand-orange accents print true, and page margins set on @page.
 */
const PRINT_CSS = `
@media print {
  @page { margin: 0.6in; }
  html, body { background: #ffffff !important; }

  /* Strip app chrome: the (app) sidebar and anything opted out of print. */
  body aside { display: none !important; }
  [data-print-hidden] { display: none !important; }

  /* Reset the dark canvas to a clean white sheet. */
  .clinician-summary-root,
  .clinician-summary-root .clinician-paper {
    background: #ffffff !important;
    color: #111111 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }

  /* Black text everywhere; soften only the muted/footer/secondary lines. */
  .clinician-summary-root,
  .clinician-summary-root h1,
  .clinician-summary-root h2,
  .clinician-summary-root h3,
  .clinician-summary-root p,
  .clinician-summary-root span,
  .clinician-summary-root dt,
  .clinician-summary-root dd,
  .clinician-summary-root li {
    color: #111111 !important;
  }
  .clinician-summary-root .clinician-section-title,
  .clinician-summary-root .clinician-footer { color: #555555 !important; }
  .clinician-summary-root .clinician-accent {
    color: #c2410c !important; /* keep the one orange accent legible on white */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Card surfaces → light hairline boxes that read on paper. */
  .clinician-summary-root .clinician-box,
  .clinician-summary-root .clinician-row,
  .clinician-summary-root header,
  .clinician-summary-root footer,
  .clinician-summary-root .clinician-section {
    background: #ffffff !important;
    border-color: #d4d4d4 !important;
  }

  /* Keep each section intact across the (single) page break. */
  .clinician-summary-root .clinician-section,
  .clinician-summary-root .clinician-metrics,
  .clinician-summary-root .clinician-box {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`
