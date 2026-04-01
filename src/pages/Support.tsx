import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Support = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFaq, setShowFaq] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setSending(true);

    const submissionId = crypto.randomUUID();

    // Store the contact submission
    await supabase.from("contact_submissions").insert({
      id: submissionId,
      user_id: user?.id || null,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send contact confirmation email to user + admin notification in parallel
    const adminEmail = "support@myfilipinomatch.com";
    await Promise.all([
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: email.trim(),
          idempotencyKey: `contact-confirm-${submissionId}`,
          templateData: { name: name.trim(), subject: subject.trim() },
        },
      }),
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "admin-contact-submission",
          recipientEmail: adminEmail,
          idempotencyKey: `admin-contact-${submissionId}`,
          templateData: {
            senderName: name.trim(),
            senderEmail: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
          },
        },
      }),
    ]);

    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours. Check your email for confirmation." });
    setName(user?.user_metadata?.full_name || "");
    setEmail(user?.email || "");
    setSubject("");
    setMessage("");
    setSending(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO title="Support & Help" description="Get help with your MyFilipinoMatch account. Contact our support team, browse FAQs, and find answers." canonical="/support" />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Support</h1>
          <p className="text-muted-foreground mb-8">Need help? We're here for you.</p>

          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="rounded-2xl border border-border bg-card p-5 shadow-card text-center hover:shadow-card-hover transition-all"
            >
              <HelpCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground text-sm">FAQ</h3>
              <p className="text-xs text-muted-foreground mt-1">Common questions</p>
            </button>
            <button
              onClick={() => toast({ title: "Live Chat", description: "Live chat is coming soon! Use the contact form below for now." })}
              className="rounded-2xl border border-border bg-card p-5 shadow-card text-center hover:shadow-card-hover transition-all"
            >
              <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground text-sm">Live Chat</h3>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </button>
            <a
              href="mailto:support@myfilipinomatch.com"
              className="rounded-2xl border border-border bg-card p-5 shadow-card text-center hover:shadow-card-hover transition-all"
            >
              <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground text-sm">Email</h3>
              <p className="text-xs text-muted-foreground mt-1">support@myfilipinomatch.com</p>
            </a>
          </div>

          {/* FAQ Section */}
          {showFaq && (
            <div className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">General Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    { q: "Is MyFilipinoMatch free to join?", a: "Yes! Creating an account is completely free. You can set up your profile, browse verified members, and receive matches at no cost. Premium features like unlimited messaging and video calls are available with an upgrade." },
                    { q: "How does profile verification work?", a: "Every member goes through a verification process that includes a live selfie pose challenge. Our moderation team manually reviews each submission to ensure profiles are authentic — no bots, no fakes." },
                    { q: "Is MyFilipinoMatch a scam site?", a: "Absolutely not. We are a legitimate dating platform focused on genuine, long-term relationships. Unlike pay-per-message sites, we don't charge you to send individual messages or use fake operators. Our verified profiles and active moderation keep the community safe." },
                    { q: "Who is MyFilipinoMatch for?", a: "MyFilipinoMatch is designed for foreign men seeking serious relationships with Filipino women, and for Filipinas looking to connect with international partners for long-term commitment or marriage." },
                    { q: "Can I video call my matches?", a: "Yes! Premium members get access to in-app video calling so you can see and talk to your matches face-to-face before meeting in person — building trust and real connection." },
                    { q: "How do you keep members safe?", a: "We invest heavily in safety: manual profile verification, an active moderation team, a report-and-block system, secure encrypted messaging, and strict community guidelines. Your privacy and security are our top priorities." },
                  ].map(({ q, a }, i) => (
                    <AccordionItem key={i} value={`general-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Account & Features</h2>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    { q: "How do I verify my profile?", a: "Go to your Profile page and tap 'Get Verified'. Follow the instructions to upload a selfie. Our team will review it within 24 hours." },
                    { q: "How does matching work?", a: "When you and another user both like each other, it's a match! You can then start messaging each other." },
                    { q: "What is premium?", a: "Premium unlocks unlimited messaging, the ability to see who liked you, and increased profile visibility." },
                    { q: "How do I report someone?", a: "Open a chat with the user, tap the menu icon (⋮) in the top right, and select 'Report'. You can also report profiles from the Discover page." },
                    { q: "Can I delete my account?", a: "Yes. Go to Settings and select 'Delete Account'. This action is permanent." },
                  ].map(({ q, a }, i) => (
                    <AccordionItem key={i} value={`account-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Your Name</Label>
                  <Input
                    className="mt-1"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs">Your Email</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  className="mt-1"
                  placeholder="What do you need help with?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <Label className="text-xs">Message</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Describe your issue or question..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />
              </div>
              <Button type="submit" className="gradient-hero text-primary-foreground w-full" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Support;
