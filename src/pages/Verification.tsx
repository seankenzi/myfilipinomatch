import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, Camera, Upload, CheckCircle, Clock, XCircle,
  Sparkles, ArrowLeft, AlertTriangle, X, SwitchCamera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VERIFICATION_POSES = [
  "Take a selfie while holding up 2 fingers ✌️",
  "Take a selfie with a thumbs up 👍",
  "Take a selfie while pointing to your chin",
];

const Verification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [poseInstruction] = useState(
    () => VERIFICATION_POSES[Math.floor(Math.random() * VERIFICATION_POSES.length)]
  );

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchStatus = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (profile?.is_verified) {
      setIsVerified(true);
      setVerificationStatus("approved");
      setLoading(false);
      return;
    }

    const { data: verification } = await supabase
      .from("verifications")
      .select("status")
      .eq("user_id", user.id)
      .eq("type", "photo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verification) {
      setVerificationStatus(verification.status);
    }
    setLoading(false);
  };

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions and try again."
          : "Could not access camera. Please use the upload option instead."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center-crop and mirror for selfie
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [stopCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop() || "jpg";
      const filePath = `verifications/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("verifications")
        .insert({ user_id: user.id, type: "photo", document_url: filePath, status: "pending" });
      if (insertError) throw insertError;

      setVerificationStatus("pending");
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({ title: "Verification submitted!", description: "We'll review your photo shortly." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <canvas ref={canvasRef} className="hidden" />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => navigate("/profile")}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Verify Your Profile
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Build trust and get more matches with a verified badge
            </p>
          </div>

          {isVerified && (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-secondary" />
              <h2 className="text-lg font-semibold text-secondary">You're Verified!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your profile displays a verified badge. Enjoy increased visibility and trust.
              </p>
            </div>
          )}

          {verificationStatus === "pending" && !isVerified && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-accent" />
              <h2 className="text-lg font-semibold text-accent">Under Review</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your verification photo has been submitted. We'll review it within 24 hours.
              </p>
            </div>
          )}

          {verificationStatus === "rejected" && !isVerified && (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">Verification Declined</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your photo didn't meet our requirements. Please try again below.
              </p>
            </div>
          )}

          {(!verificationStatus || verificationStatus === "rejected") && !isVerified && (
            <>
              <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Why Verify?
                </h2>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {["Get a verified badge on your profile", "Verified profiles get up to 3x more matches", "Boost your visibility in search results", "Build trust with international connections"].map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold">
                  <Camera className="h-4 w-4 text-primary" />
                  Instructions
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <p className="text-muted-foreground">Make sure your face is clearly visible with good lighting</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <div>
                      <p className="font-medium text-foreground">{poseInstruction}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">This helps us confirm you're a real person</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    <p className="text-muted-foreground">Take or upload the selfie below — no filters or heavy editing</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                {/* Live camera view */}
                {cameraActive && !previewUrl && (
                  <div className="space-y-4">
                    <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border-2 border-primary/30 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {/* Pose overlay reminder */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-center text-xs font-medium text-white">{poseInstruction}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={stopCamera}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={capturePhoto}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capture
                      </Button>
                    </div>
                  </div>
                )}

                {/* Captured / uploaded preview */}
                {previewUrl && (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border border-border">
                      <img src={previewUrl} alt="Verification selfie preview" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      >
                        Retake
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={handleSubmit} disabled={uploading}>
                        {uploading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit for Review
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Initial options - camera + upload */}
                {!cameraActive && !previewUrl && (
                  <div className="flex flex-col gap-3">
                    {cameraError && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                        <p className="text-xs text-destructive">{cameraError}</p>
                      </div>
                    )}

                    <button
                      onClick={startCamera}
                      className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 transition-colors hover:border-primary/60 hover:bg-primary/10"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Camera className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">Take a Selfie</p>
                        <p className="mt-1 text-xs text-muted-foreground">Opens live camera preview</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">Upload from Gallery</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG • Max 10MB</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your verification photo is stored securely and only used for identity verification.
                  It will not be shown on your profile.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Verification;
