import { useState, useEffect } from "react";
import { Heart, Shield, Globe, MessageSquare, Star, CheckCircle, ArrowRight, UserPlus, Search, MessagesSquare, ShieldCheck, Ban, Lock, Video, Eye, BadgeCheck, Users, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroCouple from "@/assets/hero-couple.jpg";
import heroCouple2 from "@/assets/hero-couple-2.jpg";
import heroCouple3 from "@/assets/hero-couple-3.jpg";
import coupleCafe from "@/assets/couple-cafe.jpg";
import coupleGarden from "@/assets/couple-garden.jpg";
import mariaPhoto from "@/assets/test-profiles/maria.jpg";
import jamesPhoto from "@/assets/test-profiles/james.jpg";
import anaPhoto from "@/assets/test-profiles/ana.jpg";
import davidPhoto from "@/assets/test-profiles/david.jpg";
import sofiaPhoto from "@/assets/test-profiles/sofia.jpg";
import kenjiPhoto from "@/assets/test-profiles/kenji.jpg";

const heroImages = [heroCouple, heroCouple2, heroCouple3];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {heroImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Happy interracial couple ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === currentImage ? "opacity-100" : "opacity-0"
            }`}
            width={1920}
            height={1080}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/55 to-foreground/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/20" />

        <div className="container relative z-10 py-20">
          <div className="max-w-2xl animate-slide-up">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-display)' }}>
              Find a Real Filipina Relationship
              <span className="block mt-2 text-primary-foreground/90 text-3xl md:text-4xl lg:text-5xl">— Not Fake Profiles</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-primary-foreground/85 md:text-xl leading-relaxed">
              Join a trusted platform where foreign men meet verified Filipinas ready for genuine, long-term connections.
            </p>

            <div className="mb-10 flex flex-col gap-2">
              {[
                { icon: BadgeCheck, text: "Verified Filipina profiles (ID + selfie checked)" },
                { icon: Ban, text: "No bots. No fake accounts." },
                { icon: Users, text: "Real conversations with real people" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="h-4.5 w-4.5 text-secondary flex-shrink-0" />
                  <span className="text-sm text-primary-foreground/90 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Create Free Account
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="hero-outline" size="xl" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Browse Verified Profiles
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[mariaPhoto, jamesPhoto, anaPhoto, kenjiPhoto].map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt="Member"
                    className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover"
                    loading="lazy"
                    width={40}
                    height={40}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Join our growing community</p>
                <p className="text-xs text-primary-foreground/70">Verified members looking for real connections</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-md mx-auto">
            Three simple steps to finding your match
          </p>
          <div className="mx-auto max-w-4xl grid gap-10 md:grid-cols-3">
            {[
              {
                icon: UserPlus,
                step: "1",
                title: "Create Your Free Account",
                desc: "Sign up in seconds and set up your profile.",
              },
              {
                icon: Search,
                step: "2",
                title: "Browse Verified Filipinas",
                desc: "Every profile is reviewed to ensure authenticity.",
              },
              {
                icon: MessagesSquare,
                step: "3",
                title: "Start Real Conversations",
                desc: "Chat, connect, and build something meaningful.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero shadow-card transition-transform group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {step}</span>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY FILOHEART IS DIFFERENT ===== */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Why <span className="text-gradient">MyFilipinoMatch</span> Is Different
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            We're built for real relationships — not empty promises
          </p>
          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "100% Profile Verification",
                desc: "We manually review profiles to reduce fake accounts.",
              },
              {
                icon: Ban,
                title: "No Pay-Per-Message Traps",
                desc: "We focus on real relationships — not draining your wallet.",
              },
              {
                icon: Heart,
                title: "Built for Serious Connections",
                desc: "This is not a hookup site. Members are relationship-focused.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border bg-background shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-xl gradient-hero p-3">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            What Our Members Say
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Real stories from real people
          </p>
          <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "I met my partner here after trying many sites. Finally, something real.",
                name: "Mark",
                location: "USA",
                photo: jamesPhoto,
              },
              {
                quote: "I felt safe and respected. The platform is different from others.",
                name: "Ana",
                location: "Philippines",
                photo: anaPhoto,
              },
              {
                quote: "The verification process gave me confidence that profiles are genuine.",
                name: "David",
                location: "UK",
                photo: davidPhoto,
              },
            ].map((t) => (
              <Card key={t.name} className="border-border bg-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
                      loading="lazy"
                      width={48}
                      height={48}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST & SAFETY ===== */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-2 items-center">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                Safe, Secure, and Built for Real Connections
              </h2>
              <p className="mb-8 text-muted-foreground">
                Your safety is our top priority. We invest in keeping our community trustworthy.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: Users, text: "Active moderation team" },
                  { icon: AlertTriangle, text: "Report & block system" },
                  { icon: Lock, text: "Secure messaging" },
                  { icon: Eye, text: "Privacy controls for your data" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img
                src={coupleGarden}
                alt="Happy couple in a tropical garden"
                className="h-full w-full object-cover min-h-[350px]"
                loading="lazy"
                width={800}
                height={544}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING / FREE VS PREMIUM ===== */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Start for Free. Upgrade Anytime.
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            No pressure. Explore at your own pace.
          </p>
          <div className="mx-auto max-w-3xl grid gap-6 md:grid-cols-2">
            {/* Free */}
            <Card className="border-border bg-card shadow-card">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
                <p className="text-sm text-muted-foreground mb-6">Get started at no cost</p>
                <ul className="flex flex-col gap-3">
                  {[
                    "Account creation",
                    "Profile browsing",
                    "Limited messaging",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="block mt-8">
                  <Button variant="outline" size="lg" className="w-full">
                    Create Free Account
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-primary/30 bg-card shadow-card-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">Premium</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Popular</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">For those serious about finding love</p>
                <ul className="flex flex-col gap-3">
                  {[
                    "Unlimited messaging",
                    "Video calls",
                    "Priority visibility",
                    "See who liked you",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/premium" className="block mt-8">
                  <Button variant="hero" size="lg" className="w-full">
                    ❤️ Upgrade to Annual
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 overflow-hidden">
        <img
          src={heroCouple}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Stop wasting time on fake profiles.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-lg text-primary-foreground/80">
              Start your real connection today.
            </p>
            <Link to="/signup">
              <Button variant="default" size="xl" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold shadow-elevated">
                Create Your Free Account
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
