import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

// Eagerly load the landing/index page for fast initial paint
import Index from "./pages/Index.tsx";

// Lazy-load all other pages to reduce initial bundle size
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Discover = lazy(() => import("./pages/Discover.tsx"));
const ProfileDetail = lazy(() => import("./pages/ProfileDetail.tsx"));
const Matches = lazy(() => import("./pages/Matches.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Verification = lazy(() => import("./pages/Verification.tsx"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const Premium = lazy(() => import("./pages/Premium.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const WhoLikedMe = lazy(() => import("./pages/WhoLikedMe.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Safety = lazy(() => import("./pages/Safety.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.tsx"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col">
            
            <div className="flex-1">
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
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </ErrorBoundary>
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
