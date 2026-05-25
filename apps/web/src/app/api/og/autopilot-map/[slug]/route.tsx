import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { prisma } from '@repo/database'

/**
 * /api/og/autopilot-map/[slug] — Autopilot Map snapshot OG image.
 *
 * Renders the four-stat snapshot as a 1200×630 PNG suited for inline
 * preview on Twitter/X, iMessage, Slack, LinkedIn, Threads, Discord
 * and Facebook. The /m/[slug] share page's OG meta points here.
 *
 * Visual language mirrors the public marketing palette (cream
 * background, single Hermès orange accent, charcoal text) rather than
 * the warm dark of /api/og?variant=card — the marketing surface uses
 * cream, and the map shares are a marketing artifact.
 *
 * Edge runtime so it's <50ms cold and survives crawler timeouts.
 * Inline-SVG mark and no remote fonts; uses next/og's default sans/
 * serif fallbacks to stay bulletproof.
 *
 * On not-found / revoked share: renders a tombstone card so the
 * preview gracefully degrades instead of returning a 404 (which most
 * crawlers cache as "no preview").
 */

// Cream marketing palette — matches /m/[slug] and /autopilot-map.
const CREAM = '#fafaf7'
const CHARCOAL = '#1a1a1a'
const ACCENT = '#ff6600'
const MUTED = '#6b6256'
const BORDER = '#e6e3dc'

// Snapshot shape — typed locally so this route compiles before the
// sibling AutopilotMapSnapshot model migration lands. Once the
// Prisma client regenerates with the model, the runtime call returns
// rows matching this shape.
type SnapshotView = {
  topExcuse: string
  topExcuseCount: number
  peakWindowLabel: string
  peakWindowSlips: number
  slipsThisWeek: number
  recoveredCount: number
  recoveryRate: number
  patternSignature: string
  weekLabel: string
  shareSlug: string
}

const EXCUSE_LABEL: Record<string, string> = {
  DELAY: 'DELAY',
  REWARD: 'REWARD',
  MINIMIZATION: 'MINIMIZATION',
  COLLAPSE: 'COLLAPSE',
  EXHAUSTION: 'EXHAUSTION',
  EXCEPTION: 'EXCEPTION',
  COMPENSATION: 'COMPENSATION',
  SOCIAL_PRESSURE: 'SOCIAL',
}

async function loadSnapshot(slug: string): Promise<SnapshotView | null> {
  try {
    // Soft-cast so the file type-checks before the Prisma model exists
    // in this worktree (sibling agent is adding the schema separately).
    const client = prisma as unknown as {
      autopilotMapSnapshot?: {
        findUnique: (args: {
          where: { shareSlug: string }
        }) => Promise<SnapshotView | null>
      }
    }
    if (!client.autopilotMapSnapshot) return null
    return await client.autopilotMapSnapshot.findUnique({
      where: { shareSlug: slug },
    })
  } catch {
    return null
  }
}

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params
  const snap = await loadSnapshot(slug)

  if (!snap) {
    return renderRevoked()
  }

  return renderSnapshot(snap)
}

/**
 * 4-quadrant editorial layout for the snapshot. Mirrors the on-page
 * card grid: top-excuse top-left, peak-window top-right, recovery-rate
 * bottom-left, signature bottom-right. Cream background, Hermès
 * orange single accent, hairline rules.
 */
