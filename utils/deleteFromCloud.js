import supabase from "../configure/supabase.js";

/**
 * Deletes a file from a specified Supabase Storage bucket.
 *
 * @param {String} fileUrl - The public URL of the file to delete.
 * @param {String} bucket  - The bucket where the file exists.
 *
 * @returns {Object} result:
 *   {
 *     success: true/false,
 *     message: "Deleted successfully" | "Failed to delete"
 *   }
 *
 * Steps:
 *   1. Extract the internal file path from the public URL.
 *   2. Decode URL-encoded characters.
 *   3. Call supabase.storage.from(bucket).remove().
 *   4. Return a success/failure response.
 */
async function deleteFromCloud(fileUrl, bucket) {
  if (!fileUrl) throw new Error("File URL is required.");
  if (!bucket) throw new Error("Bucket name is required.");

  // Extract & flatten the file path
  const urlParts = fileUrl.split(`/object/public/${bucket}/`);
  let filePath = urlParts[1];

  if (!filePath) {
    throw new Error("Invalid Supabase file URL.");
  }

  // Decode URL-encoded characters (important)
  filePath = decodeURIComponent(filePath);

  // Delete file from Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error("Delete error:", error);
    return { success: false, message: "Failed to delete file" };
  }

  return { success: true, message: "Deleted successfully" };
}

export default deleteFromCloud;
