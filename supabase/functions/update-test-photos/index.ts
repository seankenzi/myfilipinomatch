import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { photoUrls } = await req.json()
  // photoUrls: { email: string, url: string }[]

  const results = []

  for (const { email, url } of photoUrls) {
    // Find user by email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profiles) {
      results.push({ email, status: 'not_found' })
      continue
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        photos: [url],
        avatar_url: url,
      })
      .eq('id', profiles.id)

    results.push({ email, status: error ? 'error' : 'updated', message: error?.message })
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
})