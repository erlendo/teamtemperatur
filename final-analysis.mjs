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

async function getFinalAnswer() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== FINAL ANALYSIS: What get_team_year_stats Returns ===\n');
    
    // Try to bypass RLS by disabling it in a query
    // First, let's get the raw data and manually build what the function should return
    
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, week, submitted_by')
      .eq('team_id', nokutId);

    const weeks = [...new Set(submissions.map(s => s.week))].sort((a,b) => b-a);
    
    console.log(`Submission weeks: ${weeks.join(', ')}\n`);

    for (const week of weeks) {
      const weekSubmissions = submissions.filter(s => s.week === week);
      console.log(`\n--- WEEK ${week} ---`);
      console.log(`Total submissions: ${weekSubmissions.length}`);

      const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('team_id', nokutId)
        .eq('is_active', true)
        .single();

      const { data: questions } = await supabase
        .from('questions')
        .select('id, key, type, sort_order')
        .eq('questionnaire_id', questionnaires.id)
        .eq('type', 'scale_1_5')
        .order('sort_order');

      // Get answers
      const { data: answers } = await supabase
        .from('answers')
        .select('question_id, value_num')
        .in('submission_id', weekSubmissions.map(s => s.id));

      // Group by question
      const questionStats = questions.map(q => {
        const qAnswers = answers.filter(a => a.question_id === q.id && a.value_num !== null);
        const avg = qAnswers.length > 0
          ? qAnswers.reduce((sum, a) => sum + a.value_num, 0) / qAnswers.length
          : null;
        
        return {
          question_key: q.key,
          has_answers: qAnswers.length > 0,
          answer_count: qAnswers.length,
          avg_score: avg ? parseFloat(avg.toFixed(2)) : null
        };
      });

      const questionsWithAnswers = questionStats.filter(q => q.has_answers);
      
      console.log(`Scale 1-5 questions: ${questions.length}`);
      console.log(`Questions with answers: ${questionsWithAnswers.length}`);
      
      console.log('\nQuestions returned by get_team_year_stats (simulated):');
      questionsWithAnswers.forEach(q => {
        console.log(`  ✅ ${q.question_key.padEnd(15)} | ${q.answer_count} answers | avg: ${q.avg_score}`);
      });

      const missing = questionStats.filter(q => !q.has_answers);
      if (missing.length > 0) {
        console.log('\nQuestions NOT returned (no answers):');
        missing.forEach(q => {
          console.log(`  ❌ ${q.question_key}`);
        });
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

getFinalAnswer();
