import { useState, useEffect } from "react";
import { Heart, Shield, Globe, MessageSquare, Star, CheckCircle, ArrowRight, UserPlus, Search, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Rotating background images */}
        {heroImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Hero image ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === currentImage ? "opacity-100" : "opacity-0"
            }`}
            width={1920}
            height={1080}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/50 to-foreground/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/20" />

        <div className="container relative z-10 py-20">
          <div className="max-w-2xl animate-slide-up">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-display)' }}>
              Find Genuine Love
              <span className="block mt-2 text-primary-foreground/90">in the Philippines</span>
            </h1>
            <p className="mb-10 max-w-lg text-lg text-primary-foreground/85 md:text-xl leading-relaxed">
              Connect with verified Filipinos who are serious about long-term relationships and meaningful connections.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Create Your Free Account
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline" size="xl" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Sign In
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
                <p className="text-sm font-semibold text-primary-foreground">Join our community</p>
                <p className="text-xs text-primary-foreground/70">Verified members looking for real connections</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Why Choose <span className="text-gradient">FiloHeart</span>?
          </h2>
          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2">
            {/* Left: image */}
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img
                src={coupleCafe}
                alt="Couple enjoying conversation at a cafe"
                className="h-full w-full object-cover min-h-[300px]"
                loading="lazy"
                width={800}
                height={544}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-lg font-bold text-primary-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  Real connections start here
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">Built for people who are serious about love</p>
              </div>
            </div>

            {/* Right: checklist */}
            <div className="flex flex-col gap-4 justify-center">
              {[
                { title: "Verified Profiles", desc: "Every profile is reviewed to ensure real connections" },
                { title: "Serious Relationships Only", desc: "Built for long-term commitment, not casual swiping" },
                { title: "International Matching", desc: "Connect with people open to cross-cultural dating" },
                { title: "Safe Community", desc: "Report tools, active moderation, and privacy controls" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 transition-all hover:shadow-card">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <div className="mx-auto max-w-4xl grid gap-10 md:grid-cols-3">
            {[
              {
                icon: UserPlus,
                step: "1",
                title: "Create Your Profile",
                desc: "Sign up and share who you are, what you're looking for, and your relationship goals.",
              },
              {
                icon: Search,
                step: "2",
                title: "Discover Matches",
                desc: "Browse profiles based on your preferences and connect with people who match your intentions.",
              },
              {
                icon: MessagesSquare,
                step: "3",
                title: "Start Conversations",
                desc: "Chat with your matches and build real connections at your own pace.",
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

      {/* Member Showcase */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Meet Our Members
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Real people looking for genuine connections. Your match could be here.
          </p>
          <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { photo: mariaPhoto, name: "Maria", age: 26, country: "🇵🇭 Manila" },
              { photo: jamesPhoto, name: "James", age: 34, country: "🇺🇸 San Francisco" },
              { photo: anaPhoto, name: "Ana", age: 29, country: "🇵🇭 Cebu" },
              { photo: davidPhoto, name: "David", age: 41, country: "🇬🇧 London" },
              { photo: sofiaPhoto, name: "Sofia", age: 24, country: "🇵🇭 Davao" },
              { photo: kenjiPhoto, name: "Kenji", age: 37, country: "🇯🇵 Tokyo" },
            ].map((member) => (
              <div key={member.name} className="group text-center">
                <div className="relative mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-card transition-all group-hover:shadow-card-hover group-hover:-translate-y-1">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={200}
                    height={267}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-bold text-primary-foreground">{member.name}, {member.age}</p>
                    <p className="text-[11px] text-primary-foreground/70">{member.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/signup">
              <Button variant="hero" size="lg">
                Join Now — It's Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Globe,
                title: "International Matching",
                desc: "Meet Filipinos open to serious relationships with foreign partners",
              },
              {
                icon: Shield,
                title: "Verified Profiles",
                desc: "We prioritize safety and authenticity",
              },
              {
                icon: MessageSquare,
                title: "Private Messaging",
                desc: "Connect only with matched users",
              },
              {
                icon: Star,
                title: "Premium Features",
                desc: "Unlock more visibility and communication tools",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex rounded-xl gradient-hero p-3">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section with image */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-2 items-center">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                Your Safety Comes First
              </h2>
              <p className="mb-8 text-muted-foreground">
                We are committed to creating a safe and trustworthy environment for everyone.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  "Profile verification system",
                  "Report and block features",
                  "Active moderation to prevent scams",
                  "Privacy controls for your data",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
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

      {/* Final CTA */}
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
              Ready to Find Something Real?
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-lg text-primary-foreground/80">
              Join a growing community focused on genuine connections and meaningful relationships.
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

      <Footer />
    </div>
  );
};

export default Landing;