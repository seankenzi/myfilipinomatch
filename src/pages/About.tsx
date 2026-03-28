import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, Users, Award, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}><h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>About FiloHeart</h1></h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <p className="text-base text-foreground leading-relaxed">
              FiloHeart is a dating platform dedicated to fostering genuine, meaningful relationships between Filipinos and people from around the world. We believe that love knows no borders. dedicated to fostering genuine, meaningful relationships between Filipinos and people from around the world. We believe that love knows no borders.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 not-prose mt-8">
              {[
                { icon: Heart, title: "Our Mission", desc: "To create a safe, trusted space where serious-minded individuals can find lasting love and meaningful connections." },
                { icon: Users, title: "Community First", desc: "We prioritize our members' safety and wellbeing with verified profiles, active moderation, and community guidelines." },
                { icon: Globe, title: "Bridging Cultures", desc: "We celebrate cross-cultural relationships and help people connect across borders with respect and understanding." },
                { icon: Award, title: "Quality Over Quantity", desc: "We focus on serious relationships — long-term commitments and marriage — not casual encounters." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="mb-3 inline-flex rounded-xl gradient-hero p-2.5">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;