#!/usr/bin/env node
/**
 * One-command Stripe setup for COYL's subscription tiers.
 *
 * Creates (idempotently, keyed on Stripe price lookup_keys):
 *   - Product "COYL Rewire"  → $12/mo  (rewire_monthly)  + $99/yr  (rewire_annual)
 *   - Product "COYL Rebound" → $29/mo  (rebound_monthly) + $199/yr (rebound_annual)
 *   - Webhook endpoint https://www.coyl.ai/api/webhooks/stripe with the four
 *     events the handler consumes (see src/app/api/webhooks/stripe/route.ts)
 *
 * Then prints the env vars the checkout route reads — or pushes them straight
 * to Vercel (Production + Preview) with --push.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs           # dry: create + print
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs --push    # create + vercel env add
 *
 * Safe to re-run: existing prices are found by lookup_key and reused; the
 * webhook endpoint is found by URL and left alone (its secret is only shown
 * by Stripe at creation time — re-runs print a dashboard pointer instead).
 *
 * No dependencies — raw Stripe REST via fetch (Node 18+).
 */

import { execSync } from 'node:child_process'

const KEY = process.env.STRIPE_SECRET_KEY
// Accept both secret keys (sk_) and restricted keys (rk_).
if (!KEY || !(KEY.startsWith('sk_') || KEY.startsWith('rk_'))) {
  console.error('STRIPE_SECRET_KEY is not set (or not an sk_/rk_ key).')
  console.error('Pass it inline, e.g.:  STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe.mjs --push')
  console.error('A restricted key (rk_live_...) works too — needs write on Products, Prices, Webhook Endpoints.')
  process.exit(1)
}
if (KEY.includes('_test')) {
  console.warn('⚠️  TEST-mode key — prices will be created in test mode. Re-run with a live key for real revenue.\n')
}

const PUSH = process.argv.includes('--push')
const WEBHOOK_URL = 'https://www.coyl.ai/api/webhooks/stripe'
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]

/** Tier plan — mirrors entitlement.service.ts PLAN_PRICING + the paywall. */
const PLAN = [
  {
    product: { name: 'COYL Rewire', description: 'Unlimited behavioral interrupts — the full COYL engine.', tier: 'core' },
    prices: [
      { lookup: 'rewire_monthly', amount: 1200, interval: 'month', env: 'STRIPE_CORE_MONTHLY_PRICE_ID' },
      { lookup: 'rewire_annual', amount: 9900, interval: 'year', env: 'STRIPE_CORE_ANNUAL_PRICE_ID' },
    ],
  },
  {
    product: { name: 'COYL Rebound', description: 'Rewire plus the post-GLP-1 maintenance layer.', tier: 'plus' },
    prices: [
      { lookup: 'rebound_monthly', amount: 2900, interval: 'month', env: 'STRIPE_PLUS_MONTHLY_PRICE_ID' },
      { lookup: 'rebound_annual', amount: 19900, interval: 'year', env: 'STRIPE_PLUS_ANNUAL_PRICE_ID' },
    ],
  },
]

async function stripe(method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? new URLSearchParams(params) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${method} ${path} → ${json.error?.message ?? res.status}`)
  return json
}

async function findPriceByLookup(lookup) {
  const list = await stripe('GET', `/prices?lookup_keys[]=${lookup}&limit=1`)
  return list.data[0] ?? null
}

async function findOrCreateProduct(p) {
  const list = await stripe('GET', '/products?active=true&limit=100')
  const existing = list.data.find((d) => d.name === p.name)
  if (existing) return existing
  console.log(`  creating product "${p.name}"`)
  return stripe('POST', '/products', {
    name: p.name,
    description: p.description,
    'metadata[coyl_tier]': p.tier,
  })
}

async function main() {
  const envVars = {}

  for (const { product, prices } of PLAN) {
    let prod = null
    for (const price of prices) {
      const existing = await findPriceByLookup(price.lookup)
      if (existing) {
        console.log(`✓ ${price.lookup} exists → ${existing.id} ($${existing.unit_amount / 100}/${existing.recurring.interval})`)
        envVars[price.env] = existing.id
        continue
      }
      prod ??= await findOrCreateProduct(product)
      const created = await stripe('POST', '/prices', {
        product: prod.id,
        currency: 'usd',
        unit_amount: String(price.amount),
        'recurring[interval]': price.interval,
        lookup_key: price.lookup,
        'metadata[coyl_tier]': product.tier,
      })
      console.log(`+ created ${price.lookup} → ${created.id} ($${price.amount / 100}/${price.interval})`)
      envVars[price.env] = created.id
    }
  }

  // Webhook endpoint — the signing secret is only returned at creation.
  const hooks = await stripe('GET', '/webhook_endpoints?limit=100')
  const existingHook = hooks.data.find((h) => h.url === WEBHOOK_URL)
  if (existingHook) {
    console.log(`✓ webhook exists → ${existingHook.id} (secret only visible in Dashboard → Webhooks)`)
  } else {
    const hook = await stripe('POST', '/webhook_endpoints', {
      url: WEBHOOK_URL,
      ...Object.fromEntries(WEBHOOK_EVENTS.map((e, i) => [`enabled_events[${i}]`, e])),
      description: 'COYL subscription sync (checkout + subscription lifecycle)',
    })
    console.log(`+ created webhook → ${hook.id}`)
    envVars.STRIPE_WEBHOOK_SECRET = hook.secret
  }

  envVars.STRIPE_SECRET_KEY = KEY

  console.log('\n— Env vars —')
  for (const [name, value] of Object.entries(envVars)) {
    const shown = name === 'STRIPE_SECRET_KEY' ? value.slice(0, 11) + '…' : value
    console.log(`${name}=${shown}`)
  }

  if (!PUSH) {
    console.log('\nRe-run with --push to set these in Vercel (Production + Preview) automatically,')
    console.log('or add them by hand in Vercel → Settings → Environment Variables.')
    return
  }

  console.log('\n— Pushing to Vercel —')
  for (const [name, value] of Object.entries(envVars)) {
    for (const target of ['production', 'preview']) {
      try {
        execSync(`vercel env add ${name} ${target} --force`, { input: value, stdio: ['pipe', 'pipe', 'pipe'] })
        console.log(`✓ ${name} → ${target}`)
      } catch (e) {
        console.error(`✗ ${name} → ${target}: ${e.stderr?.toString().trim() || e.message}`)
        console.error(`  Set it manually: printf '%s' '<value>' | vercel env add ${name} ${target} --force`)
      }
    }
  }
  console.log('\nDone. Redeploy so the new env takes effect:  git commit --allow-empty -m "env: stripe" && git push')
}

main().catch((e) => {
  console.error('\nFailed:', e.message)
  process.exit(1)
})
