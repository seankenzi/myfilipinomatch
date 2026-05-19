import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Max recipients notified per new signup
const MAX_RECIPIENTS = 15
// Per-recipient throttle: don't email same recipient more than once per N days for this template
const THROTTLE_DAYS = 7
const TEMPLATE_NAME = 'new-member-suggestion'

function oppositeGender(gender?: string | null): string | null {
  if (!gender) return null
  const g = gender.toLowerCase().trim()
  if (g === 'male' || g === 'man') return 'female'
  if (g === 'female' || g === 'woman') return 'male'
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let newUserId: string
  try {
    const body = await req.json()
    newUserId = body.newUserId || body.new_user_id
    if (!newUserId) throw new Error('newUserId required')
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid body: ' + (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Load the new user's profile
  const { data: newUser, error: newUserErr } = await supabase
    .from('profiles')
    .select('id, full_name, age, gender, country, city, province, user_type, onboarding_completed, photos')
    .eq('id', newUserId)
    .maybeSingle()

  if (newUserErr || !newUser) {
    return new Response(JSON.stringify({ error: 'New user not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!newUser.onboarding_completed) {
    return new Response(JSON.stringify({ skipped: 'onboarding_incomplete' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Determine targeting
  const wantedGender = oppositeGender(newUser.gender)
  const newUserType = (newUser.user_type || '').toLowerCase()
  // Cross-tier: foreigner ↔ filipino
  const recipientUserType =
    newUserType === 'foreigner' ? 'filipino' :
    newUserType === 'filipino' ? 'foreigner' : null

  // Build candidate query
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, preferred_min_age, preferred_max_age')
    .eq('onboarding_completed', true)
    .neq('id', newUserId)
    .not('email', 'is', null)
    .or('is_flagged.is.null,is_flagged.eq.false')

  if (wantedGender) query = query.eq('gender', wantedGender)
  if (recipientUserType) {
    query = query.eq('user_type', recipientUserType)
    // For Filipino recipients of a foreigner signup, ensure they're open to international matches
    if (recipientUserType === 'filipino') {
      query = query.eq('international_preference', true)
    }
  }

  // Age preference filter (recipient's preferred range must cover new user's age)
  if (newUser.age) {
    query = query
      .or(`preferred_min_age.is.null,preferred_min_age.lte.${newUser.age}`)
      .or(`preferred_max_age.is.null,preferred_max_age.gte.${newUser.age}`)
  }

  // Pull a generous pool, then filter by throttle
  const { data: candidates, error: candErr } = await query.limit(MAX_RECIPIENTS * 5)

  if (candErr) {
    console.error('Candidate query failed', candErr)
    return new Response(JSON.stringify({ error: 'Candidate query failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ notified: 0, reason: 'no_candidates' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Throttle: exclude recipients emailed this template within the past N days
  const cutoff = new Date(Date.now() - THROTTLE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const recipientEmails = candidates.map(c => c.email!.toLowerCase()).filter(Boolean)

  const { data: recentSends } = await supabase
    .from('email_send_log')
    .select('recipient_email')
    .eq('template_name', TEMPLATE_NAME)
    .in('status', ['pending', 'sent'])
    .in('recipient_email', recipientEmails)
    .gte('created_at', cutoff)

  const throttled = new Set((recentSends || []).map(r => r.recipient_email.toLowerCase()))
  const eligible = candidates
    .filter(c => c.email && !throttled.has(c.email.toLowerCase()))
    .slice(0, MAX_RECIPIENTS)

  if (eligible.length === 0) {
    return new Response(JSON.stringify({ notified: 0, reason: 'all_throttled' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build location string
  const newMemberLocation = [newUser.city, newUser.province, newUser.country]
    .filter(Boolean).join(', ') || undefined

  // Fan out — each invocation is a 1:1 transactional send to a recipient whose
  // preferences match the new member. Each goes through suppression checks and
  // the system unsubscribe footer.
  const results = await Promise.allSettled(eligible.map(recipient =>
    supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: TEMPLATE_NAME,
        recipientEmail: recipient.email,
        idempotencyKey: `new-member-${newUserId}-to-${recipient.id}`,
        templateData: {
          recipientName: recipient.full_name?.split(' ')[0] || undefined,
          newMemberName: newUser.full_name?.split(' ')[0] || undefined,
          newMemberAge: newUser.age || undefined,
          newMemberLocation,
          newMemberId: newUser.id,
        },
      },
    })
  ))

  const successCount = results.filter(r => r.status === 'fulfilled').length
  console.log('new-member-suggestion fanout', {
    newUserId, eligible: eligible.length, succeeded: successCount,
  })

  return new Response(JSON.stringify({ notified: successCount, eligible: eligible.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
