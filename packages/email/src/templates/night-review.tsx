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

interface NightReviewEmailProps {
  userName: string
  completedToday: string[]
  openTomorrow: string[]
  reviewUrl: string
}

export function NightReviewEmail({
  userName,
  completedToday,
  openTomorrow,
  reviewUrl,
}: NightReviewEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {completedToday.length > 0
          ? `You completed ${completedToday.length} task${completedToday.length !== 1 ? 's' : ''} today`
          : 'Time for your evening review'}
      </Preview>
      <Body style={{ backgroundColor: '#0f0f0f', fontFamily: '-apple-system, sans-serif' }}>
        <Container
          style={{
            maxWidth: '540px',
            margin: '40px auto',
            backgroundColor: '#18181b',
            borderRadius: '12px',
            border: '1px solid #27272a',
            padding: '40px',
          }}
        >
          <Heading
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#fafafa',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Good evening, {userName}.
          </Heading>
          <Text style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 28px' }}>
            Time to close out the day and set yourself up for tomorrow.
          </Text>

          {completedToday.length > 0 && (
            <Section
              style={{
                backgroundColor: '#052e16',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #14532d',
              }}
            >
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#4ade80',
                  margin: '0 0 10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                ✓ Completed today ({completedToday.length})
              </Text>
              {completedToday.slice(0, 5).map((task, i) => (
                <Text key={i} style={{ fontSize: '13px', color: '#86efac', margin: '0 0 4px' }}>
                  · {task}
                </Text>
              ))}
              {completedToday.length > 5 && (
                <Text style={{ fontSize: '12px', color: '#4ade80', margin: '8px 0 0' }}>
                  + {completedToday.length - 5} more
                </Text>
              )}
            </Section>
          )}

          {completedToday.length === 0 && (
            <Section
              style={{
                backgroundColor: '#27272a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <Text style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
                No tasks completed today. Tomorrow is a fresh start — what&apos;s the one thing that would make it a win?
              </Text>
            </Section>
          )}

          {openTomorrow.length > 0 && (
            <Section
              style={{
                backgroundColor: '#1c1917',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '28px',
                border: '1px solid #292524',
              }}
            >
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#a8a29e',
                  margin: '0 0 10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Up next
              </Text>
              {openTomorrow.slice(0, 3).map((task, i) => (
                <Text key={i} style={{ fontSize: '13px', color: '#d6d3d1', margin: '0 0 4px' }}>
                  · {task}
                </Text>
              ))}
            </Section>
          )}

          <Button
            href={reviewUrl}
            style={{
              backgroundColor: '#fafafa',
              color: '#09090b',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center',
            }}
          >
            Start Evening Review →
          </Button>

          <Text style={{ fontSize: '12px', color: '#52525b', margin: '24px 0 0', textAlign: 'center' }}>
            COYL · Unsubscribe in settings
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
