import { createClient } from "@supabase/supabase-js";

// createClient() throws synchronously if the URL is missing, which would crash the whole
// server at startup (via the whole app.js import chain) rather than just the document-upload
// feature that actually needs it. Stay unconfigured-but-non-fatal instead, same pattern as
// service/geocode.js for Mapbox.
let supabaseClient = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
} else {
  console.warn("[supabase] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — document upload/delete will not work");
}

export default supabaseClient;