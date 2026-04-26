import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { template as welcomeEmailTemplate } from '../_shared/transactional-email-templates/welcome-email.tsx'
import { template as adminNewSignupTemplate } from '../_shared/transactional-email-templates/admin-new-signup.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "MyFilipinoMatch"
const SENDER_DOMAIN = "notify.myfilipinomatch.com"
const ROOT_DOMAIN = "myfilipinomatch.com"
const FROM_DOMAIN = "myfilipinomatch.com"
const OAUTH_SIGNUP_SYNC_WINDOW_MS = 24 * 60 * 60 * 1000

const SAMPLE_PROJECT_URL = "https://myfilipinomatch.lovable.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: '123456',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceSupabaseClient = any

// Generate a cryptographically random 32-byte hex token
function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function getOrCreateUnsubscribeToken(
  supabase: ServiceSupabaseClient,
  email: string
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()

  // Check for existing token
  const { data: existingToken, error: lookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupError) {
    console.error('Token lookup failed', { error: lookupError, email: normalizedEmail })
    return null
  }

  if (existingToken && !existingToken.used_at) {
    return existingToken.token
  }

  if (!existingToken) {
    const newToken = generateUnsubscribeToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: newToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (tokenError) {
      console.error('Failed to create unsubscribe token', { error: tokenError })
      return null
    }

    // Re-read in case of race condition
    const { data: storedToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    return storedToken?.token ?? null
  }

  // Token exists but is used — recipient unsubscribed
  return null
}

async function directEnqueueTransactionalEmail(
  supabase: ServiceSupabaseClient,
  templateName: string,
  template: { component: React.ComponentType<any>; subject: string | ((data: Record<string, any>) => string) },
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, any> = {}
): Promise<boolean> {
  const messageId = crypto.randomUUID()

  try {
    // Check suppression list
    const { data: suppressed } = await supabase
      .from('suppressed_emails')
      .select('id')
      .eq('email', recipientEmail.toLowerCase())
      .maybeSingle()

    if (suppressed) {
      console.log('Email suppressed', { recipientEmail, templateName })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'suppressed',
      })
      return true // Not an error, just suppressed
    }

    // Get or create unsubscribe token
    const unsubscribeToken = await getOrCreateUnsubscribeToken(supabase, recipientEmail)
    if (!unsubscribeToken) {
      console.error('Failed to obtain unsubscribe token', { recipientEmail, templateName })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: 'Failed to obtain unsubscribe token',
      })
      return false
    }

    // Render template
    const html = await renderAsync(React.createElement(template.component, templateData))
    const text = await renderAsync(React.createElement(template.component, templateData), { plainText: true })

    // Resolve subject
    const resolvedSubject = typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

    // Log pending
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: 'pending',
    })

    // Enqueue directly to transactional_emails queue
    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipientEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: resolvedSubject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('Failed to enqueue transactional email directly', {
        error: enqueueError,
        templateName,
        recipientEmail,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
      return false
    }

    console.log('Transactional email enqueued directly', { templateName, recipientEmail })
    return true
  } catch (error) {
    console.error('Error rendering/enqueuing transactional email', {
      error,
      templateName,
      recipientEmail,
    })
    return false
  }
}

async function triggerSignupAppEmails(
  supabase: ServiceSupabaseClient,
  payload: any
): Promise<void> {
  const userEmail = payload?.data?.email
  if (!userEmail) return

  const userName =
    payload?.data?.user_metadata?.full_name ||
    payload?.data?.full_name ||
    payload?.data?.user?.user_metadata?.full_name ||
    payload?.user?.user_metadata?.full_name ||
    undefined

  const normalizedUserEmail = normalizeEmail(userEmail)

  // Directly render and enqueue welcome email
  const welcomeQueued = await directEnqueueTransactionalEmail(
    supabase,
    'welcome-email',
    welcomeEmailTemplate,
    userEmail,
    `welcome-signup-${normalizedUserEmail}`,
    { name: userName }
  )

  // Directly render and enqueue admin notification emails
  const { data: adminEmails, error: adminEmailsError } = await supabase.rpc('get_admin_emails')
  if (adminEmailsError) {
    console.error('Failed to load admin emails for signup notification', {
      error: adminEmailsError,
      userEmail,
    })
    return
  }

  const adminResults = await Promise.allSettled(
    (adminEmails ?? []).map((row: { email: string }) =>
      directEnqueueTransactionalEmail(
        supabase,
        'admin-new-signup',
        adminNewSignupTemplate,
        row.email,
        `admin-new-signup-${normalizedUserEmail}-${normalizeEmail(row.email)}`,
        { userName, userEmail }
      )
    )
  )

  const adminQueued = adminResults.every(
    (result) => result.status === 'fulfilled' && result.value === true
  )

  if (!welcomeQueued || !adminQueued) {
    console.error('Signup app emails did not fully queue', {
      userEmail,
      welcomeQueued,
      adminResults,
    })
    return
  }

  const userId =
    payload?.data?.user_id ||
    payload?.data?.user?.id ||
    payload?.user?.id ||
    null

  const updateResult = userId
    ? await supabase.from('profiles').update({ welcome_email_sent: true }).eq('id', userId)
    : await supabase.from('profiles').update({ welcome_email_sent: true }).eq('email', userEmail)

  if (updateResult.error) {
    console.error('Failed to mark signup emails as queued', {
      error: updateResult.error,
      userEmail,
      userId,
    })
  }
}

