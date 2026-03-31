/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME}! Your journey to finding love starts now.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>
          {name ? `Welcome, ${name}! 💕` : `Welcome to ${SITE_NAME}! 💕`}
        </Heading>
        <Text style={text}>
          We're so glad you've joined our community. You're now one step closer
          to finding your perfect match.
        </Text>
        <Text style={text}>
          Here's how to get started:
        </Text>
        <Text style={text}>
          1. Complete your profile with great photos{'\n'}
          2. Tell us about yourself and what you're looking for{'\n'}
          3. Start browsing and connecting with amazing people
        </Text>
        <Button style={button} href="https://www.myfilipinomatch.com/discover">
          Start Exploring
        </Button>
        <Text style={footer}>
          Need help? Visit our support page anytime — we're here for you.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to MyFilipinoMatch! 💕',
  displayName: 'Welcome email',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 25px' }
const button = {
  backgroundColor: '#d4456a', color: '#ffffff', fontSize: '14px',
  borderRadius: '12px', padding: '12px 20px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
