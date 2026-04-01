import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Cookie Policy | MyFilipinoMatch"
        description="Learn about the cookies MyFilipinoMatch uses, their purpose, and how you can manage your preferences."
        canonical="/cookie-policy"
      />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex rounded-full bg-primary/10 p-3">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 1, 2026</p>

          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you use it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Cookies We Use</h2>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 font-semibold text-foreground text-xs">Cookie</th>
                      <th className="px-4 py-3 font-semibold text-foreground text-xs">Type</th>
                      <th className="px-4 py-3 font-semibold text-foreground text-xs">Purpose</th>
                      <th className="px-4 py-3 font-semibold text-foreground text-xs">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">sb-*-auth-token</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-xs font-medium">Essential</span></td>
                      <td className="px-4 py-3 text-xs">Keeps you logged in securely</td>
                      <td className="px-4 py-3 text-xs">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">cookie_consent</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-xs font-medium">Essential</span></td>
                      <td className="px-4 py-3 text-xs">Remembers your cookie preferences</td>
                      <td className="px-4 py-3 text-xs">Persistent</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">anonymous_id</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-xs font-medium">Essential</span></td>
                      <td className="px-4 py-3 text-xs">Links consent records to your browser</td>
                      <td className="px-4 py-3 text-xs">Persistent</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">_ga, _ga_*</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">Analytics</span></td>
                      <td className="px-4 py-3 text-xs">Google Analytics — helps us understand how visitors use the site</td>
                      <td className="px-4 py-3 text-xs">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">_gid</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">Analytics</span></td>
                      <td className="px-4 py-3 text-xs">Google Analytics — distinguishes unique visitors</td>
                      <td className="px-4 py-3 text-xs">24 hours</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">_fbp</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">Marketing</span></td>
                      <td className="px-4 py-3 text-xs">Facebook Pixel — measures ad effectiveness and enables retargeting</td>
                      <td className="px-4 py-3 text-xs">3 months</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">fr</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">Marketing</span></td>
                      <td className="px-4 py-3 text-xs">Facebook — delivers and measures ad relevance</td>
                      <td className="px-4 py-3 text-xs">3 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Cookie Categories</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">🔒 Essential (always active)</h3>
                  <p>Required for authentication, messaging, video calls, and cookie consent management. These cannot be disabled.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">📊 Analytics</h3>
                  <p>Google Analytics helps us understand how visitors use the site. Only loaded if you explicitly enable this category. IP addresses are anonymized.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">📢 Marketing</h3>
                  <p>Facebook Pixel allows us to measure ad effectiveness. Only loaded if you enable this category. No data is shared until you consent.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">⚙️ Preferences</h3>
                  <p>Remembers your display settings and personalization choices for a better experience.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Managing Your Preferences</h2>
              <p className="mb-3">You can change your cookie preferences at any time by:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Clicking <strong className="text-foreground">"Cookie Settings"</strong> in the website footer</li>
                <li>Using the "Manage Preferences" button on the cookie banner</li>
                <li>Clearing your browser's cookies and revisiting the site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Consent Records</h2>
              <p>
                To comply with GDPR, we store a record of your consent choice (accepted or declined) along with a timestamp. This allows us to demonstrate that consent was properly obtained. These records do not contain any personally identifying information for anonymous visitors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please{" "}
                <Link to="/support" className="text-primary hover:underline">contact our support team</Link>.
              </p>
            </section>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy →</Link>
              <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;
