import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import logo from "@/assets/myfilipinomatch-logo.png";
import studioLogo from "@/assets/9100-web-studio-logo.png";

const Footer = () => {
  const { pathname } = useLocation();
  if (pathname === "/messages") return null;

  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t border-border bg-card" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="container py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Brand block */}
          <div className="col-span-12 lg:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-3" aria-label="MyFilipinoMatch home">
              <img src={logo} alt="MyFilipinoMatch logo" className="h-8 w-8" />
              <span
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                MyFilipinoMatch
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The trusted dating platform with{" "}
              <Link to="/safety" className="text-foreground font-medium hover:underline">
                verified Filipina profiles
              </Link>
              . Meet real Filipino singles for serious relationships and marriage.
            </p>
          </div>

          {/* Discover */}
          <nav className="col-span-6 lg:col-span-2" aria-label="Discover">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Discover
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/signup" className="hover:text-foreground transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/discover" className="hover:text-foreground transition-colors">
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link to="/premium" className="hover:text-foreground transition-colors">
                  Premium Membership
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav className="col-span-6 lg:col-span-2" aria-label="Company">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-foreground transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Dating Blog
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Help & Support
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav className="col-span-6 lg:col-span-2" aria-label="Resources">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Filipino Dating Tips
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-foreground transition-colors">
                  Safe Dating Guide
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav className="col-span-6 lg:col-span-2" aria-label="Legal">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event("open-cookie-consent"))}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} MyFilipinoMatch. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care for genuine connections between foreigners and Filipino singles.
          </p>
        </div>
      </div>

      <div className="border-t border-border/50 bg-primary/5 py-3">
        <div className="container flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>
            Our{" "}
            <Link to="/safety" className="text-foreground font-medium hover:underline">
              100% Manual Profile Review
            </Link>{" "}
            ensures you only meet real people.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
