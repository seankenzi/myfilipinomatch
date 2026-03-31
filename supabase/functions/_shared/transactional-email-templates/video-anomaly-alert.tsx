/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface AnomalyItem {
  userName?: string
  sessionId?: string
  flag?: string
  durationSeconds?: number
  elapsedSeconds?: number
  startedAt?: string
}

interface VideoAnomalyAlertProps {
  anomalies?: AnomalyItem[]
  checkDate?: string
}

const VideoAnomalyAlertEmail = ({ anomalies = [], checkDate }: VideoAnomalyAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🎥 {anomalies.length} anomalous video session(s) detected on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>🎥 Video Session Anomalies</Heading>
        <Text style={text}>
          {anomalies.length} anomalous video session(s) detected on {checkDate || 'today'}. Please review in the admin dashboard.
        </Text>

        {anomalies.slice(0, 10).map((a, i) => (
          <Section key={i} style={detailBox}>
            <Text style={detailLabel}>{a.flag || 'Anomaly'}</Text>
            <Text style={detailValue}>
              User: {a.userName || 'Unknown'}{'\n'}
              Started: {a.startedAt || '—'}{'\n'}
              {a.flag === 'Inflated duration'
                ? `Recorded: ${a.durationSeconds}s vs Actual: ${a.elapsedSeconds}s`
                : 'Session has no end timestamp'}
            </Text>
          </Section>
        ))}

        {anomalies.length > 10 && (
          <Text style={text}>...and {anomalies.length - 10} more. Check the admin dashboard for full details.</Text>
        )}

        <Text style={footer}>
          This is an automated daily alert from {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VideoAnomalyAlertEmail,
  subject: (data: Record<string, any>) =>
    `🎥 ${data.anomalies?.length || 0} video anomalies detected — ${SITE_NAME}`,
  displayName: 'Video session anomaly alert',
  previewData: {
    checkDate: '2026-03-31',
    anomalies: [
      { userName: 'McKenzi Dern', flag: 'Inflated duration', durationSeconds: 7200, elapsedSeconds: 83, startedAt: '2026-03-30T14:00:00Z' },
      { userName: 'Jane Doe', flag: 'Orphaned session', startedAt: '2026-03-30T16:30:00Z' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 16px' }
const detailBox = { backgroundColor: '#f8f6f5', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }
const detailLabel = { fontSize: '11px', fontWeight: 'bold' as const, color: '#d4456a', textTransform: 'uppercase' as const, margin: '0 0 4px', letterSpacing: '0.5px' }
const detailValue = { fontSize: '14px', color: '#1b2438', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-line' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
