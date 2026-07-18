import { Redirect } from 'expo-router'

/**
 * Catch-all for unmatched routes and deep links.
 *
 * The native config claims https://coyl.ai and https://www.coyl.ai (iOS
 * associatedDomains applinks + an autoVerify Android intent filter). Once the
 * web .well-known files carry real IDs (both currently ship REPLACE_WITH_*
 * placeholders), Android app-links claim EVERY path on those hosts
 * (assetlinks.json is handle_all_urls), so web-only URLs — /onboarding,
 * /a/{slug} shares, /i/*, /r/* referrals — tapped by a user with the app
 * installed arrive here as deep links with no matching native screen.
 *
 * Redirect to the root router (auth/quiz-state aware) instead of stranding
 * the user on expo-router's default "Unmatched Route" dead end.
 */
export default function NotFound() {
  return <Redirect href="/" />
}
