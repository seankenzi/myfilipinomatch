import { useState } from "react";
import { Send, ArrowLeft, Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import profile1 from "@/assets/profile-1.jpg";

const mockMessages = [
  { id: 1, text: "Hi! I saw your profile and loved your bio 😊", sender: "them", time: "10:30 AM" },
  { id: 2, text: "Thank you! I really liked your photos from Cebu!", sender: "me", time: "10:32 AM" },
  { id: 3, text: "Have you ever visited the Philippines?", sender: "them", time: "10:33 AM" },
  { id: 4, text: "Not yet, but I'm planning a trip soon! Would love some recommendations 🌴", sender: "me", time: "10:35 AM" },
];

const Messages = () => {
  const [message, setMessage] = useState("");
  const [isPremium] = useState(false);
  const freeMessagesLeft = 3;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Chat Header */}
      <div className="sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex items-center gap-3 py-3">
          <Link to="/matches" className="md:hidden">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <img src={profile1} alt="Maria" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold">Maria, 26</h2>
              <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30" />
            </div>
            <p className="text-xs text-muted-foreground">Manila • Active 2 min ago</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-40 md:pb-24">
        <div className="mx-auto max-w-2xl space-y-3">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === "me"
                    ? "gradient-hero text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`mt-1 text-[10px] ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Message Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md md:bottom-0">
        {!isPremium && (
          <div className="flex items-center justify-between bg-accent/10 px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-3 w-3" />
              {freeMessagesLeft} free messages remaining
            </div>
            <Button variant="hero" size="sm" className="h-6 text-[10px] px-2">
              Upgrade
            </Button>
          </div>
        )}
        <div className="container flex items-center gap-3 py-3">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero text-primary-foreground transition-all hover:scale-105 active:scale-95">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
