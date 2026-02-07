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

async function findMissingAnswers() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Checking for NULL or Missing Answers ===\n');
    
    // Get submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, submitted_by, week')
      .eq('team_id', nokutId)
      .eq('week', 6);

    console.log(`Week 6 submissions: ${submissions.length}\n`);

    // For each submission, check answers
    for (const sub of submissions) {
      const { data: answers } = await supabase
        .from('answers')
        .select('id, question_id, value_num, value_bool, value_text')
        .eq('submission_id', sub.id);

      console.log(`Submission ${sub.id.substring(0, 8)}:`);
      console.log(`  Total answers: ${answers.length}`);
      
      const nullAnswers = answers.filter(a => a.value_num === null && a.value_bool === null && a.value_text === null);
      if (nullAnswers.length > 0) {
        console.log(`  ⚠️  NULL answers: ${nullAnswers.length}`);
        nullAnswers.forEach(a => {
          console.log(`     - Question: ${a.question_id}`);
        });
      }

      // Check for answers with NULL value_num specifically (scale_1_5)
      const nullNumAnswers = answers.filter(a => a.value_num === null);
      if (nullNumAnswers.length > 0) {
        console.log(`  ⚠️  NULL value_num: ${nullNumAnswers.length}`);
      }
      console.log();
    }

    // Also check with the weekly_submissions logic
    console.log('\n--- Simulating weekly_submissions CTE JOIN logic ---\n');
    
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

    // Get all answers for week 6 submissions
    const submissionIds = submissions.map(s => s.id);
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('submission_id, question_id, value_num')
      .in('submission_id', submissionIds);

    // Count distinct submitters that appear in answers joined with questions
    const distinctInJoin = new Set();
    for (const answer of allAnswers) {
      const q = questions.find(x => x.id === answer.question_id);
      const sub = submissions.find(s => s.id === answer.submission_id);
      if (q && sub && answer.value_num !== null) {  // This is the filter from weekly_submissions
        distinctInJoin.add(sub.submitted_by);
      }
    }

    console.log(`\nDistinct submitted_by in JOIN result: ${distinctInJoin.size}`);
    console.log(`Total distinct submitted_by: ${new Set(submissions.map(s => s.submitted_by)).size}`);

    if (distinctInJoin.size < new Set(submissions.map(s => s.submitted_by)).size) {
      console.log('\n⚠️  MISSING RESPONDENTS! Some submissions are not counted by the JOIN');
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

findMissingAnswers();
