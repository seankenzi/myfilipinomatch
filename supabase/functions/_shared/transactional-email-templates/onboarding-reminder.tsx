/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface OnboardingReminderProps {
  name?: string
}

const OnboardingReminderEmail = ({ name }: OnboardingReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} profile is almost ready — finish setting up!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>
          {name ? `Hey ${name}, you're almost there! 💕` : `You're almost there! 💕`}
        </Heading>
        <Text style={text}>
          You signed up for {SITE_NAME} but haven't finished setting up your profile yet.
          Complete your profile now so others can discover you and you can start making
          meaningful connections.
        </Text>
        <Text style={text}>
          It only takes a few minutes to complete — add your photos, tell us about
          yourself, and you'll be ready to start matching!
        </Text>
        <Button style={button} href="https://www.myfilipinomatch.com/onboarding">
          Complete My Profile
        </Button>
        <Text style={footer}>
          If you need any help, don't hesitate to reach out to our support team.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OnboardingReminderEmail,
  subject: `Don't forget to complete your profile! 💕`,
  displayName: 'Onboarding reminder',
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
