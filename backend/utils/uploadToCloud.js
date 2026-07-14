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
async function uploadToCloud(files, bucket) {
  let media = [];

  if (!files || files.length === 0) return media;
  if (!bucket) throw new Error("Bucket name is required.");

  // Upload all files to Supabase
  const supabaseFiles = await Promise.all(
    files.map(async (file) => {
      // Generate a unique filename
      const fileName = `${Date.now()}-${file.originalname}`;

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
