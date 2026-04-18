import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.sendCrashNotification(error, errorInfo);
  }

  private isStaleChunkError(error: Error): boolean {
    const msg = error.message || "";
    return (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module") ||
      /ChunkLoadError/i.test(msg) ||
      /Loading chunk \d+ failed/i.test(msg)
    );
  }

  private async sendCrashNotification(error: Error, errorInfo: ErrorInfo) {
    // Skip stale-chunk errors — they're deploy timing, not bugs (lazyRetry auto-reloads)
    if (this.isStaleChunkError(error)) return;

    try {
      const errorKey = `${error.message}-${window.location.pathname}`;
      const storageKey = `crash-notified-${btoa(errorKey).slice(0, 40)}`;

      // Deduplicate: don't send the same crash more than once per session
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");

      // Log to database
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("crash_logs" as any).insert({
        error_message: error.message,
        error_stack: (error.stack || "").slice(0, 2000),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        user_id: user?.id || null,
      });

      // Send email notification
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "app-crash-alert",
          recipientEmail: "admin",
          idempotencyKey: `crash-${Date.now()}-${errorKey.slice(0, 50)}`,
          templateData: {
            errorMessage: error.message,
            errorStack: (error.stack || "").slice(0, 800),
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (e) {
      // Silently fail — don't crash the error boundary itself
      console.error("Failed to send crash notification:", e);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              {this.props.fallbackTitle || "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Try refreshing or contact support if it persists.
            </p>
            {this.state.error && (
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.assign("/")}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
