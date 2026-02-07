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

async function debugWeekStats() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Debugging get_team_year_stats Logic ===\n');
    
    // Step 1: Get submissions for week 6
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, week, questionnaire_id')
      .eq('team_id', nokutId)
      .eq('week', 6);

    console.log(`Week 6 submissions: ${submissions.length}`);
    console.log(`Questionnaire IDs: ${[...new Set(submissions.map(s => s.questionnaire_id))].join(', ')}\n`);

    // Step 2: Get all questionnaires for NOKUT
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id, name, is_active')
      .eq('team_id', nokutId);

    console.log('All Questionnaires:');
    questionnaires.forEach(q => {
      console.log(`  - ${q.name} (${q.id}) - ${q.is_active ? '✅ active' : '❌ inactive'}`);
    });

    // Step 3: For each questionnaire, count scale_1_5 questions
    console.log('\nQuestions per questionnaire:');
    for (const q of questionnaires) {
      const { data: questions } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .eq('questionnaire_id', q.id)
        .eq('type', 'scale_1_5');

      console.log(`  ${q.name}: ${questions?.length || 0} scale_1_5 questions`);
    }

    // Step 4: Check what answers exist for week 6
    const { data: allAnswersWeek6 } = await supabase
      .from('answers')
      .select('question_id')
      .in('submission_id', submissions.map(s => s.id));

    const uniqueQuestions = [...new Set(allAnswersWeek6.map(a => a.question_id))];
    console.log(`\nUnique questions with answers in week 6: ${uniqueQuestions.length}`);

    // Step 5: What questions belong to each questionnaire
    console.log('\nMapping questions to questionnaires:');
    const qByQuestionnaire = {};
    for (const qn of questionnaires) {
      const { data: qs } = await supabase
        .from('questions')
        .select('id, key')
        .eq('questionnaire_id', qn.id)
        .eq('type', 'scale_1_5');
      qByQuestionnaire[qn.id] = qs.map(q => q.id);
      console.log(`  ${qn.name}: [${qs.map(q => q.key).join(', ')}]`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

debugWeekStats();
