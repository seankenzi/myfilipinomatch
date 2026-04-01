import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import {
  Shield, Eye, Lock, AlertTriangle, CheckCircle, ShieldCheck,
  UserCheck, MessageSquareWarning, KeyRound, Globe, Heart,
  FileCheck, BadgeCheck, Scale, Fingerprint, ServerCrash, Camera,
  Download, Trash2, Cookie, ClipboardCheck,
} from "lucide-react";

/* ── Section wrapper ── */
const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`py-10 first:pt-0 ${className}`}>{children}</section>
);

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="rounded-xl bg-secondary/10 p-2.5">
      <Icon className="h-5 w-5 text-secondary" />
    </div>
    <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{children}</h2>
  </div>
);

/* ── Feature card ── */
const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md">
    <div className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 p-2">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground mb-1 text-[15px]">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

/* ── Certification badge ── */
const CertBadge = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 shadow-card">
    <div className="rounded-full bg-secondary/10 p-3 mb-3">
      <BadgeCheck className="h-6 w-6 text-secondary" />
    </div>
    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

/* ── Stat card ── */
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center rounded-2xl bg-primary/5 p-5">
    <span className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{value}</span>
    <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
  </div>
);

const Safety = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Trust & Safety | MyFilipinoMatch"
        description="Learn how MyFilipinoMatch protects members with profile verification, advanced moderation, encrypted messaging, and strict privacy commitments."
        canonical="/safety"
      />
      <Navbar />

      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-4xl">

          {/* ── Hero ── */}
          <div className="text-center mb-12">
            <div className="mx-auto mb-5 inline-flex rounded-full bg-secondary/10 p-4">
              <ShieldCheck className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Trust & Safety Center
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your safety is more than a feature — it's the foundation of everything we build. Here's how we earn and keep your trust every day.
            </p>
          </div>

          {/* ── Trust stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            <StatCard value="100%" label="Manual profile review" />
            <StatCard value="24/7" label="Active moderation" />
            <StatCard value="SSL" label="Encrypted connections" />
            <StatCard value="Zero" label="Data sold to third parties" />
          </div>

          <div className="divide-y divide-border">

            {/* ── Security certifications ── */}
            <Section>
              <SectionTitle icon={FileCheck}>How We Protect You</SectionTitle>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Real measures we've built into the platform to keep you and your data safe.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <CertBadge title="SSL/TLS Encrypted" subtitle="All connections use HTTPS" />
                <CertBadge title="100% Manual Review" subtitle="Every profile checked by a human" />
                <CertBadge title="Match-Only Chat" subtitle="No messages from strangers" />
                <CertBadge title="Data Isolation" subtitle="Row-level security on all data" />
                <CertBadge title="Encrypted Storage" subtitle="Data encrypted at rest" />
                <CertBadge title="Selfie Verification" subtitle="Pose challenge confirms identity" />
              </div>
            </Section>

            {/* ── User safety features ── */}
            <Section>
              <SectionTitle icon={Shield}>User Safety Features</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard icon={UserCheck} title="Manual Profile Verification" description="Every profile is reviewed by a real person. Verified members display a trust badge so you know they're authentic." />
                <FeatureCard icon={Camera} title="Photo & Selfie Verification" description="Our selfie-pose verification confirms that the person behind the profile is real — not a catfish or a bot." />
                <FeatureCard icon={Eye} title="Active Content Moderation" description="Our team monitors the platform around the clock to detect and remove scams, spam, and inappropriate behavior." />
                <FeatureCard icon={MessageSquareWarning} title="Report & Block" description="Flag suspicious profiles or messages in one tap. Every report is reviewed within 24 hours and acted upon." />
                <FeatureCard icon={Lock} title="Match-Only Messaging" description="You can only message people you've mutually matched with — no unsolicited messages from strangers." />
                <FeatureCard icon={ServerCrash} title="Anomaly Detection" description="Automated systems monitor for unusual activity — such as rapid messaging or mass-liking — and flag accounts for review." />
              </div>
            </Section>

            {/* ── Privacy commitments ── */}
            <Section>
              <SectionTitle icon={Fingerprint}>Privacy Commitments</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard icon={KeyRound} title="Your Data, Your Control" description="Download or delete your personal data anytime from Settings. We never sell your information to third parties." />
                <FeatureCard icon={Globe} title="Purpose-Driven Data Collection" description="We collect only what's needed to power your experience — your profile, preferences, and matches. We use basic analytics to improve the platform." />
                <FeatureCard icon={Scale} title="Transparent Policies" description="Our Privacy Policy and Terms of Service are written in plain language so you know exactly what you're agreeing to." />
                <FeatureCard icon={Lock} title="Secure Infrastructure" description="All data is protected by row-level security policies, encrypted connections, and hosted on enterprise-grade cloud infrastructure." />
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link to="/privacy" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                  Read our Privacy Policy →
                </Link>
                <Link to="/terms" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                  Read our Terms of Service →
                </Link>
              </div>
            </Section>

            {/* ── GDPR compliance ── */}
            <Section>
              <SectionTitle icon={Scale}>GDPR Compliance</SectionTitle>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                We comply with the EU General Data Protection Regulation (GDPR) to give you full control over your personal data.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard icon={Cookie} title="Cookie Consent" description="Non-essential cookies (analytics, marketing) are blocked until you give explicit consent. You can change your preferences anytime via Cookie Settings in the footer." />
                <FeatureCard icon={Download} title="Data Export" description="Download all your personal data in JSON format from Settings at any time — fulfilling your Right to Data Portability." />
                <FeatureCard icon={Trash2} title="Account Deletion" description="Request permanent deletion of all your data from Settings. You have a 24-hour grace period to cancel before everything is irreversibly removed." />
                <FeatureCard icon={ClipboardCheck} title="Consent-Based Signup" description="You must explicitly agree to our Terms of Service and Privacy Policy before creating an account — no pre-checked boxes." />
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link to="/privacy" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                  Privacy Policy →
                </Link>
                <Link to="/cookie-policy" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                  Cookie Policy →
                </Link>
              </div>
            </Section>

            {/* ── Safety tips ── */}
            <Section>
              <SectionTitle icon={Heart}>Safety Tips for Members</SectionTitle>
              <div className="rounded-2xl bg-accent/5 border border-accent/10 p-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "Never share financial information or send money to someone you haven't met in person.",
                    "Use our video call feature to verify your match before meeting offline.",
                    "Always meet in a public place for first dates and let a friend or family member know your plans.",
                    "Keep conversations on the platform until you feel comfortable sharing personal contact details.",
                    "Trust your instincts — if something feels off, use the report or block feature immediately.",
                    "Be cautious of anyone who avoids video calls or pushes to move the conversation off-platform quickly.",
                  ].map((tip) => (
                    <li key={tip} className="flex gap-3">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            {/* ── Need help CTA ── */}
            <Section className="!border-t-0">
              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center">
                <AlertTriangle className="h-6 w-6 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Need to Report Something?
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                  If you've encountered suspicious behavior, harassment, or a safety concern, we want to hear from you. Our team investigates every report.
                </p>
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Safety;
