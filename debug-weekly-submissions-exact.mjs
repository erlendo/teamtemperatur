#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function debugWeeklySubmissionsQuery() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Simulating EXACT weekly_submissions CTE Query ===\n');
    
    // Get all data needed
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, submitted_by, week')
      .eq('team_id', nokutId)
      .gte('week', 1)
      .lte('week', 6);

    const { data: answers } = await supabase
      .from('answers')
      .select('submission_id, question_id, value_num')
      .in('submission_id', submissions.map(s => s.id));

    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', nokutId)
      .eq('is_active', true)
      .single();

    const { data: questions } = await supabase
      .from('questions')
      .select('id, type')
      .eq('questionnaire_id', questionnaires.id);

    console.log(`Input data:`);
    console.log(`  Submissions: ${submissions.length}`);
    console.log(`  Answers: ${answers.length}`);
    console.log(`  Questions: ${questions.length}`);
    console.log(`  Scale 1-5 Questions: ${questions.filter(q => q.type === 'scale_1_5').length}\n`);

    // Simulate: FROM submissions s JOIN answers a ON a.submission_id = s.id JOIN questions q ON q.id = a.question_id
    // WHERE team_id = nokutId AND s.week BETWEEN 1 AND 6
    // GROUP BY s.week
    // SELECT count(distinct s.submitted_by)::int as respondents

    const byWeek = {};
    
    // For each answer, try to join
    for (const answer of answers) {
      const sub = submissions.find(s => s.id === answer.submission_id);
      const q = questions.find(q => q.id === answer.question_id);
      
      if (sub && q && sub.team_id === nokutId) {  // Simulate the WHERE clause (team_id check happens earlier)
        const week = sub.week;
        if (!byWeek[week]) {
          byWeek[week] = new Set();
        }
        byWeek[week].add(sub.submitted_by);
      }
    }

    console.log('Results by week (count distinct submitted_by):');
    for (const [week, respondents] of Object.entries(byWeek)) {
      console.log(`  Week ${week}: ${respondents.size} respondents`);
    }

    // Now check week 6 specifically with the WHERE 'a.value_num IS NOT NULL' that's implicit
    console.log('\n--- Week 6 with value_num filter ---');
    const week6WithValueNum = new Set();
    for (const answer of answers) {
      const sub = submissions.find(s => s.id === answer.submission_id);
      if (sub && sub.week === 6 && answer.value_num !== null) {
        const q = questions.find(q => q.id === answer.question_id);
        if (q && q.type === 'scale_1_5') {  // filter (where q.type = 'scale_1_5')
          week6WithValueNum.add(sub.submitted_by);
        }
      }
    }

    console.log(`Week 6 respondents (with value_num NOT NULL): ${week6WithValueNum.size}`);

  } catch (err) {
    console.error('Exception:', err);
  }
}

debugWeeklySubmissionsQuery();
