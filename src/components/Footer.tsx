import { Link } from "react-router-dom";
import logo from "@/assets/filoheart-logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container">
      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="FiloHeart" className="h-7 w-7" />
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>FiloHeart</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 FiloHeart. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
