/**
 * Teams app install callback.
 *
 * Two-step flow:
 *
 *   1. IT admin clicks "Add COYL to Teams" in our pricing page →
 *      we redirect them through Microsoft Azure AD's admin-consent
 *      endpoint with our MS_BOT_APP_ID + ?state=clerkId:nonce.
 *
 *   2. Microsoft 302s the admin back here with `tenant`, `admin_consent`,
 *      and `state`. We persist a TeamsWorkspace row (one per tenant)
 *      and bounce them to /clinician/onboarding to finish the COYL-side
 *      setup (assign default plan, enable SCIM, etc.).
 *
 * Errors render as JSON 400/4xx — the admin-consent surface only
 * appears once per tenant, so a clean status code beats a redirect to
 * a generic error page for ops debugging.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { getTeamsConfig, provisionTeamsWorkspace } from '@/lib/integrations/teams'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenant')
  const adminConsent = url.searchParams.get('admin_consent')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return Response.json({ error: `aad_${errorParam}` }, { status: 400 })
  }
  if (!getTeamsConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }
  if (!tenantId || !state || adminConsent !== 'True') {
    return Response.json({ error: 'missing_params' }, { status: 400 })
  }

  // The admin must be signed into COYL when they complete the
  // admin-consent flow — that's how we resolve installedById.
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  // State format: `${clerkId}:${nonce}` — guards against CSRF.
  const [stateClerkId] = state.split(':')
  if (stateClerkId !== clerkId) {
    return Response.json({ error: 'state_mismatch' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true },
  })
  if (!user) {
    return Response.json({ error: 'user_not_found' }, { status: 404 })
  }

  // Workspace name — we don't know the AAD-display name without an
  // extra Graph call, so seed it from the admin's email domain. The
  // /clinician/onboarding flow can update this in place.
  const domain = user.email.split('@')[1] ?? 'unknown'
  const workspaceName = `Teams • ${domain}`

  try {
    await provisionTeamsWorkspace(tenantId, workspaceName, user.id)
  } catch (err) {
    console.error('[teams/install] provision failed', {
      tenantId,
      userId: user.id,
      err: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: 'provision_failed' }, { status: 500 })
  }

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'teams_install',
      metadataJson: {
        type: 'teams_install',
        tenantId,
        workspaceName,
        installedAt: new Date().toISOString(),
      },
    },
  })

  // Open-redirect guard: the destination is hard-coded relative to
  // NEXT_PUBLIC_APP_URL — no user-controlled segments. We deliberately
  // do NOT echo `tenantId` into the redirect target even though it
  // looks safe; the install row is queryable by the onboarding page
  // server-side via installedById = user.id.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  return Response.redirect(
    `${appUrl}/clinician/onboarding?integration=teams_installed`,
    302,
  )
}
