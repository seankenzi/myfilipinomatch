import Navbar from "@/components/Navbar";


const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl prose prose-sm">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-4">Last updated: March 27, 2026</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
              <p>We collect information you provide when creating your account, including your name, email address, profile photos, biographical information, location, and dating preferences. We also collect usage data such as interactions with other profiles.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
              <p>We use your information to provide and improve our services, match you with other users, communicate with you about your account, and ensure platform safety through moderation.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Sharing</h2>
              <p>We do not sell your personal data. Profile information you choose to share is visible to other authenticated users. We may share data with service providers who help us operate the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information, including encryption, access controls, and regular security audits.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
              <p>You can access, update, or delete your profile data at any time through your account settings. You may also request a copy of your data or ask us to delete your account entirely.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us through the Support page.</p>
            </section>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Privacy;