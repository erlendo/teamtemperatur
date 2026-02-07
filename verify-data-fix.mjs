#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hkmtdglonpsudfuhxcpk.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: {
    schema: "public",
  },
});

async function verifyDataFix() {
  try {
    console.log("Verifying the underlying data for week 6...\n");

    const teamId = "dbbd1841-eee9-4091-968e-69b8b6214b8e";
    const week = 6;

    // Count distinct submissions for week 6
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, submitted_by, week")
      .eq("team_id", teamId)
      .eq("week", week);

    if (subError) {
      console.error("Error fetching submissions:", subError);
      return;
    }

    console.log(`Week ${week} submissions:`);
    console.log(`  Total submissions: ${submissions.length}`);
    console.log(`  Distinct users: ${new Set(submissions.map((s) => s.submitted_by)).size}`);

    const distinctUsers = new Set(submissions.map((s) => s.submitted_by));
    console.log(`  User IDs: ${Array.from(distinctUsers).join(", ")}\n`);

    // Count answers for scale_1_5 questions
    const { data: answers, error: ansError } = await supabase
      .from("answers")
      .select("a:id, submission_id, question_id, value_num, q:questions(type)")
      .in(
        "submission_id",
        submissions.map((s) => s.id)
      );

    if (ansError) {
      console.error("Error fetching answers:", ansError);
      return;
    }

    console.log(`Answers in week ${week}:`);
    console.log(`  Total answer records: ${answers.length}`);

    // Count by type
    const byType = {};
    answers.forEach((a) => {
      const type = a.q?.type || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Verify all respondents have scale_1_5 answers
    console.log(`\nChecking if all ${distinctUsers.size} users have scale_1_5 answers...`);
    const scale15Answers = answers.filter((a) => a.q?.type === "scale_1_5");
    const usersWithScale15 = new Set(
      scale15Answers
        .map((a) => {
          const sub = submissions.find((s) => s.id === a.submission_id);
          return sub?.submitted_by;
        })
        .filter(Boolean)
    );

    console.log(`  Users with scale_1_5 answers: ${usersWithScale15.size}`);
    console.log(`  Missing users: ${distinctUsers.size - usersWithScale15.size}\n`);

    if (distinctUsers.size === usersWithScale15.size) {
      console.log("✅ All respondents have scale_1_5 answers");
      console.log(`✅ RPC should return response_count: ${usersWithScale15.size}`);
    } else {
      console.log("❌ Some respondents missing scale_1_5 answers");
      const missing = Array.from(distinctUsers).filter((u) => !usersWithScale15.has(u));
      console.log(`   Missing for users: ${missing.join(", ")}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

verifyDataFix();
