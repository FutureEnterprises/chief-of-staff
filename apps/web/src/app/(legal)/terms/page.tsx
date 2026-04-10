import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-gray max-w-none prose-headings:text-white prose-a:text-orange-500">
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: April 9, 2026</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of COYL (&quot;the Service&quot;),
        operated by COYL (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, you agree
        to be bound by these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 16 years old and capable of forming a binding contract to use the Service.
        By using COYL, you represent that you meet these requirements. If you are using the Service on
        behalf of an organization, you represent that you have authority to bind that organization to these Terms.
      </p>

      <h2>2. Account Registration</h2>
      <p>
        To use COYL, you must create an account through our authentication provider (Clerk). You are
        responsible for maintaining the confidentiality of your account credentials and for all activity
        under your account. You agree to notify us immediately of any unauthorized use of your account.
      </p>

      <h2>3. The Service</h2>
      <p>
        COYL is an AI-powered productivity platform that helps you track tasks, commitments, and
        follow-ups. The Service includes:
      </p>
      <ul>
        <li>Task capture, tracking, and management</li>
        <li>AI-assisted planning, reviews, and performance assessments</li>
        <li>Morning and night briefing sessions</li>
        <li>Follow-up tracking and escalation reminders</li>
        <li>Email briefings and notifications</li>
        <li>Mobile and web access</li>
      </ul>

      <h2>4. Subscription Plans and Billing</h2>
      <h3>4.1 Free Plan</h3>
      <p>
        The Free plan provides limited access to the Service, including up to 50 active tasks,
        20 AI assists per month, and 3 projects. The Free plan may be modified at our discretion.
      </p>
      <h3>4.2 Pro Plan</h3>
      <p>
        The Pro plan is available for $14.99/month or $99.99/year and provides expanded access to
        all features, including unlimited tasks, 500 AI assists per month, follow-up automation,
        performance assessments, and advanced insights.
      </p>
      <h3>4.3 Billing</h3>
      <p>
        All payments are processed through Stripe. By subscribing to a paid plan, you authorize us
        to charge the payment method on file on a recurring basis. Prices are in USD and do not
        include applicable taxes.
      </p>
      <h3>4.4 Cancellation and Refunds</h3>
      <p>
        You may cancel your subscription at any time through the Service or by contacting us. Upon
        cancellation, you will retain access to Pro features until the end of your current billing
        period. We do not provide prorated refunds for partial billing periods. Annual plans with a
        free trial may be cancelled during the trial at no charge.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
        <li>Attempt to gain unauthorized access to the Service or its systems</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Upload malicious code, viruses, or harmful content</li>
        <li>Use automated tools (bots, scrapers) to access the Service without our consent</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
        <li>Use the AI features to generate harmful, abusive, or illegal content</li>
        <li>Resell, sublicense, or commercially exploit the Service without authorization</li>
        <li>Impersonate another person or entity</li>
      </ul>

      <h2>6. Your Content</h2>
      <p>
        You retain ownership of all content you submit to the Service (&quot;Your Content&quot;), including
        tasks, notes, and messages. By using the Service, you grant us a limited license to store,
        process, and display Your Content solely for the purpose of providing the Service to you.
      </p>
      <p>
        We do not claim ownership of Your Content and will not use it for purposes unrelated to
        providing the Service, except as required by law or as described in our Privacy Policy.
      </p>

      <h2>7. AI Features</h2>
      <p>
        The Service includes AI-powered features that analyze your task data and provide suggestions,
        assessments, and coaching. You acknowledge that:
      </p>
      <ul>
        <li>AI outputs are generated algorithmically and may not always be accurate</li>
        <li>AI assessments (including &quot;No BS Mode&quot;) are for motivational and productivity purposes only and do not constitute professional advice</li>
        <li>Your task data is processed by third-party AI providers (Anthropic) to generate responses</li>
        <li>You should not rely solely on AI recommendations for important decisions</li>
      </ul>

      <h2>8. Intellectual Property</h2>
      <p>
        The Service, including its design, code, branding, and AI models, is owned by COYL and
        protected by intellectual property laws. You may not copy, modify, or distribute any part
        of the Service without our written permission.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate your account at any time if you violate these Terms or if we
        discontinue the Service. Upon termination, your right to use the Service ceases immediately.
        We will make reasonable efforts to allow you to export Your Content before deletion, but are
        not obligated to retain it after account termination.
      </p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
        BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, COYL SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
        OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR TOTAL
        LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless COYL, its officers, directors, employees, and
        agents from any claims, damages, losses, or expenses arising out of your use of the Service,
        your violation of these Terms, or your violation of any third-party rights.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of the State of
        Delaware, United States, without regard to conflict of law principles. Any disputes arising
        under these Terms shall be resolved in the courts of Delaware.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by
        posting the updated Terms on the Service with a new &quot;Last updated&quot; date. Your continued use
        of the Service after changes constitutes acceptance of the updated Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions about these Terms, contact us at{' '}
        <a href="mailto:legal@coyl.ai">legal@coyl.ai</a>.
      </p>
    </article>
  )
}
