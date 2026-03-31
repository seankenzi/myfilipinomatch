import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl prose prose-sm">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-4">Effective Date: March 26, 2026</p>
          <p className="text-sm text-muted-foreground mb-6">Welcome to MyFilipinoMatch. We are committed to protecting your privacy and ensuring a safe and secure online dating experience. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
              <p className="mb-2">We collect information to provide a better, safer, and more personalized experience.</p>
              <h3 className="text-base font-medium text-foreground mb-1">a. Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>Name, email address, and account login details</li>
                <li>Profile information (e.g., age, gender, location, photos, preferences)</li>
                <li>Messages and communications with other users</li>
                <li>Information submitted for verification (e.g., ID, selfies, or video verification)</li>
              </ul>
              <h3 className="text-base font-medium text-foreground mb-1">b. Automatically Collected Information</h3>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>IP address and device information</li>
                <li>Browser type and usage data</li>
                <li>Log data (pages visited, actions taken)</li>
              </ul>
              <h3 className="text-base font-medium text-foreground mb-1">c. Payment Information</h3>
              <p>If you make a purchase, payment details are processed securely through third-party providers (e.g., Stripe or PayPal). We do not store full payment card details.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage your account</li>
                <li>Match you with other users</li>
                <li>Enable messaging and video call features</li>
                <li>Verify user identities and reduce fake profiles</li>
                <li>Improve platform performance and user experience</li>
                <li>Communicate important updates and support messages</li>
                <li>Prevent fraud, scams, and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. Video Calls and Communications</h2>
              <p className="mb-2">Our platform may offer video call features to enhance authenticity and safety.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Video calls are intended to help users verify identity and build real connections</li>
                <li>We do not record video calls unless explicitly stated and consented to</li>
                <li>Users are responsible for their conduct during interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Profile Verification and Safety</h2>
              <p className="mb-2">To maintain a trusted environment:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We may request identity verification (ID, selfies, or video checks)</li>
                <li>Profiles may be reviewed manually or automatically</li>
                <li>Suspicious or fraudulent accounts may be suspended or removed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Sharing of Information</h2>
              <p className="mb-2">We do not sell your personal data.</p>
              <p className="mb-2">We may share limited information with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Service providers (hosting, payment processors, analytics)</li>
                <li>Law enforcement if required by law</li>
                <li>Moderation tools to detect fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Data Retention</h2>
              <p className="mb-2">We retain your data only as long as necessary to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide our services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce policies</li>
              </ul>
              <p className="mt-2">You may request deletion of your account at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Your Rights</h2>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Request corrections</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at: <a href="mailto:support@myfilipinomatch.com" className="text-primary hover:underline">support@myfilipinomatch.com</a></p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. Security</h2>
              <p className="mb-2">We take reasonable steps to protect your data, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Secure servers and encryption</li>
                <li>Access controls and monitoring</li>
                <li>Fraud detection systems</li>
              </ul>
              <p className="mt-2">However, no system is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Cookies and Tracking</h2>
              <p className="mb-2">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Improve user experience</li>
                <li>Analyze site usage</li>
                <li>Remember preferences</li>
              </ul>
              <p className="mt-2">You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">10. Age Restrictions</h2>
              <p>Our platform is intended for users aged 18 and above. We do not knowingly collect data from minors.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">11. International Users</h2>
              <p>If you access our platform from outside your country, your data may be processed in other jurisdictions where our servers are located.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">12. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">13. Contact Us</h2>
              <p className="mb-2">If you have any questions or concerns about this Privacy Policy, please contact us:</p>
              <p>Email: <a href="mailto:support@myfilipinomatch.com" className="text-primary hover:underline">support@myfilipinomatch.com</a></p>
              <p>Website: <a href="https://www.myfilipinomatch.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://www.myfilipinomatch.com</a></p>
              <p className="mt-3 font-medium text-foreground">By using our platform, you agree to this Privacy Policy.</p>
            </section>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Privacy;