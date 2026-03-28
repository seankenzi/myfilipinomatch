import { Heart, LogIn, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary fill-primary" />
          <span className="text-xl font-display font-bold text-foreground">
            FiloHeart
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/discover" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Discover
          </Link>
          <Link to="/matches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Matches
          </Link>
          <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Messages
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="mr-1 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1 h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-1 h-4 w-4" />
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  Sign up free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
