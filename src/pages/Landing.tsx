import { useState, useEffect } from "react";
import { Heart, Shield, ArrowRight, UserPlus, Search, MessagesSquare, ShieldCheck, Ban, Lock, Eye, BadgeCheck, Users, AlertTriangle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LazySection from "@/components/LazySection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroCouple from "@/assets/hero-couple.jpg";
import heroCouple2 from "@/assets/hero-couple-2.jpg";
import heroCouple3 from "@/assets/hero-couple-3.jpg";
import heroCoupleMobile from "@/assets/hero-couple-mobile.jpg";
import heroCouple2Mobile from "@/assets/hero-couple-2-mobile.jpg";
import heroCouple3Mobile from "@/assets/hero-couple-3-mobile.jpg";
import coupleCafe from "@/assets/couple-cafe.jpg";
import coupleBinondo from "@/assets/couple-binondo.jpg";
import coupleMarket from "@/assets/couple-market.jpg";
import mariaPhoto from "@/assets/test-profiles/maria.jpg";
import jamesPhoto from "@/assets/test-profiles/james.jpg";
import anaPhoto from "@/assets/test-profiles/ana.jpg";
import davidPhoto from "@/assets/test-profiles/david.jpg";
import sofiaPhoto from "@/assets/test-profiles/sofia.jpg";
import kenjiPhoto from "@/assets/test-profiles/kenji.jpg";

const heroImages = [
  { desktop: heroCouple, mobile: heroCoupleMobile },
  { desktop: heroCouple2, mobile: heroCouple2Mobile },
  { desktop: heroCouple3, mobile: heroCouple3Mobile },
];

type Faq = { question: string; answer: string; answerNode?: React.ReactNode };

const faqs: Faq[] = [
  {
    question: "Is MyFilipinoMatch free to join?",
    answer:
      "Yes! Creating an account is completely free. You can set up your profile, browse verified members, and receive matches at no cost. Premium features like unlimited messaging and video calls are available with an upgrade.",
    answerNode: (
      <>
        Yes!{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">
          Creating an account
        </Link>{" "}
        is completely free. You can set up your profile, browse verified
        members, and receive matches at no cost.{" "}
        <Link to="/premium" className="text-primary font-medium hover:underline">
          Premium features
        </Link>{" "}
        like unlimited messaging and video calls are available with an upgrade.
      </>
    ),
  },
  {
    question: "How does profile verification work?",
    answer:
      "Every member goes through a verification process that includes a live selfie pose challenge. Our moderation team manually reviews each submission to ensure profiles are authentic — no bots, no fakes.",
    answerNode: (
      <>
        Every member goes through a verification process that includes a live
        selfie pose challenge. Our moderation team manually reviews each
        submission to ensure profiles are authentic — no bots, no fakes.{" "}
        <Link to="/safety" className="text-primary font-medium hover:underline">
          Learn more about our trust & safety practices
        </Link>
        .
      </>
    ),
  },
  {
    question: "Is MyFilipinoMatch a scam site?",
    answer:
      "Absolutely not. We are a legitimate dating platform focused on genuine, long-term relationships. Unlike pay-per-message sites, we don't charge you to send individual messages or use fake operators. Our verified profiles and active moderation keep the community safe.",
    answerNode: (
      <>
        Absolutely not. We are a legitimate dating platform focused on genuine,
        long-term relationships.{" "}
        <Link to="/about" className="text-primary font-medium hover:underline">
          Read our story
        </Link>{" "}
        to see how we're different. Unlike pay-per-message sites, we don't
        charge you to send individual messages or use fake operators. Our
        verified profiles and active moderation keep the community safe.
      </>
    ),
  },
  {
    question: "Who is MyFilipinoMatch for?",
    answer:
      "MyFilipinoMatch is designed for foreign men seeking serious relationships with Filipino women, and for Filipinas looking to connect with international partners for long-term commitment or marriage.",
    answerNode: (
      <>
        MyFilipinoMatch is designed for foreign men seeking serious
        relationships with Filipino women, and for Filipinas looking to connect
        with international partners for long-term commitment or marriage.
        Discover{" "}
        <Link to="/blog" className="text-primary font-medium hover:underline">
          dating tips and success stories
        </Link>{" "}
        on our blog.
      </>
    ),
  },
  {
    question: "Can I video call my matches?",
    answer:
      "Yes! Premium members get access to in-app video calling so you can see and talk to your matches face-to-face before meeting in person — building trust and real connection.",
    answerNode: (
      <>
        Yes!{" "}
        <Link to="/premium" className="text-primary font-medium hover:underline">
          Premium members
        </Link>{" "}
        get access to in-app video calling so you can see and talk to your
        matches face-to-face before meeting in person — building trust and real
        connection.
      </>
    ),
  },
  {
    question: "How do you keep members safe?",
    answer:
      "We invest heavily in safety: manual profile verification, an active moderation team, a report-and-block system, secure encrypted messaging, and strict community guidelines. Your privacy and security are our top priorities.",
    answerNode: (
      <>
        We invest heavily in safety: manual profile verification, an active
        moderation team, a report-and-block system, secure encrypted messaging,
        and strict community guidelines. See our full{" "}
        <Link to="/safety" className="text-primary font-medium hover:underline">
          Trust & Safety guide
        </Link>{" "}
        or contact our{" "}
        <Link to="/support" className="text-primary font-medium hover:underline">
          support team
        </Link>{" "}
        if you need help.
      </>
    ),
  },
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <SEO
        canonical="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "MyFilipinoMatch",
            url: "https://www.myfilipinomatch.com",
            description: "The most trusted international dating platform connecting foreigners with Filipino singles for serious, long-term relationships and marriage.",
            sameAs: [],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "MyFilipinoMatch",
            url: "https://www.myfilipinomatch.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.myfilipinomatch.com/discover?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          },
        ]}
      />
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
        {heroImages.map((img, i) => (
          <picture key={i}>
            <source media="(max-width: 768px)" srcSet={img.mobile} />
            <img
              src={img.desktop}
              alt={["Happy interracial couple enjoying time together", "Filipino woman and foreign partner smiling", "Couple in love on a tropical date"][i]}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                i === currentImage ? "opacity-100" : "opacity-0"
              }`}
              width={1920}
              height={1080}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </picture>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/55 to-foreground/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/20" />

        <div className="container relative z-10 px-5 py-12 md:py-20">
          <div className="max-w-2xl animate-slide-up">
            <h1 className="mb-4 md:mb-6 text-3xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-display)' }}>
              MyFilipinoMatch — Meet Real, Verified Filipina Singles
              <span className="block mt-1 md:mt-2 text-primary-foreground/90 text-xl md:text-4xl lg:text-5xl">No Fake Profiles, Free to Join</span>
            </h1>
            <p className="mb-6 md:mb-8 max-w-lg text-base text-primary-foreground/85 md:text-xl leading-relaxed">
              Join a trusted platform where foreign men meet verified Filipinas ready for genuine, long-term connections.
            </p>

            <div className="mb-6 md:mb-10 flex flex-col gap-1.5 md:gap-2">
              {[
                { icon: BadgeCheck, text: "Verified Filipina profiles (ID + selfie checked)" },
                { icon: Ban, text: "No bots. No fake accounts." },
                { icon: Users, text: "Real conversations with real people" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="h-4.5 w-4.5 text-secondary flex-shrink-0" />
                  <span className="text-sm text-primary-foreground/90 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto min-h-[48px]">
                  Create Free Account
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/discover" className="w-full sm:w-auto">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto min-h-[48px] border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Browse Verified Profiles
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 md:mt-12 flex items-center gap-3 md:gap-4">
              <div className="flex -space-x-3">
                {[mariaPhoto, jamesPhoto, anaPhoto, kenjiPhoto].map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={["MyFilipinoMatch verified member Maria", "MyFilipinoMatch member James", "MyFilipinoMatch verified member Ana", "MyFilipinoMatch member Kenji"][i]}
                    className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover"
                    loading="lazy"
                    width={40}
                    height={40}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Join our growing community</p>
                <p className="text-xs text-primary-foreground/70">Verified members looking for real connections</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LazySection>
      <section className="relative py-12 md:py-20 bg-background overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="container relative z-10">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-10 md:mb-16 max-w-md mx-auto">
            Three simple steps to finding your match
          </p>
          <div className="mx-auto max-w-4xl grid gap-10 md:grid-cols-3">
            {[
              {
                icon: UserPlus,
                step: "1",
                title: "Create Your Free Account",
                desc: "Sign up in seconds and set up your profile.",
                gradient: "from-primary to-accent",
              },
              {
                icon: Search,
                step: "2",
                title: "Browse Verified Filipinas",
                desc: "Every profile is reviewed to ensure authenticity.",
                gradient: "from-secondary to-primary",
              },
              {
                icon: MessagesSquare,
                step: "3",
                title: "Start Real Conversations",
                desc: "Chat, connect, and build something meaningful.",
                gradient: "from-accent to-secondary",
              },
            ].map(({ icon: Icon, step, title, desc, gradient }) => (
              <div key={step} className="text-center group">
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-card transition-transform group-hover:scale-110`}>
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
      </LazySection>

      <LazySection>
      <section className="relative py-12 md:py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(350 65% 55% / 0.06), hsl(35 80% 55% / 0.08), hsl(175 40% 40% / 0.06))' }}>
        <div className="container relative z-10">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Why <span className="text-gradient">MyFilipinoMatch</span> Is Different
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            We're built for real relationships — not empty promises
          </p>
          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "100% Profile Verification",
                desc: "We manually review profiles to reduce fake accounts.",
                accent: "bg-primary/10 text-primary",
                border: "border-primary/20 hover:border-primary/40",
              },
              {
                icon: Ban,
                title: "No Pay-Per-Message Traps",
                desc: "We focus on real relationships — not draining your wallet.",
                accent: "bg-accent/10 text-accent",
                border: "border-accent/20 hover:border-accent/40",
              },
              {
                icon: Heart,
                title: "Built for Serious Connections",
                desc: "This is not a hookup site. Members are relationship-focused.",
                accent: "bg-secondary/10 text-secondary",
                border: "border-secondary/20 hover:border-secondary/40",
              },
            ].map(({ icon: Icon, title, desc, accent, border }) => (
              <Card key={title} className={`border-2 ${border} bg-background/80 backdrop-blur-sm shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1`}>
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-xl ${accent} p-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </LazySection>

      <LazySection>
      <section className="relative py-12 md:py-20 bg-background overflow-hidden">
        <div className="absolute top-10 right-0 w-64 h-64 rounded-full bg-secondary/8 blur-3xl" />
        <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="container relative z-10">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            What Our Members Say
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Real stories from real people
          </p>
          <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "I met my partner here after trying many sites. Finally, something real.",
                name: "Mark",
                location: "USA",
                photo: jamesPhoto,
                ring: "ring-primary/30",
              },
              {
                quote: "I felt safe and respected. The platform is different from others.",
                name: "Ana",
                location: "Philippines",
                photo: anaPhoto,
                ring: "ring-accent/30",
              },
              {
                quote: "The verification process gave me confidence that profiles are genuine.",
                name: "David",
                location: "UK",
                photo: davidPhoto,
                ring: "ring-secondary/30",
              },
            ].map((t) => (
              <Card key={t.name} className="border-border bg-card shadow-card hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className={`h-12 w-12 rounded-full object-cover ring-2 ${t.ring}`}
                      loading="lazy"
                      width={48}
                      height={48}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </LazySection>

      <LazySection>
      <section className="relative py-12 md:py-20 overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(175 40% 40% / 0.05), hsl(350 65% 55% / 0.05))' }}>
        <div className="container relative z-10">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary/60">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                Safe, Secure & Built for Real, Verified Connections
              </h2>
              <p className="mb-8 text-muted-foreground">
                Your safety is our top priority. We invest in keeping our community trustworthy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  { icon: Users, text: "Active moderation team", color: "text-primary" },
                  { icon: AlertTriangle, text: "Report & block system", color: "text-accent" },
                  { icon: Lock, text: "Secure messaging", color: "text-secondary" },
                  { icon: Eye, text: "Privacy controls for your data", color: "text-primary" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/safety"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Visit our Trust & Safety Center <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="relative rounded-3xl overflow-hidden shadow-elevated ring-4 ring-primary/10 aspect-[3/2]">
                <img
                  src={coupleBinondo}
                  alt="Foreign man and Filipina smiling together in Binondo, Manila"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={1200}
                  height={800}
                />
              </div>
              <div className="relative rounded-3xl overflow-hidden shadow-elevated ring-4 ring-secondary/10 aspect-[3/2]">
                <img
                  src={coupleMarket}
                  alt="Foreign man and Filipina shopping together at a Filipino market"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={1200}
                  height={800}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      <LazySection>
      <section className="relative py-12 md:py-20 bg-background overflow-hidden">
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-accent/8 blur-3xl" />
        <div className="container relative z-10">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Everything you need to know before getting started
          </p>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-2xl border border-border bg-card px-6 shadow-card data-[state=open]:shadow-card-hover transition-shadow">
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
      </LazySection>

      <LazySection>
      <section className="relative py-16 md:py-24 overflow-hidden">
        <picture>
          <source media="(max-width: 768px)" srcSet={heroCoupleMobile} />
          <img
            src={heroCouple}
            alt="Happy couple enjoying time together — MyFilipinoMatch"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            aria-hidden="true"
          />
        </picture>
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Stop wasting time on fake profiles.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-lg text-primary-foreground/80">
              Start your real connection today.
            </p>
            <Link to="/signup">
              <Button variant="default" size="xl" className="w-full sm:w-auto min-h-[48px] bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold shadow-elevated">
                Create Your Free Account
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </LazySection>
    </div>
  );
};

export default Landing;
