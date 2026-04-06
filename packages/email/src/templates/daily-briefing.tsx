import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface DailyBriefingEmailProps {
  userName: string
  date: string
  topPriorities: string[]
  completedItems: string[]
  overdueItems: Array<{ title: string; daysOverdue: number }>
  followUpsDue: string[]
  blockedItems: string[]
  coachingNote: string
  appUrl: string
}

export function DailyBriefingEmail({
  userName,
  date,
  topPriorities,
  completedItems,
  overdueItems,
  followUpsDue,
  blockedItems,
  coachingNote,
  appUrl,
}: DailyBriefingEmailProps) {
  const subject = buildSubject({ topPriorities, completedItems, overdueItems })

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>COYL</Text>
            <Text style={dateText}>{date}</Text>
          </Section>

          <Heading style={h1}>Good morning, {userName}.</Heading>
          <Text style={subtitle}>Here&apos;s your daily briefing.</Text>

          <Hr style={divider} />

          {/* Top Priorities */}
          {topPriorities.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>🎯 Today&apos;s Priorities</Heading>
              {topPriorities.map((item, i) => (
                <Text key={i} style={listItem}>
                  {i + 1}. {item}
                </Text>
              ))}
            </Section>
          )}

          {/* Completed */}
          {completedItems.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>✅ Completed</Heading>
              {completedItems.map((item, i) => (
                <Text key={i} style={{ ...listItem, color: '#6b7280' }}>
                  ✓ {item}
                </Text>
              ))}
            </Section>
          )}

          {/* Overdue */}
          {overdueItems.length > 0 && (
            <Section
              style={{
                ...section,
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Heading style={{ ...h2, color: '#dc2626' }}>⚠️ Overdue</Heading>
              {overdueItems.map((item, i) => (
                <Text key={i} style={{ ...listItem, color: '#7f1d1d' }}>
                  {item.title}
                  <span style={{ color: '#dc2626', fontSize: '12px' }}>
                    {' '}
                    ({item.daysOverdue}d overdue)
                  </span>
                </Text>
              ))}
            </Section>
          )}

          {/* Follow-ups */}
          {followUpsDue.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>📋 Follow-ups Due</Heading>
              {followUpsDue.map((item, i) => (
                <Text key={i} style={listItem}>
                  → {item}
                </Text>
              ))}
            </Section>
          )}

          {/* Blocked */}
          {blockedItems.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>🚫 Blocked — Decision Needed</Heading>
              {blockedItems.map((item, i) => (
                <Text key={i} style={listItem}>
                  {item}
                </Text>
              ))}
            </Section>
          )}

          <Hr style={divider} />

          {/* Coaching Note */}
          {coachingNote && (
            <Section
              style={{
                ...section,
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Text
                style={{
                  margin: '0',
                  fontStyle: 'italic',
                  color: '#166534',
                  fontSize: '14px',
                }}
              >
                💡 {coachingNote}
              </Text>
            </Section>
          )}

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              href={appUrl}
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Open COYL
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You&apos;re receiving this because you have daily briefings enabled.{' '}
            <a href={`${appUrl}/settings`} style={{ color: '#6b7280' }}>
              Manage settings
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function buildSubject({
  topPriorities,
  completedItems,
  overdueItems,
}: Pick<DailyBriefingEmailProps, 'topPriorities' | 'completedItems' | 'overdueItems'>) {
  if (overdueItems.length > 0) {
    return `Today's focus: ${topPriorities.length} priorities, ${overdueItems.length} overdue`
  }
  if (completedItems.length > 0) {
    return `You finished ${completedItems.length} things. Here's what's next.`
  }
  return `Your daily briefing: ${topPriorities.length} priorities`
}

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
}

const header = {
  backgroundColor: '#18181b',
  padding: '24px 40px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const logo = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.02em',
}

const dateText = {
  color: '#a1a1aa',
  fontSize: '13px',
  margin: '4px 0 0',
}

const h1 = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#18181b',
  margin: '32px 40px 4px',
  letterSpacing: '-0.02em',
}

const subtitle = {
  fontSize: '15px',
  color: '#6b7280',
  margin: '0 40px 0',
}

const h2 = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#18181b',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const section = {
  margin: '0 40px 24px',
}

const listItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 6px',
  lineHeight: '1.5',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0 40px',
}

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '24px 40px',
}
