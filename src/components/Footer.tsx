import { Link } from "react-router-dom";
import logo from "@/assets/myfilipinomatch-logo.png";

const Footer = () => (
  <footer className="hidden md:block border-t border-border bg-card">
    <div className="container py-6">
      <div className="relative flex items-center justify-center min-h-[40px]">
        <div className="absolute left-0 flex items-center gap-2">
          <img src={logo} alt="MyFilipinoMatch" className="h-7 w-7" />
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>MyFilipinoMatch</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        </div>
        <p className="absolute right-0 text-xs text-muted-foreground">© 2026 MyFilipinoMatch. All rights reserved.</p>
      </div>
    </div>
    <div className="border-t border-border/50 bg-primary/5 py-3">
      <div className="container flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-primary flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        <span>Our <strong className="text-foreground font-medium">100% Manual Profile Review</strong> ensures you only meet real people.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
