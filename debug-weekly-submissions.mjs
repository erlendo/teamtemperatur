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

async function debugWeeklySubmissions() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    const week = 6;
    
    console.log('=== Debugging weekly_submissions CTE ===\n');
    
    // Get all submissions for week 6
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, submitted_by, week, questionnaire_id')
      .eq('team_id', nokutId)
      .eq('week', week);

    console.log(`Raw submissions for week ${week}: ${submissions.length}`);
    submissions.forEach((s, i) => {
      console.log(`  ${i+1}. submitted_by: ${s.submitted_by ? s.submitted_by.substring(0, 8) : 'NULL'}`);
    });

    const distinctSubmitters = new Set(submissions.filter(s => s.submitted_by).map(s => s.submitted_by));
    console.log(`\nDistinct submitted_by: ${distinctSubmitters.size}`);

    // Now simulate what weekly_submissions CTE does
    console.log('\n--- Simulating weekly_submissions CTE ---');
    
    // Get all answers for these submissions
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('submission_id, question_id, value_num')
      .in('submission_id', submissions.map(s => s.id));

    console.log(`Total answer rows: ${allAnswers.length}`);

    // Get questionnaire to filter for scale_1_5
    const { data: qns } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', nokutId)
      .eq('is_active', true)
      .single();

    const { data: questions } = await supabase
      .from('questions')
      .select('id, type')
      .eq('questionnaire_id', qns.id);

    const scale15QuestionIds = questions.filter(q => q.type === 'scale_1_5').map(q => q.id);

    // Filter answers to only scale_1_5
    const scale15Answers = allAnswers.filter(a => scale15QuestionIds.includes(a.question_id));
    console.log(`Scale 1-5 answers: ${scale15Answers.length}`);

    // Group by submission to get unique submitters
    const submittersBySubmission = {};
    submissions.forEach(s => {
      const submitterAnswers = scale15Answers.filter(a => a.submission_id === s.id);
      if (submitterAnswers.length > 0) {
        submittersBySubmission[s.submitted_by] = submittersBySubmission[s.submitted_by] || 0 + 1;
      }
    });

    console.log(`\nSubmission respondents for scale_1_5: ${Object.keys(submittersBySubmission).length}`);

  } catch (err) {
    console.error('Exception:', err);
  }
}

debugWeeklySubmissions();
