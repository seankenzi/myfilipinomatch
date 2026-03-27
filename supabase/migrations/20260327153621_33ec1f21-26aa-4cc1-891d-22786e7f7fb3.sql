UPDATE public.profiles SET 
  age = 28,
  gender = 'female',
  country = 'United States',
  city = 'New York',
  bio = 'Love traveling and exploring new cultures.',
  interests = ARRAY['Travel', 'Music'],
  relationship_intent = 'marriage',
  relocation_intent = 'open-to-discuss',
  user_type = 'foreigner',
  onboarding_completed = true,
  avatar_url = 'https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/profile-photos/aad78351-7cf8-420b-9580-d4f8aa529d51/1774624134449.jpg',
  photos = ARRAY['https://qxxehbdtfxbapxanqefv.supabase.co/storage/v1/object/public/profile-photos/aad78351-7cf8-420b-9580-d4f8aa529d51/1774624134449.jpg']
WHERE id = '106c626a-5162-4576-a149-7907a0608a8b';