async function handleSignupSync(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { trigger?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const validTriggers = ['oauth-signup-sync', 'email-signup-sync']
  if (!body.trigger || !validTriggers.includes(body.trigger)) {
    return new Response(JSON.stringify({ error: 'Unsupported request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables for signup sync')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const token = authHeader.slice('Bearer '.length).trim()

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    console.error('Signup sync auth failed', { error: authError })
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const user = authData.user

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name, welcome_email_sent, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Failed to load profile for signup sync', {
      error: profileError,
      userId: user.id,
    })
    return new Response(JSON.stringify({ error: 'Failed to load signup profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!profile) {
    return new Response(JSON.stringify({ success: true, skipped: 'profile_missing' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (profile.welcome_email_sent) {
    return new Response(JSON.stringify({ success: true, skipped: 'already_queued' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const createdAtMs = new Date(profile.created_at).getTime()
  if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > OAUTH_SIGNUP_SYNC_WINDOW_MS) {
    return new Response(JSON.stringify({ success: true, skipped: 'outside_sync_window' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userEmail = profile.email ? normalizeEmail(profile.email) : user.email ? normalizeEmail(user.email) : null
  if (!userEmail) {
    return new Response(JSON.stringify({ success: true, skipped: 'missing_email' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Signup sync triggered', { trigger: body.trigger, userId: user.id, email: userEmail })

  await triggerSignupAppEmails(supabase, {
    data: {
      email: userEmail,
      full_name: profile.full_name,
      user_metadata: user.user_metadata ?? {},
      user: {
        id: user.id,
        user_metadata: user.user_metadata ?? {},
      },
      user_id: user.id,
    },
  })

  return new Response(JSON.stringify({ success: true, queued: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]

  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let payload: any
  let run_id = ''
  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: apiKey,
      parser: parseEmailWebhookPayload,
    })
    payload = verified.payload
    run_id = payload.run_id
  } catch (error) {
    if (error instanceof WebhookError) {
      switch (error.code) {
        case 'invalid_signature':
        case 'missing_timestamp':
        case 'invalid_timestamp':
        case 'stale_timestamp':
          console.error('Invalid webhook signature', { error: error.message })
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        case 'invalid_payload':
        case 'invalid_json':
          console.error('Invalid webhook payload', { error: error.message })
          return new Response(
            JSON.stringify({ error: 'Invalid webhook payload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    console.error('Webhook verification failed', { error })
    return new Response(
      JSON.stringify({ error: 'Invalid webhook payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!run_id) {
    console.error('Webhook payload missing run_id')
    return new Response(
      JSON.stringify({ error: 'Invalid webhook payload' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (payload.version !== '1') {
    console.error('Unsupported payload version', { version: payload.version, run_id })
    return new Response(
      JSON.stringify({ error: `Unsupported payload version: ${payload.version}` }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const emailType = payload.data.action_type
  console.log('Received auth event', { emailType, email: payload.data.email, run_id })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType, run_id })
    return new Response(
      JSON.stringify({ error: `Unknown email type: ${emailType}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const messageId = crypto.randomUUID()

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      run_id,
      message_id: messageId,
      to: payload.data.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: EMAIL_SUBJECTS[emailType] || 'Notification',
      html,
      text,
      purpose: 'transactional',
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue auth email', { error: enqueueError, run_id, emailType })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: payload.data.email,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Auth email enqueued', { emailType, email: payload.data.email, run_id })

  if (emailType === 'signup') {
    try {
      await triggerSignupAppEmails(supabase, payload)
    } catch (error) {
      console.error('Failed to trigger signup app emails', {
        error,
        email: payload.data.email,
        run_id,
      })
    }
  }

  return new Response(
    JSON.stringify({ success: true, queued: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    if (req.headers.get('Authorization')?.startsWith('Bearer ')) {
      return await handleSignupSync(req)
    }

    return await handleWebhook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})