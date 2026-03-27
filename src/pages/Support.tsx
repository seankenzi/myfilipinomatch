import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Support</h1>
          <p className="text-muted-foreground mb-8">Need help? We're here for you.</p>

          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {[
              { icon: HelpCircle, title: "FAQ", desc: "Common questions" },
              { icon: MessageCircle, title: "Live Chat", desc: "Coming soon" },
              { icon: Mail, title: "Email", desc: "support@pinoybridgelove.com" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-card text-center">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  className="mt-1"
                  placeholder="What do you need help with?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                />
              </div>
              <Button type="submit" className="gradient-hero text-primary-foreground w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Support;