import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";

const Terms = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO title="Terms of Service" description="Review the terms and conditions for using MyFilipinoMatch, including account rules, user conduct, and membership policies." canonical="/terms" />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl prose prose-sm">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-4"><strong>Effective Date:</strong> March 26, 2026</p>
          <p className="text-sm text-muted-foreground mb-2">Welcome to MyFilipinoMatch ("we," "our," or "us"). By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.</p>
          <p className="text-sm text-muted-foreground mb-6">If you do not agree with these Terms, you must not use our services.</p>

          <hr className="border-border mb-6" />

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Eligibility</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You must be at least <strong>18 years old</strong> to use this platform</li>
                <li>By using our services, you confirm that you meet this requirement</li>
                <li>We reserve the right to suspend or terminate accounts that violate this rule</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Account Registration</h2>
              <p className="mb-2">To use certain features, you must create an account.</p>
              <p className="mb-1">You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and truthful information</li>
                <li>Keep your login credentials secure</li>
                <li>Be responsible for all activity under your account</li>
              </ul>
              <p className="mt-2">We reserve the right to suspend or remove accounts that contain false or misleading information.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. User Conduct</h2>
              <p className="mb-2">You agree to use the platform respectfully and responsibly.</p>
              <p className="mb-1">You must NOT:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create fake profiles or impersonate others</li>
                <li>Use the platform for scams, fraud, or financial exploitation</li>
                <li>Request or send money to other users for dishonest purposes</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Share explicit, illegal, or inappropriate content</li>
                <li>Attempt to bypass platform safety features</li>
              </ul>
              <p className="mt-2">We take violations seriously and may suspend or permanently ban accounts without notice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Profile Verification and Safety</h2>
              <p className="mb-2">To maintain a trusted environment:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We may request identity verification (e.g., ID, selfies, video verification)</li>
                <li>Profiles may be reviewed manually or automatically</li>
                <li>We reserve the right to remove or restrict accounts deemed suspicious</li>
              </ul>
              <p className="mt-2">While we aim to reduce fake profiles, we <strong>do not guarantee</strong> the authenticity of every user.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Messaging and Video Calls</h2>
              <p className="mb-2">Our platform allows users to communicate via messaging and video calls.</p>
              <p className="mb-1">By using these features, you agree:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>To behave respectfully during all interactions</li>
                <li>Not to record, distribute, or misuse private communications without consent</li>
                <li>That you are solely responsible for your interactions with other users</li>
              </ul>
              <p className="mt-2">We are <strong>not responsible</strong> for the actions or behavior of other users.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Payments and Subscriptions</h2>
              <p className="mb-2">Certain features may require payment.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All payments are processed through third-party providers (e.g., Stripe, PayPal)</li>
                <li>Subscription plans may renew automatically unless canceled</li>
                <li>Pricing and features may change at any time</li>
              </ul>
              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Refund Policy</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payments are generally <strong>non-refundable</strong>, unless required by law</li>
                <li>You are responsible for canceling your subscription before renewal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Account Suspension and Termination</h2>
              <p className="mb-2">We reserve the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Suspend or terminate your account at our discretion</li>
                <li>Remove content that violates these Terms</li>
                <li>Restrict access to features without prior notice</li>
              </ul>
              <p className="mt-2 mb-1">Reasons may include (but are not limited to):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Suspicious activity</li>
                <li>Violations of user conduct rules</li>
                <li>Fraudulent or abusive behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. User Responsibility</h2>
              <p className="mb-2">You acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are responsible for your interactions with other users</li>
                <li>You should exercise caution when communicating or meeting others</li>
                <li>We do not conduct full background checks on users</li>
              </ul>
              <p className="mt-2">Use the platform at your own risk.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Intellectual Property</h2>
              <p className="mb-2">All content on the platform (excluding user-generated content), including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Design</li>
                <li>Branding</li>
                <li>Software</li>
              </ul>
              <p className="mt-2">is owned by us and protected by applicable laws.</p>
              <p>You may not copy, distribute, or exploit any part of the platform without permission.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">10. Limitation of Liability</h2>
              <p className="mb-2">To the fullest extent permitted by law:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We are not liable for any damages arising from your use of the platform</li>
                <li>We are not responsible for user behavior, interactions, or outcomes</li>
                <li>We do not guarantee matches, relationships, or results</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">11. Privacy</h2>
              <p>Your use of the platform is also governed by our Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">12. Changes to These Terms</h2>
              <p className="mb-2">We may update these Terms at any time.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Changes will be posted on this page</li>
                <li>Continued use of the platform means you accept the updated Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">13. Governing Law</h2>
              <p>These Terms shall be governed by and interpreted in accordance with applicable laws in your operating jurisdiction.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">14. Contact Us</h2>
              <p className="mb-2">If you have any questions about these Terms, please contact us:</p>
              <p>Email: <a href="mailto:support@myfilipinomatch.com" className="text-primary hover:underline">support@myfilipinomatch.com</a></p>
              <p>Website: <a href="https://www.myfilipinomatch.com" className="text-primary hover:underline">https://www.myfilipinomatch.com</a></p>
            </section>

            <hr className="border-border" />

            <p className="font-medium text-foreground">By using MyFilipinoMatch.com, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Terms;