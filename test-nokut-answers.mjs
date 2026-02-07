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

async function checkNokutData() {
  try {
    console.log('=== Checking NOKUT team weeks ===\n');
    
    // First, get all weeks with submissions
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('week')
      .eq('team_id', '8ae767f5-4027-437e-ae75-d34b3769544c')
      .order('week', { ascending: false });

    if (submissionError) {
      console.error('Error fetching submissions:', submissionError);
      return;
    }

    const weeks = [...new Set(submissions.map(s => s.week))];
    console.log(`Weeks with data: ${weeks.join(', ')}\n`);

    // For the latest week, check how many questions have answers
    if (weeks.length > 0) {
      const latestWeek = weeks[0];
      console.log(`Analyzing latest week: ${latestWeek}\n`);

      const { data: questionnaires, error: qError } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('team_id', '8ae767f5-4027-437e-ae75-d34b3769544c')
        .eq('is_active', true)
        .single();

      if (qError) {
        console.error('Error fetching questionnaire:', qError);
        return;
      }

      // Get all scale_1_5 questions
      const { data: questions, error: qsError } = await supabase
        .from('questions')
        .select('id, key, label, sort_order')
        .eq('questionnaire_id', questionnaires.id)
        .eq('type', 'scale_1_5')
        .order('sort_order', { ascending: true });

      if (qsError) {
        console.error('Error fetching questions:', qsError);
        return;
      }

      console.log(`Total scale_1_5 questions: ${questions.length}\n`);
      console.log('Question Status:');
      console.log('-'.repeat(60));

      // For each question, check if it has answers in latest week
      for (const q of questions) {
        const { count, error: countError } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', q.id)
          .in('submission_id', 
            submissions
              .filter(s => s.week === latestWeek)
              .map(s => s.id)
          );

        if (countError) {
          console.log(`${q.key.padEnd(20)} ❌ ERROR`);
        } else {
          const status = count > 0 ? '✅' : '❌';
          console.log(`${q.key.padEnd(20)} ${status} ${count} answers`);
        }
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkNokutData();
