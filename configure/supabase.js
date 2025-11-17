import { createClient } from "@supabase/supabase-js";

const  supabaseClient =  createClient(
            process.env.SUPABASE,
            process.env.SUPABASEAPIKEY   
    );




export default supabaseClient;