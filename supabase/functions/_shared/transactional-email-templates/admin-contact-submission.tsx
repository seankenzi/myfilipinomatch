/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface AdminContactSubmissionProps {
  senderName?: string
  senderEmail?: string
  subject?: string
  message?: string
}

const AdminContactSubmissionEmail = ({ senderName, senderEmail, subject, message }: AdminContactSubmissionProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {senderName || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>New Contact Submission 📩</Heading>
        <Text style={text}>
          Someone has submitted a message through the contact form on {SITE_NAME}:
        </Text>
        <Text style={detailText}>
          <strong>Name:</strong> {senderName || 'Not provided'}
        </Text>
        <Text style={detailText}>
          <strong>Email:</strong> {senderEmail || 'Not provided'}
        </Text>
        <Text style={detailText}>
          <strong>Subject:</strong> {subject || 'No subject'}
        </Text>
        <Text style={{ ...detailText, marginTop: '12px' }}>
          <strong>Message:</strong>
        </Text>
        <Text style={messageBox}>
          {message || 'No message content'}
        </Text>
        <Button style={button} href="https://www.myfilipinomatch.com/admin">
          View in Admin Dashboard
        </Button>
        <Text style={footer}>
          This is an automated admin notification from {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminContactSubmissionEmail,
  subject: (data: Record<string, any>) =>
    `Contact form: ${data.subject || 'New message'} — ${SITE_NAME}`,
  displayName: 'Admin contact submission alert',
  previewData: {
    senderName: 'Juan Dela Cruz',
    senderEmail: 'juan@example.com',
    subject: 'Account issue',
    message: 'Hi, I need help with my account verification. It has been pending for 3 days.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 16px' }
const detailText = { fontSize: '14px', color: '#1b2438', lineHeight: '1.5', margin: '0 0 8px' }
const messageBox = {
  fontSize: '14px', color: '#1b2438', lineHeight: '1.6',
  backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '14px 16px',
  margin: '4px 0 20px', whiteSpace: 'pre-wrap' as const,
}
const button = {
  backgroundColor: '#d4456a', color: '#ffffff', fontSize: '14px',
  borderRadius: '12px', padding: '12px 20px', textDecoration: 'none',
  marginTop: '12px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
