import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface MorningCheckinEmailProps {
  userName: string
  checkinUrl: string
  topOpenTasks: string[]
}

export function MorningCheckinEmail({
  userName,
  checkinUrl,
  topOpenTasks,
}: MorningCheckinEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your morning planning session is ready</Preview>
      <Body
        style={{ backgroundColor: '#f9fafb', fontFamily: '-apple-system, sans-serif' }}
      >
        <Container
          style={{
            maxWidth: '540px',
            margin: '40px auto',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '40px',
          }}
        >
          <Heading
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#18181b',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Good morning, {userName}.
          </Heading>
          <Text style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
            Time for your morning planning session. Let&apos;s set the day up right.
          </Text>

          {topOpenTasks.length > 0 && (
            <Section
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <Text
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Still open from yesterday
              </Text>
              {topOpenTasks.slice(0, 3).map((task, i) => (
                <Text key={i} style={{ fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
                  · {task}
                </Text>
              ))}
            </Section>
          )}

          <Button
            href={checkinUrl}
            style={{
              backgroundColor: '#18181b',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center',
            }}
          >
            Start Morning Planning →
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
