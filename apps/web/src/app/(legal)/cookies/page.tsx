import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookie Policy' }

export default function CookiesPage() {
  return (
    <article className="prose prose-invert prose-gray max-w-none prose-headings:text-white prose-a:text-orange-500">
      <h1>Cookie Policy</h1>
      <p className="text-sm text-gray-500">Last updated: April 9, 2026</p>

      <p>
        This Cookie Policy explains how COYL (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar
        technologies when you visit our website at coyl.ai and use our Service.
      </p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the
        website remember your preferences, keep you signed in, and understand how you interact with
        the site. Cookies may be &quot;session&quot; cookies (deleted when you close your browser) or
        &quot;persistent&quot; cookies (remain until they expire or you delete them).
      </p>

      <h2>2. Cookies We Use</h2>

      <h3>2.1 Strictly Necessary Cookies</h3>
      <p>
        These cookies are essential for the Service to function. You cannot opt out of these cookies
        as the Service will not work without them.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Provider</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td>__clerk_db_jwt</td><td>Clerk</td><td>Authentication session</td><td>Session</td></tr>
          <tr><td>__client_uat</td><td>Clerk</td><td>User authentication token</td><td>1 year</td></tr>
          <tr><td>__session</td><td>Clerk</td><td>Session management</td><td>Session</td></tr>
          <tr><td>coyl_cookie_consent</td><td>COYL</td><td>Stores your cookie preferences</td><td>1 year</td></tr>
        </tbody>
      </table>

      <h3>2.2 Functional Cookies</h3>
      <p>
        These cookies remember your preferences and settings to enhance your experience.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Provider</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td>timezone</td><td>COYL</td><td>Stores your timezone preference</td><td>1 year</td></tr>
          <tr><td>theme</td><td>COYL</td><td>Stores light/dark mode preference</td><td>1 year</td></tr>
        </tbody>
      </table>

      <h3>2.3 Analytics Cookies</h3>
      <p>
        We currently do not use third-party analytics cookies. If we add analytics in the future,
        this policy will be updated and your consent will be requested.
      </p>

      <h2>3. Third-Party Cookies</h2>
      <p>
        Our payment processor (Stripe) may set cookies when you interact with the checkout flow.
        These cookies are governed by Stripe&apos;s own cookie policy. We do not control these cookies.
      </p>

      <h2>4. Managing Cookies</h2>
      <p>You can manage cookies in several ways:</p>
      <ul>
        <li><strong>Cookie consent banner:</strong> When you first visit COYL, you can choose to accept or decline non-essential cookies</li>
        <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies may prevent the Service from working</li>
        <li><strong>Opt out:</strong> You can withdraw your consent for non-essential cookies at any time by clearing your cookies and revisiting the site</li>
      </ul>

      <h3>Browser-Specific Instructions</h3>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/manage-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>5. Do Not Track</h2>
      <p>
        We do not currently respond to Do Not Track (DNT) browser signals, as there is no industry
        standard for compliance. We do not engage in cross-site tracking.
      </p>

      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this Cookie Policy as we add new features or technologies. Changes will be
        posted on this page with an updated date.
      </p>

      <h2>7. Contact</h2>
      <p>
        For questions about our use of cookies, contact us at{' '}
        <a href="mailto:privacy@coyl.ai">privacy@coyl.ai</a>.
      </p>
    </article>
  )
}
