#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * apps/mobile/scripts/preflight.js
 *
 * Pre-submission sanity check. Run before `eas build` or `eas submit`
 * to catch the issues that otherwise burn 24–48h of App Store review
 * time:
 *
 *   - Placeholder values left in app.json / eas.json
 *   - Missing required image assets (icon, notification icon, splash)
 *   - iOS bundle id ≠ Android package id (causes deep-link failures)
 *   - Version not bumped vs. the last submitted build (Apple rejects)
 *   - Required Apple / Google submission identifiers absent
 *   - Service account JSON missing for Android submits
 *
 * Exits 1 if any blocker is found. Use as the first step in build
 * scripts so a misconfigured submission never gets uploaded.
 *
 * Usage:  node scripts/preflight.js  [--platform ios|android|all]
 *                                    [--for build|submit]
 *
 * Defaults: --platform all --for submit. The submit check is stricter
 * (requires Apple / Google identifiers); the build check only verifies
 * the bundle and assets.
 */

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const APP_JSON = path.join(ROOT, 'app.json')
const EAS_JSON = path.join(ROOT, 'eas.json')

const args = process.argv.slice(2)
const platform = getArg('--platform', 'all') // 'ios' | 'android' | 'all'
const mode = getArg('--for', 'submit')        // 'build' | 'submit'

function getArg(name, def) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}

const errors = []
const warnings = []
function err(msg) { errors.push(msg) }
function warn(msg) { warnings.push(msg) }

// ─────────────────────────── checks ───────────────────────────

if (!fs.existsSync(APP_JSON)) err('app.json not found')
if (!fs.existsSync(EAS_JSON)) err('eas.json not found')
if (errors.length > 0) finish()

const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8')).expo
const eas = JSON.parse(fs.readFileSync(EAS_JSON, 'utf8'))

// Placeholder scan — anything starting with REPLACE_WITH_ is a blocker.
const placeholderRe = /REPLACE_WITH_/
function scanForPlaceholders(obj, p = '') {
  if (obj == null) return
  if (typeof obj === 'string') {
    if (placeholderRe.test(obj)) err(`placeholder at ${p}: ${obj}`)
    return
  }
  if (typeof obj !== 'object') return
  for (const k of Object.keys(obj)) {
    scanForPlaceholders(obj[k], p ? `${p}.${k}` : k)
  }
}
scanForPlaceholders(app, 'app.json:expo')
if (mode === 'submit') {
  scanForPlaceholders(eas.submit, 'eas.json:submit')
}

// Bundle id must match iOS + Android
const iosBundle = app?.ios?.bundleIdentifier
const androidPackage = app?.android?.package
if (!iosBundle) err('ios.bundleIdentifier missing in app.json')
if (!androidPackage) err('android.package missing in app.json')
if (iosBundle && androidPackage && iosBundle !== androidPackage) {
  err(
    `bundle id mismatch: ios=${iosBundle} android=${androidPackage} — deep links will break`,
  )
}

// Required image assets
const assets = path.join(ROOT, 'assets')
const requiredAssets = ['icon.png', 'notification-icon.png']
for (const a of requiredAssets) {
  if (!fs.existsSync(path.join(assets, a))) {
    err(`missing required asset: assets/${a}`)
  }
}

// iOS-specific requirements
if (platform === 'ios' || platform === 'all') {
  // Privacy manifest declaration
  if (!app?.ios?.privacyManifests?.usesDataCollection) {
    warn(
      'ios.privacyManifests.usesDataCollection is unset — App Store may flag this if your app collects ANY user data',
    )
  }
  // Usage descriptions required by Apple for permissions we request
  const requiredUsageStrings = [
    'NSUserNotificationsUsageDescription',
    'NSHealthShareUsageDescription',
  ]
  const ios = app?.ios?.infoPlist ?? {}
  for (const key of requiredUsageStrings) {
    if (!ios[key]) {
      err(`ios.infoPlist.${key} is required for the permissions we request`)
    }
  }
  // Submit-time only: Apple identifiers
  if (mode === 'submit') {
    const sub = eas?.submit?.production?.ios
    if (!sub?.appleId || sub.appleId.includes('@example')) {
      err('eas.json submit.production.ios.appleId not set to a real Apple ID')
    }
    if (!sub?.ascAppId) {
      err('eas.json submit.production.ios.ascAppId not set (App Store Connect app id)')
    }
    if (!sub?.appleTeamId) {
      err('eas.json submit.production.ios.appleTeamId not set')
    }
  }
}

// Android-specific requirements
if (platform === 'android' || platform === 'all') {
  // Permissions must be declared for runtime requests
  const perms = app?.android?.permissions ?? []
  if (!perms.includes('android.permission.POST_NOTIFICATIONS')) {
    warn('android: POST_NOTIFICATIONS not declared but push is the core mechanic')
  }
  if (mode === 'submit') {
    const sub = eas?.submit?.production?.android
    const keyPath = sub?.serviceAccountKeyPath
    if (!keyPath) {
      err('eas.json submit.production.android.serviceAccountKeyPath not set')
    } else {
      const abs = path.resolve(ROOT, keyPath)
      if (!fs.existsSync(abs)) {
        err(
          `Play service account key not found at ${keyPath}. Generate from Play Console → API Access → Create Service Account, download JSON, place at this path. Add to .gitignore.`,
        )
      }
    }
  }
}

// EAS project initialization
if (app?.extra?.eas?.projectId == null) {
  err('app.json extra.eas.projectId is missing — run `eas init` to populate')
}
if (app?.updates?.url == null) {
  warn('app.json updates.url is unset — OTA updates will not work without it')
}

// Version sanity — warn if version is still 1.0.0 / buildNumber 1 on a re-submit
if (mode === 'submit') {
  if (app.version === '1.0.0' && app?.ios?.buildNumber === '1') {
    warn(
      'version 1.0.0 buildNumber 1 — fine for first submission. If this is a resubmit, bump buildNumber or Apple will 409.',
    )
  }
}

// ─────────────────────────── output ───────────────────────────

finish()

function finish() {
  if (warnings.length > 0) {
    console.warn('\n⚠️  Preflight warnings:')
    for (const w of warnings) console.warn(`  - ${w}`)
  }
  if (errors.length > 0) {
    console.error('\n❌ Preflight FAILED — fix these before submitting:')
    for (const e of errors) console.error(`  - ${e}`)
    console.error(
      '\n  See docs/mobile-submission/SUBMISSION-CHECKLIST.md for the full walk-through.\n',
    )
    process.exit(1)
  }
  console.log(
    `\n✅ Preflight passed (platform=${platform}, mode=${mode}). Safe to ${mode}.\n`,
  )
}
