/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface ProfileLikedProps {
  likerName?: string
}

const ProfileLikedEmail = ({ likerName }: ProfileLikedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Someone liked your profile on {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>
          Someone likes you! ❤️
        </Heading>
        <Text style={text}>
          {likerName
            ? `Great news — ${likerName} just liked your profile on ${SITE_NAME}!`
            : `Great news — someone just liked your profile on ${SITE_NAME}!`}
        </Text>
        <Text style={text}>
          Could this be the start of something special? Check out who liked you
          and see if you feel the same way.
        </Text>
        <Button style={button} href="https://myfilipinomatch.lovable.app/who-liked-me">
          See Who Liked You
        </Button>
        <Text style={footer}>
          Keep your profile updated with great photos to attract more attention!
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ProfileLikedEmail,
  subject: 'Someone liked your profile! ❤️',
  displayName: 'Profile liked notification',
  previewData: { likerName: 'Carlos' },
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
