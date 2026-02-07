import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTagInsert() {
  try {
    // Get first team and item for testing
    const { data: teams } = await supabase.from("teams").select("id").limit(1);
    if (!teams || teams.length === 0) {
      console.log("No teams found");
      return;
    }
    const teamId = teams[0].id;
    console.log("Testing with team:", teamId);

    // Get first item in team
    const { data: items } = await supabase
      .from("team_items")
      .select("id")
      .eq("team_id", teamId)
      .limit(1);

    if (!items || items.length === 0) {
      console.log("No items found in team");
      return;
    }
    const itemId = items[0].id;
    console.log("Testing with item:", itemId);

    // Try to insert a test tag (using service role key which bypasses RLS)
    const testTag = `test-${Date.now()}`;
    console.log("Attempting to insert tag:", testTag);

    const { data, error } = await supabase.from("team_item_tags").insert({
      item_id: itemId,
      tag_name: testTag,
    });

    if (error) {
      console.error("❌ Insert failed:", error);
      return;
    }

    console.log("✅ Tag inserted successfully:", data);

    // Try to read it back
    const { data: tags, error: readError } = await supabase
      .from("team_item_tags")
      .select("*")
      .eq("item_id", itemId)
      .eq("tag_name", testTag);

    if (readError) {
      console.error("❌ Read failed:", readError);
      return;
    }

    console.log("✅ Tag found:", tags);

    // Clean up
    const { error: deleteError } = await supabase
      .from("team_item_tags")
      .delete()
      .eq("item_id", itemId)
      .eq("tag_name", testTag);

    if (deleteError) {
      console.error("❌ Delete failed:", deleteError);
      return;
    }

    console.log("✅ Tag cleaned up successfully");
  } catch (err) {
    console.error("Error:", err);
  }
}

testTagInsert();
