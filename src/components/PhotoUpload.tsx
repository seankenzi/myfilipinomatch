import { useState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSignedPhotos } from "@/hooks/useSignedPhotos";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const PhotoUpload = ({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadPhoto = async (file: File) => {
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    // Store the path, not the public URL
    return fileName;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxPhotos - photos.length;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast({ title: `Max ${maxPhotos} photos`, description: `Only uploading ${remaining} more.`, variant: "destructive" });
    }

    setUploading(true);
    try {
      const urls = await Promise.all(toUpload.map(uploadPhoto));
      const validUrls = urls.filter(Boolean) as string[];
      const updated = [...photos, ...validUrls];
      onPhotosChange(updated);

      // Save to profile
      if (user) {
        await supabase.from("profiles").update({ photos: updated, avatar_url: updated[0] || null }).eq("id", user.id);
      }

      toast({ title: "Photos uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    const url = photos[index];
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);

    if (user) {
      // Extract path from URL for deletion
      const path = url.split("/profile-photos/")[1];
      if (path) {
        await supabase.storage.from("profile-photos").remove([decodeURIComponent(path)]);
      }
      await supabase.from("profiles").update({ photos: updated, avatar_url: updated[0] || null }).eq("id", user.id);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                Main
              </span>
            )}
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="mt-2 text-xs text-muted-foreground text-center">
        {photos.length}/{maxPhotos} photos · First photo is your main profile picture
      </p>
    </div>
  );
};

export default PhotoUpload;
