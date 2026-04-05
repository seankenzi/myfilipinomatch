import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { template as welcomeEmailTemplate } from '../_shared/transactional-email-templates/welcome-email.tsx'
import { template as adminNewSignupTemplate } from '../_shared/transactional-email-templates/admin-new-signup.tsx'

const SITE_NAME = "MyFilipinoMatch"
const SENDER_DOMAIN = "notify.myfilipinomatch.com"
const FROM_DOMAIN = "myfilipinomatch.com"

// How old a profile must be before we consider the webhook "missed" (5 minutes)
const MIN_AGE_MINUTES = 5
// Don't process profiles older than 24 hours (they're too stale)
const MAX_AGE_HOURS = 24
// Process at most 20 profiles per run to avoid timeouts
const BATCH_SIZE = 20

function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function getOrCreateUnsubscribeToken(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data: existingToken, error: lookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupError) {
    console.error('Token lookup failed', { error: lookupError, email: normalizedEmail })
    return null
  }

  if (existingToken && !existingToken.used_at) return existingToken.token
  if (existingToken?.used_at) return null // unsubscribed

  const newToken = generateUnsubscribeToken()
  const { error: tokenError } = await supabase
    .from('email_unsubscribe_tokens')
    .upsert({ token: newToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })

  if (tokenError) {
    console.error('Failed to create unsubscribe token', { error: tokenError })
    return null
  }

  const { data: storedToken } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalizedEmail)
    .maybeSingle()

  return storedToken?.token ?? null
}

async function enqueueTransactionalEmail(
  supabase: ReturnType<typeof createClient>,
  templateName: string,
  template: { component: React.ComponentType<any>; subject: string | ((data: Record<string, any>) => string) },
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, any> = {}
): Promise<boolean> {
  const messageId = crypto.randomUUID()

  try {
    // Check suppression
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
      return true
    }

    const unsubscribeToken = await getOrCreateUnsubscribeToken(supabase, recipientEmail)
    if (!unsubscribeToken) {
      console.error('No unsubscribe token', { recipientEmail, templateName })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: 'Failed to obtain unsubscribe token',
      })
      return false
    }

    const html = await renderAsync(React.createElement(template.component, templateData))
    const text = await renderAsync(React.createElement(template.component, templateData), { plainText: true })
    const resolvedSubject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: 'pending',
    })

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
      console.error('Failed to enqueue', { error: enqueueError, templateName, recipientEmail })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: 'Enqueue failed',
      })
      return false
    }

    console.log('Enqueued', { templateName, recipientEmail })
    return true
  } catch (error) {
    console.error('Error in enqueueTransactionalEmail', { error, templateName, recipientEmail })
    return false
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Find profiles where welcome_email_sent is false,
  // created more than MIN_AGE_MINUTES ago but less than MAX_AGE_HOURS ago,
  // and have an email address
  const cutoffRecent = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString()
  const cutoffOld = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const { data: missedProfiles, error: queryError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('welcome_email_sent', false)
    .lt('created_at', cutoffRecent)
    .gt('created_at', cutoffOld)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (queryError) {
    console.error('Failed to query missed profiles', queryError)
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!missedProfiles || missedProfiles.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: 'No missed signups' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`Found ${missedProfiles.length} profiles with missed signup emails`)

  let processed = 0
  let failed = 0

  for (const profile of missedProfiles) {
    const userEmail = profile.email!.trim().toLowerCase()
    const normalizedEmail = userEmail

    try {
      // Send welcome email
      const welcomeOk = await enqueueTransactionalEmail(
        supabase,
        'welcome-email',
        welcomeEmailTemplate,
        userEmail,
        `welcome-signup-${normalizedEmail}`,
        { name: profile.full_name || undefined }
      )

      // Send admin notification emails
      const { data: adminEmails } = await supabase.rpc('get_admin_emails')
      let adminOk = true
      if (adminEmails && adminEmails.length > 0) {
        const results = await Promise.allSettled(
          adminEmails.map((row: { email: string }) =>
            enqueueTransactionalEmail(
              supabase,
              'admin-new-signup',
              adminNewSignupTemplate,
              row.email,
              `admin-new-signup-${normalizedEmail}-${row.email.trim().toLowerCase()}`,
              { userName: profile.full_name, userEmail }
            )
          )
        )
        adminOk = results.every((r) => r.status === 'fulfilled' && r.value === true)
      }

      if (welcomeOk && adminOk) {
        // Mark as sent
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', profile.id)

        if (updateError) {
          console.error('Failed to mark welcome_email_sent', { profileId: profile.id, error: updateError })
        }

        processed++
        console.log(`Processed missed signup for ${userEmail}`)
      } else {
        failed++
        console.error(`Failed to fully process signup emails for ${userEmail}`)
      }
    } catch (err) {
      failed++
      console.error(`Error processing ${userEmail}`, err)
    }
  }

  return new Response(
    JSON.stringify({ processed, failed, total: missedProfiles.length }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})