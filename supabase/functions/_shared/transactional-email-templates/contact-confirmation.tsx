/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface ContactConfirmationProps {
  name?: string
  subject?: string
}

const ContactConfirmationEmail = ({ name, subject }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>
          {name ? `Thank you, ${name}!` : 'Thank you for reaching out!'}
        </Heading>
        {subject && (
          <Text style={text}>
            We received your message regarding: <strong>{subject}</strong>
          </Text>
        )}
        <Text style={text}>
          Our support team will review your message and get back to you within
          24 hours. We appreciate your patience!
        </Text>
        <Text style={footer}>
          Best regards,{'\n'}The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message',
  displayName: 'Contact form confirmation',
  previewData: { name: 'Jane', subject: 'Account question' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
