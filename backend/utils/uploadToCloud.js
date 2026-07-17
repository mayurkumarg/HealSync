import { randomUUID } from "crypto";
import path from "path";
import supabase from "../configure/supabase.js";

/**
 * Uploads an array of files to a specified Supabase storage bucket.
 *
 * @param {Array} files - Multer 'req.files' array. Each file contains:
 *   - originalname: original file name
 *   - mimetype: file type (image/png, application/pdf, etc.)
 *   - buffer: file data buffer
 *
 * @param {String} bucket - The Supabase Storage bucket name to upload into.
 *
 * @returns {Array} media - Array of uploaded file objects:
 *   [
 *     {
 *       url: "https://public-url-of-file",
 *       type: "image" | "video" | "pdf"  // auto-detected from mimetype
 *     }
 *   ]
 *
 * Function Steps:
 *   1. Validates input.
 *   2. Generates a unique file name.
 *   3. Uploads each file to Supabase Storage.
 *   4. Fetches the public URL for each uploaded file.
 *   5. Classifies file type (image / video / pdf).
 *   6. Returns a list of uploaded file details.
 */
// Buckets we've already confirmed exist this process — avoids a listBuckets round-trip on
// every upload once a bucket has been created/verified once.
const ensuredBuckets = new Set();

/** Create the bucket (public, so getPublicUrl works) if it doesn't already exist. Supabase
 * projects start with zero storage buckets — nothing provisions them ahead of time, so the
 * first upload to a new bucket name creates it. */
async function ensureBucket(bucket) {
  if (ensuredBuckets.has(bucket)) return;
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (!buckets.some((b) => b.name === bucket)) {
    const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
    // Ignore a race where another request created it in between our check and this call.
    if (createError && !/already exists/i.test(createError.message || "")) throw createError;
  }
  ensuredBuckets.add(bucket);
}

async function uploadToCloud(files, bucket) {
  let media = [];

  if (!files || files.length === 0) return media;
  if (!bucket) throw new Error("Bucket name is required.");
  await ensureBucket(bucket);

  // Upload all files to Supabase
  const supabaseFiles = await Promise.all(
    files.map(async (file) => {
      // Generate a random, non-guessable storage key — the bucket is public, so this is the only
      // thing standing between "you have the URL" and "you can enumerate other patients' files."
      // The human-readable original filename is preserved separately in MedicalDocument.fileName.
      const fileName = `${randomUUID()}${path.extname(file.originalname).slice(0, 10)}`;

      // Upload to the given bucket name
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null; // Skip failed uploads
      }

      // Create public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        url: publicData.publicUrl,
        type: file.mimetype.startsWith("image")
          ? "image"
          : file.mimetype === "application/pdf"
          ? "pdf"
          : "video",
      };
    })
  );

  // Remove failed uploads
  media = supabaseFiles.filter((f) => f !== null);

  return media;
}

export default uploadToCloud;
