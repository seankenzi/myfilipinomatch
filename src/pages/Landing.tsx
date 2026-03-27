import { Heart, Shield, Globe, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import coupleImg from "@/assets/couple-1.jpg";
import profile1 from "@/assets/profile-1.jpg";
import profile3 from "@/assets/profile-3.jpg";

const features = [
  {
    icon: Globe,
    title: "International Matching",
    description: "Connect with Filipino singles from anywhere in the world. Our platform bridges distances for meaningful relationships.",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "Every profile goes through verification. Feel safe knowing the person you're talking to is genuine.",
  },
  {
    icon: Heart,
    title: "Serious Relationships",
    description: "No casual swiping. We focus on long-term connections, marriage, and building a life together.",
  },
  {
    icon: Users,
    title: "Cultural Bridge",
    description: "Learn about Filipino culture, traditions, and values while finding your perfect partner.",
  },
];

const testimonials = [
  {
    name: "Maria & James",
    image: coupleImg,
    text: "We met on FilipinoLove and after 6 months of chatting, James flew to Manila. Now we're happily married!",
    location: "Cebu & London",
  },
];

const Landing = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Beautiful Philippine sunset"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="max-w-xl animate-slide-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Heart className="h-4 w-4 fill-current" />
              Trusted by 10,000+ couples
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Find Your Filipino
              <span className="block text-accent"> Soulmate</span>
            </h1>
            <p className="mb-8 max-w-md text-lg text-primary-foreground/80">
              The most trusted platform connecting foreigners with Filipino
              singles for serious, long-term relationships and marriage.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Start Your Journey
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Browse Profiles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-border bg-card py-6">
        <div className="container flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {["Profile Verification", "Safe Messaging", "24/7 Support", "Success Stories"].map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Why Choose <span className="text-gradient">FilipinoLove</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              We're not just another dating app. We're building bridges between
              cultures for genuine, lasting connections.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex rounded-xl gradient-hero p-3">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="gradient-warm py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Real Love Stories
            </h2>
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col items-center gap-8 rounded-3xl bg-card p-8 shadow-elevated md:flex-row"
              >
                <img
                  src={t.image}
                  alt={t.name}
                  loading="lazy"
                  width={640}
                  height={800}
                  className="h-64 w-64 rounded-2xl object-cover"
                />
                <div>
                  <p className="mb-4 text-lg italic text-muted-foreground">
                    "{t.text}"
                  </p>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Profiles */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Meet Amazing <span className="text-gradient">Singles</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              { img: profile1, name: "Maria", age: 26, city: "Manila", intent: "Long-term" },
              { img: profile3, name: "Jasmine", age: 24, city: "Cebu", intent: "Marriage" },
              { img: profile1, name: "Anna", age: 28, city: "Davao", intent: "Long-term" },
            ].map((p, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1">
                <img src={p.img} alt={p.name} loading="lazy" className="h-80 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-foreground">{p.name}, {p.age}</h3>
                      <p className="text-sm text-primary-foreground/70">{p.city}, Philippines</p>
                    </div>
                    <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground">
                      {p.intent}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/signup">
              <Button variant="hero" size="lg">
                Join Free Today
                <ArrowRight className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <span className="text-lg font-display font-bold">FilipinoLove</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Safety</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 FilipinoLove. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
