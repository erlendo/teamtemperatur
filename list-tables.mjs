import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  try {
    // Query directly from pg_tables
    const { data, error } = await supabase.from("pg_tables").select("tablename").eq("schemaname", "public");
    
    console.log("Error:", error);
    console.log("Tables:", data?.map(t => t.tablename).sort());
  } catch (err) {
    console.error("Error:", err);
  }
}

listAllTables();
