/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface AppCrashAlertProps {
  errorMessage?: string
  errorStack?: string
  pageUrl?: string
  userAgent?: string
  timestamp?: string
}

const AppCrashAlertEmail = ({ errorMessage, errorStack, pageUrl, userAgent, timestamp }: AppCrashAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ App crash detected on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>⚠️ App Crash Detected</Heading>
        <Text style={text}>
          A runtime error crashed a page on {SITE_NAME}. Details below:
        </Text>

        <Section style={detailBox}>
          <Text style={detailLabel}>Error</Text>
          <Text style={detailValue}>{errorMessage || 'Unknown error'}</Text>
        </Section>

        {pageUrl && (
          <Section style={detailBox}>
            <Text style={detailLabel}>Page</Text>
            <Text style={detailValue}>{pageUrl}</Text>
          </Section>
        )}

        {timestamp && (
          <Section style={detailBox}>
            <Text style={detailLabel}>Time</Text>
            <Text style={detailValue}>{timestamp}</Text>
          </Section>
        )}

        {errorStack && (
          <Section style={detailBox}>
            <Text style={detailLabel}>Stack trace</Text>
            <Text style={codeBlock}>{errorStack}</Text>
          </Section>
        )}

        {userAgent && (
          <Section style={detailBox}>
            <Text style={detailLabel}>Browser</Text>
            <Text style={{ ...detailValue, fontSize: '12px' }}>{userAgent}</Text>
          </Section>
        )}

        <Text style={footer}>
          This is an automated crash alert from {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AppCrashAlertEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ Crash: ${(data.errorMessage || 'Unknown error').slice(0, 60)} — ${SITE_NAME}`,
  displayName: 'App crash alert',
  previewData: {
    errorMessage: "Cannot read properties of undefined (reading 'map')",
    pageUrl: 'https://myfilipinomatch.lovable.app/admin',
    timestamp: '2026-03-30T15:45:00Z',
    errorStack: "TypeError: Cannot read properties of undefined\n    at DashboardTab (AdminDashboard.tsx:73)",
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 16px' }
const detailBox = { backgroundColor: '#f8f6f5', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }
const detailLabel = { fontSize: '11px', fontWeight: 'bold' as const, color: '#737a85', textTransform: 'uppercase' as const, margin: '0 0 4px', letterSpacing: '0.5px' }
const detailValue = { fontSize: '14px', color: '#1b2438', margin: '0', lineHeight: '1.4', wordBreak: 'break-all' as const }
const codeBlock = { fontSize: '12px', color: '#1b2438', margin: '0', lineHeight: '1.5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
