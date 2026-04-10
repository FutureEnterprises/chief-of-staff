import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How COYL collects, uses, and protects your data. Covers task data, AI processing, third-party services, GDPR, CCPA, and your privacy rights.',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-gray max-w-none prose-headings:text-white prose-a:text-orange-500">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: April 9, 2026</p>

      <p>
        COYL (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy
        explains how we collect, use, disclose, and safeguard your information when you use the COYL
        platform (&quot;the Service&quot;) at coyl.ai and our mobile applications.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide</h3>
      <ul>
        <li><strong>Account information:</strong> Name, email address, and profile data provided through Clerk authentication (including Google, Apple, or email/password sign-in)</li>
        <li><strong>Task data:</strong> Tasks, descriptions, due dates, priorities, follow-up schedules, project assignments, and tags you create within the Service</li>
        <li><strong>AI interactions:</strong> Messages you send in chat sessions (morning planning, night reviews, assessments) to power AI-generated responses</li>
        <li><strong>Preferences:</strong> Timezone, notification settings, briefing preferences, and reminder intensity</li>
        <li><strong>Payment information:</strong> Billing details processed and stored by Stripe. We do not store credit card numbers on our servers.</li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage data:</strong> Pages visited, features used, session duration, and interaction patterns</li>
        <li><strong>Device information:</strong> Browser type, operating system, device type, and screen resolution</li>
        <li><strong>Log data:</strong> IP address, access times, and referring URLs</li>
        <li><strong>Cookies:</strong> Authentication cookies and preferences (see our Cookie Policy for details)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li><strong>Provide the Service:</strong> Store and display your tasks, generate AI responses, send briefings and reminders</li>
        <li><strong>Personalize your experience:</strong> Tailor morning/night reviews, generate performance assessments based on your task history</li>
        <li><strong>Process payments:</strong> Manage subscriptions through Stripe</li>
        <li><strong>Send communications:</strong> Daily email briefings (when enabled), service announcements, and account notifications</li>
        <li><strong>Improve the Service:</strong> Analyze usage patterns to improve features, fix bugs, and optimize performance</li>
        <li><strong>Ensure security:</strong> Detect and prevent fraud, abuse, and unauthorized access</li>
      </ul>

      <h2>3. AI Data Processing</h2>
      <p>
        When you use AI features (chat, morning/night reviews, performance assessments), your task data
        and messages are sent to our AI provider (Anthropic) to generate responses. Specifically:
      </p>
      <ul>
        <li>Your open tasks, completion history, and follow-up data are included as context in AI prompts</li>
        <li>Performance assessments analyze 30 days of task data (completion rates, priority distribution, overdue patterns)</li>
        <li>AI conversations are logged for service quality but are not used to train AI models</li>
        <li>Anthropic processes data in accordance with their data processing agreement and does not use your data to train their models</li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <p>We share your information with the following third-party services:</p>

      <table>
        <thead>
          <tr><th>Service</th><th>Purpose</th><th>Data Shared</th></tr>
        </thead>
        <tbody>
          <tr><td>Clerk</td><td>Authentication</td><td>Email, name, profile, session tokens</td></tr>
          <tr><td>Stripe</td><td>Payments</td><td>Email, billing address, payment method</td></tr>
          <tr><td>Anthropic (Claude)</td><td>AI features</td><td>Task data, chat messages (per-session, not stored)</td></tr>
          <tr><td>Resend</td><td>Email delivery</td><td>Email address, briefing content</td></tr>
          <tr><td>Vercel</td><td>Hosting</td><td>IP address, request logs</td></tr>
          <tr><td>Supabase</td><td>Database</td><td>All user and task data (encrypted at rest)</td></tr>
          <tr><td>Upstash</td><td>Rate limiting</td><td>User IDs (for rate limit counters only)</td></tr>
        </tbody>
      </table>

      <p>
        We do not sell your personal information to third parties. We do not share your data with
        advertisers or data brokers.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li><strong>Active accounts:</strong> Your data is retained for as long as your account is active</li>
        <li><strong>Deleted accounts:</strong> Upon account deletion, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., billing records for tax compliance)</li>
        <li><strong>AI interaction logs:</strong> Chat logs are retained for up to 90 days for service quality, then deleted</li>
        <li><strong>Billing records:</strong> Retained for 7 years as required by tax law</li>
      </ul>

      <h2>6. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your data:
      </p>
      <ul>
        <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
        <li>Authentication is managed by Clerk with support for multi-factor authentication</li>
        <li>API endpoints are protected with rate limiting and input validation</li>
        <li>Database access is restricted to authorized services only</li>
        <li>We conduct regular security reviews of our codebase</li>
      </ul>
      <p>
        No method of transmission or storage is 100% secure. While we strive to protect your data,
        we cannot guarantee absolute security.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the following rights:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Correction:</strong> Request correction of inaccurate data</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data</li>
        <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
        <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
        <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
      </ul>
      <p>
        To exercise these rights, contact us at <a href="mailto:privacy@coyl.ai">privacy@coyl.ai</a>.
        We will respond within 30 days.
      </p>

      <h2>8. GDPR (European Users)</h2>
      <p>
        If you are located in the European Economic Area (EEA), we process your personal data under
        the following legal bases:
      </p>
      <ul>
        <li><strong>Contract:</strong> Processing necessary to provide the Service you signed up for</li>
        <li><strong>Legitimate interest:</strong> Improving the Service, preventing fraud, and ensuring security</li>
        <li><strong>Consent:</strong> Where you have given explicit consent (e.g., email briefings)</li>
      </ul>
      <p>
        Data is transferred to the United States where our services are hosted. We rely on Standard
        Contractual Clauses (SCCs) and our processors&apos; data protection agreements to ensure adequate
        protection.
      </p>

      <h2>9. CCPA (California Users)</h2>
      <p>
        If you are a California resident, you have the right to:
      </p>
      <ul>
        <li>Know what personal information we collect and how it is used</li>
        <li>Request deletion of your personal information</li>
        <li>Opt out of the sale of personal information (we do not sell your data)</li>
        <li>Non-discrimination for exercising your privacy rights</li>
      </ul>
      <p>
        To submit a CCPA request, email <a href="mailto:privacy@coyl.ai">privacy@coyl.ai</a>.
      </p>

      <h2>10. Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for children under 16. We do not knowingly collect personal
        information from children under 16. If we learn we have collected data from a child under 16,
        we will delete it promptly.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes
        by posting the updated policy with a new date and, where required, by email. Your continued
        use of the Service after changes constitutes acceptance.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy-related questions or to exercise your data rights:<br />
        Email: <a href="mailto:privacy@coyl.ai">privacy@coyl.ai</a><br />
        COYL<br />
        United States
      </p>
    </article>
  )
}
