import { useState, useEffect } from "react";
import { detectContactInfo } from "@/lib/contactFilter";
import { useNavigate } from "react-router-dom";
import { Heart, Globe, MapPin, User, Camera, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";

const TOTAL_STEPS = 8;

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Japan", "South Korea", "Netherlands", "Sweden", "Norway", "Denmark",
  "Switzerland", "Italy", "Spain", "New Zealand", "Singapore", "Other",
];

const INTEREST_OPTIONS = [
  "Travel", "Cooking", "Music", "Movies", "Fitness", "Reading",
  "Photography", "Art", "Dancing", "Gaming", "Nature", "Food",
  "Fashion", "Sports", "Technology", "Pets", "Volunteering", "Languages",
];

const GENDER_OPTIONS = ["Male", "Female"];

const EDUCATION_OPTIONS = [
  "High School", "Vocational", "Associate Degree", "Bachelor's Degree",
  "Master's Degree", "Doctorate", "Other",
];

const LANGUAGE_OPTIONS = [
  "English", "Filipino/Tagalog", "Cebuano", "Ilocano", "Japanese",
  "Korean", "Chinese", "Spanish", "French", "German", "Other",
];

const CHILDREN_OPTIONS = [
  { value: "want", label: "Yes, I want children" },
  { value: "dont-want", label: "No, I don't want children" },
  { value: "have-and-want-more", label: "I have children and want more" },
  { value: "have-and-done", label: "I have children and don't want more" },
  { value: "unsure", label: "Not sure yet" },
];

const STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
  { value: "annulled", label: "Annulled" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 2
  const [userType, setUserType] = useState("");
  // Step 3
  const [relationshipIntent, setRelationshipIntent] = useState("");
  // Step 4
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  // Step 5
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  // Step 6 - NEW: Personal Details
  const [education, setEducation] = useState("");
  const [language, setLanguage] = useState("");
  const [wantChildren, setWantChildren] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  // Step 7
  const [internationalPref, setInternationalPref] = useState("");
  // Step 8
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
      case 1: return true;
      case 2: return !!userType;
      case 3: return !!relationshipIntent;
      case 4: return userType === "foreigner" ? !!country : !!city;
      case 5: return !!fullName.trim() && !!age && parseInt(age) >= 18 && !!gender;
      case 6: return !!relationshipStatus;
      case 7: return !!internationalPref;
      case 8: return photos.length >= 1;
      default: return false;
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileData: Record<string, unknown> = {
        user_type: userType,
        relationship_intent: relationshipIntent,
        country: userType === "foreigner" ? country : "Philippines",
        city: userType === "philippines" ? city : null,
        full_name: fullName.trim(),
        age: parseInt(age),
        gender: gender.toLowerCase(),
        bio: bio.trim(),
        interests,
        education: education || null,
        language: language || null,
        want_children: wantChildren || null,
        height_cm: heightCm ? parseInt(heightCm) : null,
        weight_kg: weightKg ? parseInt(weightKg) : null,
        relationship_status: relationshipStatus || null,
        international_preference: internationalPref === "yes",
        relocation_intent: internationalPref === "yes" ? "open-to-discuss" : "not-willing",
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
    if (step < TOTAL_STEPS) setStep(step + 1);
    else saveProfile();
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 8 ? [...prev, interest] : prev
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-xs font-medium text-primary">{progress}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg animate-scale-in">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-hero">
                <Heart className="h-10 w-10 text-primary-foreground fill-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold font-display">Welcome to MyFilipinoMatch</h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                Let's set up your profile so you can start connecting with genuine people. This takes about 3 minutes.
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4 text-secondary" /> All profiles are reviewed</span>
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4 text-secondary" /> Built for serious relationships</span>
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4 text-secondary" /> Safe and respectful community</span>
              </div>
            </div>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Globe className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Tell us about yourself</h2>
                <p className="text-muted-foreground">This helps us personalize your experience</p>
              </div>
              <RadioGroup value={userType} onValueChange={setUserType} className="grid gap-3">
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${userType === "foreigner" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="foreigner" />
                  <div>
                    <p className="font-semibold">I am a Foreigner</p>
                    <p className="text-sm text-muted-foreground">Looking to connect with someone in the Philippines</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${userType === "philippines" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="philippines" />
                  <div>
                    <p className="font-semibold">I am based in the Philippines</p>
                    <p className="text-sm text-muted-foreground">Open to local or international connections</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Relationship Intent */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Heart className="h-10 w-10 text-primary mx-auto fill-primary" />
                <h2 className="text-2xl font-bold font-display">What are you looking for?</h2>
                <p className="text-muted-foreground">We focus on meaningful, lasting relationships</p>
              </div>
              <RadioGroup value={relationshipIntent} onValueChange={setRelationshipIntent} className="grid gap-3">
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${relationshipIntent === "long-term" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="long-term" />
                  <div>
                    <p className="font-semibold">Long-term Relationship</p>
                    <p className="text-sm text-muted-foreground">Looking for a committed, serious partner</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${relationshipIntent === "marriage" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="marriage" />
                  <div>
                    <p className="font-semibold">Marriage</p>
                    <p className="text-sm text-muted-foreground">Ready to find my life partner</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <MapPin className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Where are you located?</h2>
                <p className="text-muted-foreground">
                  {userType === "foreigner" ? "Select your country" : "Tell us your city in the Philippines"}
                </p>
              </div>
              {userType === "foreigner" ? (
                <div className="space-y-2">
                  <Label>Country</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCountry(c)}
                        className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${country === c ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Manila, Cebu, Davao"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-base"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Profile Details */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <User className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Your Profile</h2>
                <p className="text-muted-foreground">Tell potential matches about yourself</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age *</Label>
                  <Input id="age" type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender *</Label>
                  <div className="flex gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${gender === g ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about yourself..." maxLength={300} rows={3} className="text-base resize-none" />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>

              <div className="space-y-2">
                <Label>Interests (pick up to 8)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer text-sm px-3 py-1.5 transition-all ${interests.includes(interest) ? "bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary"}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Personal Details (NEW) */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <Ruler className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Personal Details</h2>
                <p className="text-muted-foreground">Help matches know you better</p>
              </div>

              <div className="space-y-1.5">
                <Label>Relationship Status *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setRelationshipStatus(s.value)}
                      className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${relationshipStatus === s.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Education</Label>
                <Select value={education} onValueChange={setEducation}>
                  <SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Select primary language" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Want Children?</Label>
                <Select value={wantChildren} onValueChange={setWantChildren}>
                  <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    {CHILDREN_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="165" className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" min={30} max={300} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="60" className="text-base" />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: International Preference */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Globe className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">International Relationships</h2>
                <p className="text-muted-foreground">Are you open to connecting across borders?</p>
              </div>
              <RadioGroup value={internationalPref} onValueChange={setInternationalPref} className="grid gap-3">
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${internationalPref === "yes" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="yes" />
                  <div>
                    <p className="font-semibold">Yes, I'm open</p>
                    <p className="text-sm text-muted-foreground">I'd love to meet someone from another country</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${internationalPref === "no" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value="no" />
                  <div>
                    <p className="font-semibold">No, local only</p>
                    <p className="text-sm text-muted-foreground">I prefer to meet people nearby</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 8: Photo Upload */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Camera className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-bold font-display">Add Your Photos</h2>
                <p className="text-muted-foreground">At least 1 photo is required. Profiles with photos get 10× more matches!</p>
              </div>
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={6} />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button variant="outline" size="lg" onClick={back} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            <Button
              variant="hero"
              size="lg"
              onClick={next}
              disabled={!canProceed() || saving}
              className="flex-1"
            >
              {saving ? (
                "Saving..."
              ) : step === TOTAL_STEPS ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Complete Profile
                </>
              ) : step === 1 ? (
                "Let's Get Started"
              ) : (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
