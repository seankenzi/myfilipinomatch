import Navbar from "@/components/Navbar";


const Terms = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl prose prose-sm">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-4">Last updated: March 27, 2026</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Eligibility</h2>
              <p>You must be at least 18 years old to use MyFilipinoMatch. By creating an account, you confirm that you meet this age requirement and that the information you provide is accurate.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Account Responsibilities</h2>
              <p>You are responsible for maintaining the security of your account and for all activities that occur under your account. You must not share your credentials or create multiple accounts.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. Community Guidelines</h2>
              <p>Users must treat others with respect and honesty. Harassment, hate speech, scams, fake profiles, and explicit content are strictly prohibited and will result in account suspension.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Content</h2>
              <p>You retain ownership of content you post but grant us a license to display it on the platform. You must not post content that infringes on others' rights or violates any laws.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the Settings page.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
              <p>MyFilipinoMatch is provided "as is." We are not responsible for the actions of other users. Always exercise caution when meeting someone from the internet.</p>
            </section>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Terms;