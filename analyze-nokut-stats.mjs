#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function analyzeNokutStats() {  
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Debugging NOKUT Statistics ===\n');
    
    // Get submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, week, submitted_by')
      .eq('team_id', nokutId)
      .order('week', { ascending: false });

    const weeks = [...new Set(submissions.map(s => s.week))];
    console.log(`Weeks with submissions: ${weeks.join(', ')}\n`);

    // Get questionnaire
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', nokutId)
      .eq('is_active', true)
      .single();

    // Get all scale_1_5 questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id, key, type, sort_order')
      .eq('questionnaire_id', questionnaires.id)
      .eq('type', 'scale_1_5')
      .order('sort_order', { ascending: true });

    console.log(`Total scale_1_5 questions: ${questions.length}\n`);

    // For the latest week, analyze
    const latestWeek = weeks[0];
    const weekSubmissions = submissions.filter(s => s.week === latestWeek);
    
    console.log(`\n=== Analysis for Week ${latestWeek} ===`);
    console.log(`Submissions: ${weekSubmissions.length}`);
    console.log(`Respondents: ${new Set(weekSubmissions.map(s => s.submitted_by)).size}\n`);

    // Check answers per question
    console.log('Answers per question:');
    console.log('-'.repeat(60));
    
    for (const q of questions) {
      const { data: answers } = await supabase
        .from('answers')
        .select('id, value_num')
        .eq('question_id', q.id)
        .in('submission_id', weekSubmissions.map(s => s.id));

      const avgScore = answers?.length > 0
        ? (answers.reduce((sum, a) => sum + (a.value_num || 0), 0) / answers.length).toFixed(2)
        : null;

      console.log(`${q.key.padEnd(15)} | ${answers?.length || 0} answers | avg: ${avgScore}`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

analyzeNokutStats();
