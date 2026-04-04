import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Fetch sessions from the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: sessions, error } = await supabase
    .from('video_call_sessions')
    .select('id, user_id, started_at, ended_at, duration_seconds')
    .gte('started_at', since)

  if (error) {
    console.error('Failed to fetch sessions', error)
    return new Response(JSON.stringify({ error: 'DB error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Detect anomalies
  interface Anomaly {
    sessionId: string
    userId: string
    userName?: string
    flag: string
    durationSeconds?: number
    elapsedSeconds?: number
    startedAt: string
  }

  const anomalies: Anomaly[] = []
  const orphanedIds: string[] = []

  for (const s of sessions || []) {
    const elapsed = s.ended_at
      ? Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
      : null

    const isInflated = s.duration_seconds != null && elapsed != null && s.duration_seconds > elapsed + 120
    const isOrphaned = !s.ended_at && (Date.now() - new Date(s.started_at).getTime()) > 600_000

    if (isInflated || isOrphaned) {
      if (isOrphaned) orphanedIds.push(s.id)
      anomalies.push({
        sessionId: s.id,
        userId: s.user_id,
        flag: isInflated ? 'Inflated duration' : 'Orphaned session (auto-closed)',
        durationSeconds: s.duration_seconds ?? undefined,
        elapsedSeconds: elapsed ?? undefined,
        startedAt: s.started_at,
      })
    }
  }

  // Auto-close orphaned sessions
  if (orphanedIds.length > 0) {
    const { error: closeError } = await supabase
      .from('video_call_sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: 0 })
      .in('id', orphanedIds)

    if (closeError) {
      console.error('Failed to auto-close orphaned sessions', closeError)
    } else {
      console.log(`Auto-closed ${orphanedIds.length} orphaned session(s)`)
    }
  }

  if (anomalies.length === 0) {
    console.log('No video anomalies detected')
    return new Response(JSON.stringify({ anomalies: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch user names for anomalies
  const userIds = [...new Set(anomalies.map((a) => a.userId))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]))
  for (const a of anomalies) {
    a.userName = nameMap.get(a.userId) || 'Unknown'
  }

  // Get admin emails
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')

  if (!adminRoles || adminRoles.length === 0) {
    console.log('No admins found, skipping alert')
    return new Response(JSON.stringify({ anomalies: anomalies.length, admins: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const adminIds = adminRoles.map((r) => r.user_id)
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', adminIds)

  const checkDate = new Date().toISOString().split('T')[0]
  const templateData = {
    checkDate,
    anomalies: anomalies.map((a) => ({
      userName: a.userName,
      sessionId: a.sessionId,
      flag: a.flag,
      durationSeconds: a.durationSeconds,
      elapsedSeconds: a.elapsedSeconds,
      startedAt: a.startedAt,
    })),
  }

  let sent = 0
  for (const admin of adminProfiles || []) {
    if (!admin.email) continue
    const { error: sendError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'video-anomaly-alert',
        recipientEmail: admin.email,
        idempotencyKey: `video-anomaly-${checkDate}-${admin.id}`,
        templateData,
      },
    })
    if (sendError) {
      console.error(`Failed to send to admin ${admin.id}`, sendError)
    } else {
      sent++
    }
  }

  console.log(`Video anomaly alert sent to ${sent} admin(s), ${anomalies.length} anomalies`)
  return new Response(
    JSON.stringify({ anomalies: anomalies.length, adminsSent: sent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
