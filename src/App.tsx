import { lazy, Suspense } from "react";
import { usePageVisitTracker } from "@/hooks/usePageVisitTracker";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Footer from "@/components/Footer";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import IncomingCallHandler from "@/components/IncomingCallHandler";
import CookieConsent from "@/components/CookieConsent";
import { usePushSubscription } from "@/hooks/usePushSubscription";

// Eagerly load the landing/index page for fast initial paint
import Index from "./pages/Index.tsx";

// Auto-reload on stale chunk errors (after deploy, old hashed files are gone)
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      // Only reload once to avoid infinite loops
      const key = "chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
      throw err;
    })
  );
}

// Lazy-load all other pages to reduce initial bundle size
const Login = lazyRetry(() => import("./pages/Login.tsx"));
const Signup = lazyRetry(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazyRetry(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword.tsx"));
const Onboarding = lazyRetry(() => import("./pages/Onboarding.tsx"));
const Discover = lazyRetry(() => import("./pages/Discover.tsx"));
const ProfileDetail = lazyRetry(() => import("./pages/ProfileDetail.tsx"));
const Matches = lazyRetry(() => import("./pages/Matches.tsx"));
const Messages = lazyRetry(() => import("./pages/Messages.tsx"));
const Profile = lazyRetry(() => import("./pages/Profile.tsx"));
const Settings = lazyRetry(() => import("./pages/Settings.tsx"));
const Verification = lazyRetry(() => import("./pages/Verification.tsx"));
const AdminVerifications = lazyRetry(() => import("./pages/AdminVerifications.tsx"));
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard.tsx"));
const Premium = lazyRetry(() => import("./pages/Premium.tsx"));
const Notifications = lazyRetry(() => import("./pages/Notifications.tsx"));
const WhoLikedMe = lazyRetry(() => import("./pages/WhoLikedMe.tsx"));
const About = lazyRetry(() => import("./pages/About.tsx"));
const Safety = lazyRetry(() => import("./pages/Safety.tsx"));
const Privacy = lazyRetry(() => import("./pages/Privacy.tsx"));
const Terms = lazyRetry(() => import("./pages/Terms.tsx"));
const Support = lazyRetry(() => import("./pages/Support.tsx"));
const Unsubscribe = lazyRetry(() => import("./pages/Unsubscribe.tsx"));
const EmailUnsubscribe = lazyRetry(() => import("./pages/EmailUnsubscribe.tsx"));
const NotFound = lazyRetry(() => import("./pages/NotFound.tsx"));
const Blog = lazyRetry(() => import("./pages/Blog.tsx"));
const BlogPost = lazyRetry(() => import("./pages/BlogPost.tsx"));
const CookiePolicy = lazyRetry(() => import("./pages/CookiePolicy.tsx"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const PageVisitTracker = () => {
  usePageVisitTracker();
  return null;
};

const PushSubscriptionManager = () => {
  usePushSubscription();
  return null;
};

const AppShell = () => {
  const { pathname } = useLocation();
  const isMessagesRoute = pathname === "/messages";

  return (
    <AuthProvider>
      <PageVisitTracker />
      <PushSubscriptionManager />
      <ScrollToTop />
      <IncomingCallHandler />
      <div className="flex min-h-screen flex-col">
        <div className={isMessagesRoute ? "flex-1" : "flex-1 pb-16 md:pb-0"}>
          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
                <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
                <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/who-liked-me" element={<ProtectedRoute><WhoLikedMe /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/support" element={<Support />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/email-unsubscribe" element={<EmailUnsubscribe />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
        <Footer />
        <CookieConsent />
      </div>
    </AuthProvider>
  );
};

const App = () => {
  useOnlineStatus();
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
