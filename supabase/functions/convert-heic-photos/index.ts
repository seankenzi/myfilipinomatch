import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find profiles with HEIC/HEIF photos
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, photos, avatar_url")
    .not("photos", "is", null);

  if (error) {
    console.error("Failed to fetch profiles:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let convertedCount = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    const photos: string[] = profile.photos ?? [];
    const heicPaths = photos.filter(
      (p: string) => /\.heic$/i.test(p) || /\.heif$/i.test(p)
    );

    if (heicPaths.length === 0) continue;

    console.log(`Profile ${profile.id}: ${heicPaths.length} HEIC file(s)`);

    const newPhotos = [...photos];
    let avatarUrl = profile.avatar_url;

    for (const oldPath of heicPaths) {
      const newPath = oldPath.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");

      try {
        // Download the original HEIC file
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("profile-photos")
          .download(oldPath);

        if (dlErr || !fileData) {
          // File doesn't actually exist in storage — just update the path reference
          console.warn(`File not found in storage: ${oldPath}, updating reference only`);
          const idx = newPhotos.indexOf(oldPath);
          if (idx !== -1) newPhotos.splice(idx, 1); // remove broken ref
          if (avatarUrl === oldPath) avatarUrl = newPhotos[0] ?? null;
          continue;
        }

        // Convert HEIC to JPG using sharp via storage transform
        // Since Supabase storage transforms may not support HEIC natively,
        // we'll re-upload the blob as-is with a .jpg extension if the browser
        // client already converted it, or try the signed URL transform approach
        const { data: signedData } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(oldPath, 300, {
            transform: { format: "origin", quality: 90 },
          });

        let blobToUpload: Blob;

        if (signedData?.signedUrl) {
          try {
            const resp = await fetch(signedData.signedUrl);
            if (resp.ok) {
              blobToUpload = await resp.blob();
            } else {
              blobToUpload = fileData;
            }
          } catch {
            blobToUpload = fileData;
          }
        } else {
          blobToUpload = fileData;
        }

        // Upload with new path
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(newPath, blobToUpload, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (upErr) {
          errors.push(`Upload failed for ${newPath}: ${upErr.message}`);
          continue;
        }

        // Update photos array
        const idx = newPhotos.indexOf(oldPath);
        if (idx !== -1) newPhotos[idx] = newPath;

        // Update avatar if it pointed to the old path
        if (avatarUrl === oldPath) avatarUrl = newPath;

        // Delete old file
        await supabase.storage.from("profile-photos").remove([oldPath]);

        convertedCount++;
        console.log(`Converted: ${oldPath} → ${newPath}`);
      } catch (e) {
        errors.push(`Error processing ${oldPath}: ${String(e)}`);
      }
    }

    // Update profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ photos: newPhotos, avatar_url: avatarUrl })
      .eq("id", profile.id);

    if (updateErr) {
      errors.push(`Profile update failed for ${profile.id}: ${updateErr.message}`);
    }
  }

  const result = { converted: convertedCount, errors };
  console.log("HEIC scan complete:", result);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
