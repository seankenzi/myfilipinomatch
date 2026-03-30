/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface AdminNewSignupProps {
  userName?: string
  userEmail?: string
}

const AdminNewSignupEmail = ({ userName, userEmail }: AdminNewSignupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New user signup on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>New User Signup 🆕</Heading>
        <Text style={text}>
          A new user has just signed up on {SITE_NAME}:
        </Text>
        <Text style={detailText}>
          <strong>Name:</strong> {userName || 'Not provided'}
        </Text>
        <Text style={detailText}>
          <strong>Email:</strong> {userEmail || 'Not provided'}
        </Text>
        <Text style={text}>
          Please review their profile and verification status when they complete onboarding.
        </Text>
        <Button style={button} href="https://myfilipinomatch.lovable.app/admin">
          Go to Admin Dashboard
        </Button>
        <Text style={footer}>
          This is an automated admin notification from {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNewSignupEmail,
  subject: (data: Record<string, any>) =>
    `New signup: ${data.userName || 'New user'} — ${SITE_NAME}`,
  displayName: 'Admin new signup alert',
  previewData: { userName: 'Maria Santos', userEmail: 'maria@example.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 16px' }
const detailText = { fontSize: '14px', color: '#1b2438', lineHeight: '1.5', margin: '0 0 8px' }
const button = {
  backgroundColor: '#d4456a', color: '#ffffff', fontSize: '14px',
  borderRadius: '12px', padding: '12px 20px', textDecoration: 'none',
  marginTop: '12px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
