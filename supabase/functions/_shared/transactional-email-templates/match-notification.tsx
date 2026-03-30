/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface MatchNotificationProps {
  matchName?: string
}

const MatchNotificationEmail = ({ matchName }: MatchNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You have a new match on {SITE_NAME}! 💕</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>It's a match! 💕</Heading>
        <Text style={text}>
          {matchName
            ? `Great news — you and ${matchName} liked each other! Start a conversation and see where it goes.`
            : `Great news — someone you liked has liked you back! Start a conversation and see where it goes.`}
        </Text>
        <Button style={button} href="https://myfilipinomatch.lovable.app/matches">
          View Your Matches
        </Button>
        <Text style={footer}>
          Good luck! We're rooting for you. 🌺
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MatchNotificationEmail,
  subject: "It's a match! 💕",
  displayName: 'New match notification',
  previewData: { matchName: 'Maria' },
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
