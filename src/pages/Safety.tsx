import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Shield, Eye, Lock, AlertTriangle, CheckCircle } from "lucide-react";

const Safety = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex rounded-full bg-secondary/10 p-3">
            <Shield className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Safety Center</h1>

          <div className="space-y-6">
            <p className="text-base text-foreground leading-relaxed">
              Your safety is our top priority. We've built multiple layers of protection to keep our community safe and trustworthy.
            </p>

            {[
              { icon: CheckCircle, title: "Profile Verification", desc: "We review profiles to ensure authenticity. Verified profiles have passed our identity checks." },
              { icon: Eye, title: "Active Moderation", desc: "Our team monitors the platform to prevent scams, harassment, and inappropriate behavior." },
              { icon: AlertTriangle, title: "Report & Block", desc: "You can report suspicious profiles or block anyone at any time. All reports are reviewed promptly." },
              { icon: Lock, title: "Private Messaging", desc: "Messages are only available between mutual matches. Your conversations are private and secure." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="mt-0.5 flex-shrink-0">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-secondary/5 p-6 mt-8">
              <h3 className="font-semibold text-foreground mb-2">Safety Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Never share financial information or send money to someone you haven't met</li>
                <li>• Meet in public places for first dates</li>
                <li>• Tell a friend or family member about your plans</li>
                <li>• Trust your instincts — if something feels wrong, report it</li>
                <li>• Keep conversations on the platform until you're comfortable</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Safety;