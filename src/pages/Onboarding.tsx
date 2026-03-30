import { useState, useEffect, useMemo } from "react";
import { detectContactInfo } from "@/lib/contactFilter";
import { useNavigate } from "react-router-dom";
import { Heart, Globe, MapPin, User, Camera, Shield, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";

const TOTAL_STEPS = 8;

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const PH_CITIES = [
  "Metro Manila", "Cebu City", "Davao City", "Quezon City", "Makati",
  "Taguig", "Pasig", "Zamboanga", "Cagayan de Oro", "Iloilo City",
  "Bacolod", "General Santos", "Other",
];

const INTERESTS = [
  "Travel ✈️", "Cooking 🍳", "Music 🎵", "Movies 🎬", "Fitness 💪",
  "Reading 📚", "Photography 📷", "Dancing 💃", "Gaming 🎮", "Art 🎨",
  "Nature 🌿", "Beach 🏖️", "Food 🍕", "Sports ⚽", "Fashion 👗",
  "Pets 🐾", "Hiking 🥾", "Yoga 🧘", "Coffee ☕", "Karaoke 🎤",
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1: Identity
  const [userType, setUserType] = useState("");
  // Step 2: Intent
  const [relationshipIntent, setRelationshipIntent] = useState("");
  // Step 3: Location
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  // Step 4: Basic Profile
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  // Step 5: Bio
  const [bio, setBio] = useState("");
  // Step 6: Interests & Partner Preferences
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredAgeRange, setPreferredAgeRange] = useState<[number, number]>([18, 65]);
  // Step 7: Photos
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    const syncOnboardingStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (data?.onboarding_completed) {
        navigate("/discover", { replace: true });
        return;
      }

      const meta = user.user_metadata;
      if (meta?.full_name) setFullName(meta.full_name);
    };

    void syncOnboardingStatus();
  }, [user, loading, navigate]);

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!userType;
      case 2: return !!relationshipIntent;
      case 3: return userType === "foreigner" ? !!country : !!city;
      case 4: return !!fullName.trim() && !!age && parseInt(age) >= 18 && !!gender;
      case 5: return true; // bio is optional
      case 6: return interests.length >= 3;
      case 7: return photos.length >= 1;
      case 8: return true; // verification prompt
      default: return false;
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10
        ? [...prev, interest]
        : prev
    );
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const bioContact = detectContactInfo(bio.trim());
      if (bioContact) {
        toast({ title: "Contact info not allowed", description: `Your bio contains ${bioContact}. Please remove it.`, variant: "destructive" });
        setSaving(false);
        return;
      }
      const profileData: Record<string, unknown> = {
        user_type: userType,
        relationship_intent: relationshipIntent,
        country: userType === "foreigner" ? country : "Philippines",
        city: userType === "philippines" ? city : null,
        full_name: fullName.trim(),
        age: parseInt(age),
        gender,
        bio: bio.trim(),
        interests,
        preferred_min_age: preferredAgeRange[0],
        preferred_max_age: preferredAgeRange[1],
        international_preference: true,
        relocation_intent: "open-to-discuss",
        photos,
        avatar_url: photos[0] || null,
        onboarding_completed: true,
      };

      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile complete! 🎉", description: "Welcome to MyFilipinoMatch." });
      navigate("/discover");
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS) { setDirection(1); setStep(step + 1); }
    else saveProfile();
  };

  const back = () => {
    if (step > 1) { setDirection(-1); setStep(step - 1); }
  };

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const handleVerifyNow = async () => {
    await saveProfile();
    navigate("/verification");
  };

  const stepLabels = ["Identity", "Intent", "Location", "Profile", "Bio", "Interests", "Photos", "Verify"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</span>
            <span className="text-xs font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i + 1 <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 overflow-hidden">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Globe className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">I am a:</h2>
                <p className="text-sm text-muted-foreground">This helps us match you with the right people</p>
              </div>
              <RadioGroup value={userType} onValueChange={setUserType} className="grid gap-3">
                <label className={`flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${userType === "foreigner" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="foreigner" />
                  <div>
                    <p className="font-semibold text-lg">🌍 Foreigner</p>
                    <p className="text-sm text-muted-foreground">Looking to connect with someone in the Philippines</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${userType === "philippines" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="philippines" />
                  <div>
                    <p className="font-semibold text-lg">🇵🇭 Based in the Philippines</p>
                    <p className="text-sm text-muted-foreground">Open to meeting international partners</p>
                  </div>
                </label>
              </RadioGroup>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-secondary" />
                Your information is safe and never shared publicly
              </p>
            </div>
          )}

          {/* Step 2: Intent */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Heart className="h-10 w-10 text-primary mx-auto fill-primary" />
                <h2 className="text-2xl font-bold font-display">What are you looking for?</h2>
                <p className="text-sm text-muted-foreground">We're built for serious connections only</p>
              </div>
              <RadioGroup value={relationshipIntent} onValueChange={setRelationshipIntent} className="grid gap-3">
                <label className={`flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${relationshipIntent === "long-term" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="long-term" />
                  <div>
                    <p className="font-semibold text-lg">💕 Serious Relationship</p>
                    <p className="text-sm text-muted-foreground">Looking for a committed, long-term partner</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${relationshipIntent === "marriage" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="marriage" />
                  <div>
                    <p className="font-semibold text-lg">💍 Marriage</p>
                    <p className="text-sm text-muted-foreground">Ready to find my life partner</p>
                  </div>
                </label>
              </RadioGroup>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                No fake accounts — every profile is reviewed
              </p>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <MapPin className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">
                  {userType === "foreigner" ? "Where are you from?" : "What city are you in?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userType === "foreigner" ? "Select your country" : "Select or type your city"}
                </p>
              </div>
              {userType === "foreigner" ? (
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={countryOpen} className="w-full text-base h-12 rounded-xl justify-between font-normal">
                      {country || "Select your country..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {COUNTRIES.map((c) => (
                            <CommandItem key={c} value={c} onSelect={(val) => { setCountry(val); setCountryOpen(false); }} className={country === c ? "bg-primary/10" : ""}>
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {PH_CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${city === c ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {city === "Other" && (
                    <Input
                      placeholder="Type your city..."
                      value=""
                      onChange={(e) => setCity(e.target.value)}
                      className="text-base"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Basic Profile with Gender */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <User className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Tell us about yourself</h2>
                <p className="text-sm text-muted-foreground">Just the basics to get started</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="text-base h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age *</Label>
                  <Input id="age" type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Must be 18+" className="text-base h-12" />
                  {age && parseInt(age) < 18 && (
                    <p className="text-xs text-destructive">You must be at least 18 years old</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Gender *</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-3 gap-2">
                    {[
                      { value: "male", label: "👨 Male" },
                      { value: "female", label: "👩 Female" },
                      { value: "other", label: "🌈 Other" },
                    ].map((g) => (
                      <label
                        key={g.value}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 cursor-pointer text-sm font-medium transition-all ${
                          gender === g.value
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <RadioGroupItem value={g.value} className="sr-only" />
                        {g.label}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-secondary" />
                You can update your profile anytime
              </p>
            </div>
          )}

          {/* Step 5: Bio */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <Sparkles className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Write a short bio</h2>
                <p className="text-sm text-muted-foreground">Help others get to know you — you can skip this for now</p>
              </div>

              <div className="space-y-1.5">
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A few words about yourself... What makes you unique? What are you passionate about?"
                  maxLength={300}
                  rows={5}
                  className="text-base resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">💡 <span className="font-medium text-foreground">Tip:</span> Profiles with a bio get 5× more messages. Share your hobbies, what you're looking for, or a fun fact!</p>
              </div>
            </div>
          )}

          {/* Step 6: Interests & Partner Age Preference */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <Users className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Interests & Preferences</h2>
                <p className="text-sm text-muted-foreground">Pick at least 3 interests and your preferred partner age range</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Interests * <span className="text-muted-foreground font-normal">({interests.length}/10 selected)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                          interests.includes(interest)
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  {interests.length < 3 && (
                    <p className="text-xs text-muted-foreground">Select at least {3 - interests.length} more</p>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Preferred Partner Age Range</Label>
                  <div className="px-2">
                    <Slider
                      value={preferredAgeRange}
                      onValueChange={(val) => setPreferredAgeRange(val as [number, number])}
                      min={18}
                      max={80}
                      step={1}
                      minStepsBetweenThumbs={3}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="rounded-lg border border-border bg-card px-3 py-1 font-medium">{preferredAgeRange[0]} yrs</span>
                    <span className="text-muted-foreground">to</span>
                    <span className="rounded-lg border border-border bg-card px-3 py-1 font-medium">{preferredAgeRange[1]} yrs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Photo Upload */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Camera className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Add Your Photo</h2>
                <p className="text-muted-foreground">Profiles with photos get <span className="font-semibold text-foreground">10× more matches</span></p>
              </div>
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={6} />
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">📸 At least 1 photo is required. Use a clear, recent photo of yourself.</p>
              </div>
            </div>
          )}

          {/* Step 8: Verification Prompt */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
                  <Shield className="h-10 w-10 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold font-display">Get Verified ✓</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Verified members get <span className="font-semibold text-foreground">3× more replies</span>. It takes less than a minute.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Build trust instantly</p>
                    <p className="text-xs text-muted-foreground">Show others you're a real person</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Get a verified badge</p>
                    <p className="text-xs text-muted-foreground">Stand out with the ✓ badge on your profile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">More matches & replies</p>
                    <p className="text-xs text-muted-foreground">Verified profiles get significantly more engagement</p>
                  </div>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleVerifyNow}
                disabled={saving}
              >
                <Shield className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Verify Now"}
              </Button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button variant="outline" size="lg" onClick={back} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                variant="hero"
                size="lg"
                onClick={next}
                disabled={!canProceed()}
                className="flex-1"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => saveProfile()}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Skip for Now"}
              </Button>
            )}
          </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