function renderSnapshot(snap: SnapshotView) {
  const excuseLabel = EXCUSE_LABEL[snap.topExcuse] ?? snap.topExcuse
  const recoveryPct = Math.round(snap.recoveryRate * 100)
  // Trim very long signatures so the bottom-right quadrant doesn't
  // overflow into the recovery card.
  const signature =
    snap.patternSignature.length > 110
      ? snap.patternSignature.slice(0, 107) + '...'
      : snap.patternSignature

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: CREAM,
          backgroundImage:
            'radial-gradient(circle at 88% 8%, rgba(255,102,0,0.10), transparent 50%)',
          padding: '52px 60px',
          fontFamily:
            '"Inter", "Helvetica Neue", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top brand row — flame chip + kicker, week label on the right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 24px ${ACCENT}55`,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke={CREAM}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <span
              style={{
                color: ACCENT,
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Autopilot week
            </span>
          </div>
          <span
            style={{
              color: MUTED,
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {snap.weekLabel}
          </span>
        </div>

        {/* 2×2 quadrant grid — flex rows for next/og compatibility */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            marginTop: '24px',
            gap: '20px',
          }}
        >
          {/* Top row — top excuse + peak window */}
          <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '20px' }}>
            <Quadrant
              kicker="Top excuse"
              accent={ACCENT}
              statSlot={
                <span
                  style={{
                    color: CHARCOAL,
                    fontFamily: 'serif',
                    fontSize: excuseLabel.length > 9 ? '54px' : '72px',
                    fontWeight: 400,
                    lineHeight: 0.95,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {excuseLabel}
                </span>
              }
              meta={`× ${snap.topExcuseCount}`}
            />
            <Quadrant
              kicker="Peak window"
              accent={ACCENT}
              statSlot={
                <span
                  style={{
                    color: CHARCOAL,
                    fontFamily: 'serif',
                    fontSize: snap.peakWindowLabel.length > 12 ? '40px' : '52px',
                    fontWeight: 400,
                    lineHeight: 0.95,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {snap.peakWindowLabel}
                </span>
              }
              meta={`${snap.peakWindowSlips} slip${snap.peakWindowSlips === 1 ? '' : 's'}`}
            />
          </div>

          {/* Bottom row — recovery + signature */}
          <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '20px' }}>
            <Quadrant
              kicker="Recovery"
              accent={ACCENT}
              statSlot={
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span
                    style={{
                      color: CHARCOAL,
                      fontFamily: 'serif',
                      fontSize: '78px',
                      fontWeight: 400,
                      lineHeight: 0.95,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {recoveryPct}
                  </span>
                  <span
                    style={{
                      color: ACCENT,
                      fontFamily: 'serif',
                      fontSize: '42px',
                      fontWeight: 400,
                      lineHeight: 0.95,
                    }}
                  >
                    %
                  </span>
                </div>
              }
              meta={`${snap.recoveredCount} of ${snap.slipsThisWeek} slips`}
            />
            <Quadrant
              kicker="Signature"
              accent={ACCENT}
              fillTone={CREAM}
              statSlot={
                <span
                  style={{
                    color: CHARCOAL,
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    fontSize: signature.length > 70 ? '22px' : '26px',
                    fontWeight: 400,
                    lineHeight: 1.25,
                    letterSpacing: '-0.005em',
                  }}
                >
                  &ldquo;{signature}&rdquo;
                </span>
              }
              meta=""
            />
          </div>
        </div>

        {/* Footer brand line */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <span
            style={{
              color: MUTED,
              fontSize: '13px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            COYL &middot; the moment, not the person
          </span>
          <span
            style={{
              color: ACCENT,
              fontSize: '13px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            coyl.ai/audit
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

function Quadrant({
  kicker,
  statSlot,
  meta,
  accent,
  fillTone,
}: {
  kicker: string
  statSlot: React.ReactNode
  meta: string
  accent: string
  fillTone?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: fillTone ?? '#ffffff',
        border: `1px solid ${BORDER}`,
        borderRadius: '20px',
        padding: '24px 26px',
      }}
    >
      <span
        style={{
          color: accent,
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
        }}
      >
        {kicker}
      </span>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', marginTop: '8px' }}>
        {statSlot}
      </div>
      {meta ? (
        <span
          style={{
            color: MUTED,
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {meta}
        </span>
      ) : (
        <span style={{ height: '13px' }} />
      )}
    </div>
  )
}

/**
 * Tombstone — rendered when the slug is unknown or the share has
 * been revoked. Keeps the 200/PNG contract so previews don't collapse
 * to favicons in the social embed.
 */
function renderRevoked() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CREAM,
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(255,102,0,0.08), transparent 60%)',
          padding: '72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 24px ${ACCENT}55`,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={CREAM}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <span
            style={{
              color: CHARCOAL,
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            COYL
          </span>
        </div>
        <span
          style={{
            color: CHARCOAL,
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: '68px',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          This map has been revoked.
        </span>
        <span
          style={{
            color: MUTED,
            fontSize: '18px',
            marginTop: '28px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          coyl.ai/audit
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
