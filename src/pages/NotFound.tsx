import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, Heart, Shield, HelpCircle, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import logo from "@/assets/myfilipinomatch-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const helpfulLinks = [
    { to: "/", label: "Home", icon: Home, desc: "Back to the homepage" },
    { to: "/discover", label: "Discover", icon: Search, desc: "Browse verified profiles" },
    { to: "/about", label: "About Us", icon: Heart, desc: "Learn about MyFilipinoMatch" },
    { to: "/safety", label: "Trust & Safety", icon: Shield, desc: "How we keep you safe" },
    { to: "/support", label: "Support", icon: HelpCircle, desc: "Get help from our team" },
  ];

  return (
    <>
      <SEO title="Page Not Found" noIndex prerenderStatusCode={404} />
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-2xl">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src={logo} alt="MyFilipinoMatch logo" className="h-10 w-10" />
            <span
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              MyFilipinoMatch
            </span>
          </div>

          {/* Hero */}
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
              Error 404
            </p>
            <h1
              className="text-5xl md:text-7xl font-bold text-foreground mb-4 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Page Not Found
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. Don't
              worry — your match is still out there.
            </p>
          </div>

          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button asChild size="lg" className="haptic-press">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="haptic-press"
            >
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </button>
            </Button>
          </div>

          {/* Helpful links */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 text-center">
              Helpful Links
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {helpfulLinks.map(({ to, label, icon: Icon, desc }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-foreground">
                        {label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {desc}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Report broken link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Think this is a broken link?{" "}
            <Link
              to="/support"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Let us know
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
};

export default NotFound;
