import { useState, useEffect } from "react";
import { detectContactInfo } from "@/lib/contactFilter";
import { Camera, Edit, Shield, MapPin, Heart, Globe, Settings, LogOut, Crown, Save } from "lucide-react";
import ProfileCompletion from "@/components/ProfileCompletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PhotoUpload from "@/components/PhotoUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSignedPhoto } from "@/hooks/useSignedPhotos";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    age: null as number | null,
    gender: "",
    country: "",
    city: "",
    bio: "",
    interests: [] as string[],
    relationship_intent: "",
    relocation_intent: "",
    photos: [] as string[],
    avatar_url: "",
    is_verified: false,
    is_premium: false,
  });

  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        age: data.age,
        gender: data.gender || "",
        country: data.country || "",
        city: data.city || "",
        bio: data.bio || "",
        interests: (data.interests as string[]) || [],
        relationship_intent: data.relationship_intent || "",
        relocation_intent: data.relocation_intent || "",
        photos: (data.photos as string[]) || [],
        avatar_url: data.avatar_url || "",
        is_verified: data.is_verified || false,
        is_premium: data.is_premium || false,
      });
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    const bioContact = detectContactInfo(profile.bio);
    if (bioContact) {
      toast({ title: "Contact info not allowed", description: `Your bio contains ${bioContact}. Please remove it.`, variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      age: profile.age,
      gender: profile.gender || null,
      country: profile.country || null,
      city: profile.city || null,
      bio: profile.bio,
      interests: profile.interests,
      relationship_intent: profile.relationship_intent || null,
      relocation_intent: profile.relocation_intent || null,
    }).eq("id", user.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
      setEditing(false);
    }
    setSaving(false);
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !profile.interests.includes(trimmed)) {
      setProfile({ ...profile, interests: [...profile.interests, trimmed] });
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const rawAvatarUrl = profile.photos[0] || profile.avatar_url;
  const avatarUrl = useSignedPhoto(rawAvatarUrl || null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-lg">
          {/* Profile Header */}
          <div className="relative mb-6">
            <div className="relative mx-auto h-32 w-32">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${profile.full_name} profile photo`} loading="lazy" className="h-full w-full rounded-full object-cover border-4 border-card shadow-elevated" />
              ) : (
                <div className="h-full w-full rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-elevated">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-bold">
                  {profile.full_name || "Complete your profile"}{profile.age ? `, ${profile.age}` : ""}
                </h1>
                {profile.is_verified && <Shield className="h-5 w-5 text-secondary fill-secondary/30" />}
              </div>
              {(profile.city || profile.country) && (
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>


          {/* Profile Completion */}
          <ProfileCompletion profile={profile} onEditClick={() => setEditing(true)} />

          {/* Photos */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-semibold">My Photos</h2>
            <PhotoUpload photos={profile.photos} onPhotosChange={(photos) => setProfile({ ...profile, photos, avatar_url: photos[0] || "" })} />
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { icon: Heart, label: "Intent", value: profile.relationship_intent ? profile.relationship_intent.replace("-", " ") : "Not set" },
              { icon: Globe, label: "Relocate", value: profile.relocation_intent ? profile.relocation_intent.replace(/-/g, " ") : "Not set" },
              { icon: Shield, label: "Verified", value: profile.is_verified ? "Yes" : "No" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
                <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Editable Profile Section */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">About Me</h2>
              <button onClick={() => setEditing(!editing)} className="text-primary p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors">
                <Edit className="h-5 w-5" />
              </button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Age</Label>
                    <Input type="number" value={profile.age || ""} onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Country</Label>
                    <Input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                </div>

                <div>
                  <Label className="text-xs">Bio</Label>
                  <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
                </div>

                <div>
                  <Label className="text-xs">Relationship Intent</Label>
                  <Select value={profile.relationship_intent} onValueChange={(v) => setProfile({ ...profile, relationship_intent: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long-term">Long-term</SelectItem>
                      <SelectItem value="marriage">Marriage</SelectItem>
                      <SelectItem value="serious-dating">Serious Dating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Relocation Intent</Label>
                  <Select value={profile.relocation_intent} onValueChange={(v) => setProfile({ ...profile, relocation_intent: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="willing-to-move">Willing to move</SelectItem>
                      <SelectItem value="planning-to-visit">Planning to visit</SelectItem>
                      <SelectItem value="open-to-discuss">Open to discuss</SelectItem>
                      <SelectItem value="not-willing">Not willing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Interests */}
                <div>
                  <Label className="text-xs">Interests</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      placeholder="Add an interest"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={addInterest}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {interest}
                        <button onClick={() => removeInterest(interest)} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full min-h-[48px]" variant="hero">
                  {saving ? <><span className="animate-spin mr-2">⏳</span>Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Profile</>}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio || "Tap the edit icon to tell others about yourself."}
              </p>
            )}
          </div>

          {/* Interests (view mode) */}
          {!editing && profile.interests.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-3 font-semibold">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span key={interest} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification CTA */}
          {!profile.is_verified && (
            <div className="mb-6 rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-secondary" />
                <h2 className="font-semibold">Verify Your Profile</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Verified profiles get up to 3x more matches. Show others you're real and serious.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate("/verification")} className="border-secondary text-secondary hover:bg-secondary/10 min-h-[44px] px-5">
                Get Verified
              </Button>
            </div>
          )}

          {/* Premium CTA */}
          {!profile.is_premium && (
            <div className="mb-6 rounded-2xl gradient-hero p-5 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5" />
                <h2 className="font-semibold">Go Premium</h2>
              </div>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Unlock unlimited messaging, see who liked you, and boost your profile visibility.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate("/premium")} className="min-h-[44px] px-5">Upgrade Now</Button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium shadow-card transition-all hover:shadow-card-hover min-h-[52px] active:scale-[0.98]">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium text-destructive shadow-card transition-all hover:shadow-card-hover min-h-[52px] active:scale-[0.98]"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
