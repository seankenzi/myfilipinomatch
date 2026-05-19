/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/email-assets/myfilipinomatch-logo.png'
const SITE_NAME = 'MyFilipinoMatch'

interface NewMemberSuggestionProps {
  recipientName?: string
  newMemberName?: string
  newMemberAge?: number
  newMemberLocation?: string
  newMemberId?: string
}

const NewMemberSuggestionEmail = ({
  recipientName,
  newMemberName,
  newMemberAge,
  newMemberLocation,
  newMemberId,
}: NewMemberSuggestionProps) => {
  const profileUrl = newMemberId
    ? `https://www.myfilipinomatch.com/profile/${newMemberId}`
    : 'https://www.myfilipinomatch.com/discover'
  const summary = [newMemberAge ? `${newMemberAge}` : null, newMemberLocation]
    .filter(Boolean)
    .join(' · ')

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {newMemberName
          ? `${newMemberName} just joined ${SITE_NAME} and matches your preferences`
          : `Someone new on ${SITE_NAME} matches your preferences`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
          <Heading style={h1}>
            {recipientName ? `Hi ${recipientName}, ` : 'Hi there, '}
            someone new just joined 💕
          </Heading>
          <Text style={text}>
            {newMemberName ? newMemberName : 'A new member'} just created their
            profile on {SITE_NAME}, and they look like a great match for your
            preferences.
          </Text>
          {summary && <Text style={highlight}>{summary}</Text>}
          <Button style={button} href={profileUrl}>
            View their profile
          </Button>
          <Text style={footer}>
            Be one of the first to say hi — new members often respond fastest in
            their first few days. 🌺
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewMemberSuggestionEmail,
  subject: (data: Record<string, any>) =>
    data?.newMemberName
      ? `${data.newMemberName} just joined and matches your preferences 💕`
      : 'Someone new just joined that matches your preferences 💕',
  displayName: 'New member suggestion',
  previewData: {
    recipientName: 'Mark',
    newMemberName: 'Maria',
    newMemberAge: 27,
    newMemberLocation: 'Cebu, Philippines',
    newMemberId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b2438', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737a85', lineHeight: '1.5', margin: '0 0 20px' }
const highlight = { fontSize: '15px', color: '#1b2438', fontWeight: '600' as const, margin: '0 0 25px' }
const button = {
  backgroundColor: '#d4456a', color: '#ffffff', fontSize: '14px',
  borderRadius: '12px', padding: '12px 20px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
