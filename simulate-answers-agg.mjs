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

async function analyzeAnswersAgg() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    const week = 6;
    
    console.log('=== Simulating get_team_year_stats logic ===\n');
    
    // Step 1: Get submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, week, submitted_by')
      .eq('team_id', nokutId)
      .eq('week', week);

    const submissionIds = submissions.map(s => s.id);
    console.log(`Submissions for week ${week}: ${submissionIds.length}\n`);

    // Step 2: Get answers_agg (aggregated answers)
    const { data: answers } = await supabase
      .from('answers')
      .select('question_id, value_num')
      .in('submission_id', submissionIds);

    console.log(`Total answers found: ${answers.length}`);

    // Group by question_id
    const answersByQuestion = {};
    answers.forEach(a => {
      if (!answersByQuestion[a.question_id]) {
        answersByQuestion[a.question_id] = [];
      }
      answersByQuestion[a.question_id].push(a.value_num);
    });

    console.log(`Unique questions answered: ${Object.keys(answersByQuestion).length}\n`);

    // Step 3: Get questions to see what they are
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', nokutId)
      .eq('is_active', true)
      .single();

    const { data: allQs } = await supabase
      .from('questions')
      .select('id, key, type, sort_order')
      .eq('questionnaire_id', questionnaires.id)
      .order('sort_order');

    console.log('Questions that have answers:');
    console.log('-'.repeat(70));

    for (const [qId, values] of Object.entries(answersByQuestion)) {
      const q = allQs.find(x => x.id === qId);
      const avg = values.length > 0 ? (values.reduce((a,b) => a+b, 0) / values.length).toFixed(2) : 'N/A';
      
      if (q) {
        console.log(`${q.sort_order.toString().padStart(2)} | ${q.key.padEnd(15)} | ${q.type.padEnd(10)} | avg: ${avg} | ${values.length} answers`);
      } else {
        console.log(`   | UNKNOWN (${qId}) | | avg: ${avg} | ${values.length} answers`);
      }
    }

    // Check for missing questions (scale_1_5 that don't have answers)
    const scale15Qs = allQs.filter(q => q.type === 'scale_1_5');
    const questionsWithAnswers = Object.keys(answersByQuestion);
    const missingQuestions = scale15Qs.filter(q => !questionsWithAnswers.includes(q.id));

    if (missingQuestions.length > 0) {
      console.log('\n❌ Missing questions (scale_1_5 with NO answers):');
      missingQuestions.forEach(q => {
        console.log(`   - ${q.key}`);
      });
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

analyzeAnswersAgg();
