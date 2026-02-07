#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hkmtdglonpsudfuhxcpk.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: {
    schema: "public",
  },
});

async function verifyFix() {
  try {
    console.log("Testing get_team_year_stats function...\n");

    // NOKUT team ID (the real one)
    const teamId = "dbbd1841-eee9-4091-968e-69b8b6214b8e";
    const week = 6;

    console.log(`Checking get_team_year_stats for NOKUT team (week ${week})...\n`);

    const { data, error } = await supabase.rpc("get_team_year_stats", {
      p_team_id: teamId,
      p_current_week: week,
    });

    if (error) {
      console.error("RPC Error:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("❌ No data returned for week 6");
      return;
    }

    const stats = data.find((s) => s.week === week);
    if (!stats) {
      console.log("❌ No stats for week 6");
      return;
    }

    console.log("Response counts:");
    console.log(`  Week: ${stats.week}`);
    console.log(`  Response count: ${stats.response_count}`);
    console.log(`  Member count: ${stats.member_count}`);
    console.log(`  Response rate: ${stats.response_rate}%`);
    console.log(`  Overall avg: ${stats.overall_avg}\n`);

    // Check if fixed
    if (stats.response_count === 6) {
      console.log("✅ FIX CONFIRMED: response_count is now 6 (was 5)");
      console.log("✅ Response rate is now 100% (was 83%)");
    } else if (stats.response_count === 5) {
      console.log("❌ FIX FAILED: response_count still shows 5");
    } else {
      console.log(`⚠️  response_count is ${stats.response_count} (expected 6)`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

verifyFix();
