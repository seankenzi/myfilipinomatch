import { Heart, Shield, Globe, MessageSquare, Star, CheckCircle, ArrowRight, UserPlus, Search, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(0_0%_100%/0.15)_0%,_transparent_60%)]" />
        <div className="container relative z-10 py-20">
          <div className="mx-auto max-w-3xl text-center animate-slide-up">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Find Genuine Relationships
              <span className="block mt-2 text-primary-foreground/90">in the Philippines</span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-primary-foreground/80 md:text-xl">
              Connect with verified Filipinos who are serious about long-term relationships and meaningful connections.
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

      {/* Trust Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Why Choose <span className="text-gradient">Pinoy Bridge Love</span>?
          </h2>
          <div className="mx-auto max-w-3xl grid gap-5 sm:grid-cols-2">
            {[
              "Verified profiles to ensure real connections",
              "Built for serious relationships, not casual swiping",
              "Connect with people open to international dating",
              "Safe and respectful community",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-5">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
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
                title: "Start Meaningful Conversations",
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

      {/* Features Section */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
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

      {/* Safety Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
              <Shield className="h-7 w-7 text-secondary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Your Safety Comes First
            </h2>
            <p className="mb-8 text-muted-foreground">
              We are committed to creating a safe and trustworthy environment.
            </p>
            <div className="flex flex-col items-center gap-4">
              {[
                "Profile verification system",
                "Report and block features",
                "Active moderation to prevent scams",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-5xl">
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

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <span className="text-lg font-display font-bold text-foreground">Pinoy Bridge Love</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Safety</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Pinoy Bridge Love. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
