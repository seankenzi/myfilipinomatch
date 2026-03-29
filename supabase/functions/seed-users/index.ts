import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DUMMY_USERS = [
  {
    email: "isabella.garcia@myfilipinomatch-test.com",
    profile: { full_name: "Isabella Garcia", gender: "female", age: 25, city: "Makati", country: "Philippines", bio: "Coffee lover and travel enthusiast 🌍✈️", interests: ["travel", "coffee", "photography", "hiking"], relationship_intent: "long-term", education: "College", language: "English", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400", photos: ["https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400"], height_cm: 160, weight_kg: 52, relationship_status: "single", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "michael.chen@myfilipinomatch-test.com",
    profile: { full_name: "Michael Chen", gender: "male", age: 32, city: "Singapore", country: "Singapore", bio: "Software engineer by day, guitarist by night 🎸", interests: ["music", "cooking", "technology", "fitness"], relationship_intent: "long-term", education: "Masters", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"], height_cm: 178, weight_kg: 75, relationship_status: "single", want_children: "yes", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "camille.reyes@myfilipinomatch-test.com",
    profile: { full_name: "Camille Reyes", gender: "female", age: 27, city: "Quezon City", country: "Philippines", bio: "Nurse and foodie. Best hidden restaurants in QC! 🍜", interests: ["food", "movies", "dancing", "reading"], relationship_intent: "marriage", education: "College", language: "Filipino", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", photos: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"], height_cm: 155, weight_kg: 50, relationship_status: "single", want_children: "yes", relocation_intent: "not-willing", international_preference: false },
  },
  {
    email: "ryan.anderson@myfilipinomatch-test.com",
    profile: { full_name: "Ryan Anderson", gender: "male", age: 36, city: "Sydney", country: "Australia", bio: "Architect who loves surfing and weekend road trips 🏄", interests: ["surfing", "architecture", "travel", "dogs"], relationship_intent: "marriage", education: "Masters", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"], height_cm: 185, weight_kg: 82, relationship_status: "single", want_children: "yes", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "jasmine.delacruz@myfilipinomatch-test.com",
    profile: { full_name: "Jasmine Dela Cruz", gender: "female", age: 23, city: "Taguig", country: "Philippines", bio: "Fresh grad, aspiring artist 🎨 Love K-dramas and bubble tea!", interests: ["art", "kpop", "anime", "baking"], relationship_intent: "long-term", education: "College", language: "Filipino", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", photos: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"], height_cm: 157, weight_kg: 48, relationship_status: "single", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "thomas.weber@myfilipinomatch-test.com",
    profile: { full_name: "Thomas Weber", gender: "male", age: 39, city: "Berlin", country: "Germany", bio: "Chef and wine enthusiast. 30+ countries and counting 🍷", interests: ["cooking", "wine", "travel", "photography"], relationship_intent: "long-term", education: "Vocational", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400", photos: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"], height_cm: 182, weight_kg: 80, relationship_status: "divorced", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "patricia.villanueva@myfilipinomatch-test.com",
    profile: { full_name: "Patricia Villanueva", gender: "female", age: 30, city: "Pasig", country: "Philippines", bio: "Marketing manager who loves yoga and weekend getaways 🐕", interests: ["yoga", "marketing", "dogs", "beach"], relationship_intent: "marriage", education: "Masters", language: "English", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"], height_cm: 163, weight_kg: 55, relationship_status: "single", want_children: "yes", relocation_intent: "not-willing", international_preference: false },
  },
  {
    email: "daniel.kim@myfilipinomatch-test.com",
    profile: { full_name: "Daniel Kim", gender: "male", age: 28, city: "Seoul", country: "South Korea", bio: "UX designer and coffee snob ☕ Looking for someone genuine.", interests: ["design", "coffee", "gaming", "movies"], relationship_intent: "long-term", education: "College", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400", photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400"], height_cm: 175, weight_kg: 70, relationship_status: "single", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "angela.torres@myfilipinomatch-test.com",
    profile: { full_name: "Angela Mae Torres", gender: "female", age: 22, city: "Iloilo", country: "Philippines", bio: "Student and beach bum 🏖️ Loves sunsets and acoustic music.", interests: ["beach", "music", "swimming", "volunteering"], relationship_intent: "long-term", education: "College", language: "Filipino", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400", photos: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"], height_cm: 158, weight_kg: 49, relationship_status: "single", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "william.parker@myfilipinomatch-test.com",
    profile: { full_name: "William Parker", gender: "male", age: 44, city: "Toronto", country: "Canada", bio: "Business owner and fitness enthusiast. Looking for a serious partner.", interests: ["fitness", "business", "family", "golf"], relationship_intent: "marriage", education: "Masters", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400", photos: ["https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400"], height_cm: 180, weight_kg: 85, relationship_status: "divorced", want_children: "no", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "rica.mendoza@myfilipinomatch-test.com",
    profile: { full_name: "Rica Mendoza", gender: "female", age: 28, city: "Baguio", country: "Philippines", bio: "Teacher and plant mom 🌿 I make the best strawberry jam!", interests: ["gardening", "cooking", "hiking", "reading"], relationship_intent: "marriage", education: "College", language: "Filipino", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400", photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400"], height_cm: 152, weight_kg: 47, relationship_status: "single", want_children: "yes", relocation_intent: "not-willing", international_preference: false },
  },
  {
    email: "marcus.johnson@myfilipinomatch-test.com",
    profile: { full_name: "Marcus Johnson", gender: "male", age: 31, city: "New York", country: "United States", bio: "Lawyer with a passion for jazz and Italian cooking 🎵", interests: ["jazz", "cooking", "law", "running"], relationship_intent: "long-term", education: "Doctorate", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400", photos: ["https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400"], height_cm: 183, weight_kg: 78, relationship_status: "single", want_children: "yes", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "krystal.santos@myfilipinomatch-test.com",
    profile: { full_name: "Krystal Santos", gender: "female", age: 26, city: "Cebu", country: "Philippines", bio: "Call center team lead. Gym rat and sushi addict 🍣", interests: ["fitness", "sushi", "netflix", "travel"], relationship_intent: "long-term", education: "College", language: "English", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400", photos: ["https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400"], height_cm: 165, weight_kg: 56, relationship_status: "single", want_children: "open", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "ethan.wright@myfilipinomatch-test.com",
    profile: { full_name: "Ethan Wright", gender: "male", age: 33, city: "Melbourne", country: "Australia", bio: "Pilot and adventure seeker ✈️ Looking for sunrise partners.", interests: ["flying", "adventure", "scuba", "photography"], relationship_intent: "marriage", education: "College", language: "English", user_type: "foreigner", avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400", photos: ["https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400"], height_cm: 181, weight_kg: 79, relationship_status: "single", want_children: "yes", relocation_intent: "open-to-discuss", international_preference: true },
  },
  {
    email: "denise.aquino@myfilipinomatch-test.com",
    profile: { full_name: "Denise Aquino", gender: "female", age: 31, city: "Manila", country: "Philippines", bio: "Entrepreneur and fashionista 👗 Building my dream business.", interests: ["fashion", "business", "coffee", "yoga"], relationship_intent: "long-term", education: "Masters", language: "English", user_type: "filipina", avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400", photos: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400"], height_cm: 168, weight_kg: 54, relationship_status: "single", want_children: "open", relocation_intent: "not-willing", international_preference: false },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const dummy of DUMMY_USERS) {
      // Check if user already exists by checking profiles with this email
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", dummy.email)
        .maybeSingle();

      if (existing) {
        results.push({ email: dummy.email, status: "skipped (already exists)" });
        continue;
      }

      // Create auth user with auto-confirm
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: dummy.email,
        password: "MyFilipinoMatch2024!",
        email_confirm: true,
        user_metadata: { full_name: dummy.profile.full_name },
      });

      if (authError) {
        // If user already exists in auth but not profiles, skip
        if (authError.message?.includes("already been registered")) {
          results.push({ email: dummy.email, status: "skipped (auth exists)" });
          continue;
        }
        results.push({ email: dummy.email, status: "error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Update the profile (trigger should have created it)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...dummy.profile,
          email: dummy.email,
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (profileError) {
        results.push({ email: dummy.email, status: "error", error: profileError.message });
      } else {
        results.push({ email: dummy.email, status: "created" });
      }
    }

    return new Response(JSON.stringify({ results }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
