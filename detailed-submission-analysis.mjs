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

async function detailedSubmissionAnalysis() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    const week = 6;
    
    console.log('=== Detailed Submission Analysis for Week 6 ===\n');
    
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, submitted_by')
      .eq('team_id', nokutId)
      .eq('week', week)
      .order('submitted_by');

    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', nokutId)
      .eq('is_active', true)
      .single();

    const { data: questions } = await supabase
      .from('questions')
      .select('id, key, type')
      .eq('questionnaire_id', questionnaires.id)
      .order('sort_order');

    console.log(`Submissions: ${submissions.length}`);
    console.log(`Questions: ${questions.length} total (${questions.filter(q => q.type === 'scale_1_5').length} scale_1_5)\n`);

    console.log('Answers per submission:\n');

    for (const sub of submissions) {
      const { data: answers } = await supabase
        .from('answers')
        .select('question_id')
        .eq('submission_id', sub.id);

      const scale15Answered = answers.filter(a => {
        const q = questions.find(x => x.id === a.question_id);
        return q?.type === 'scale_1_5';
      }).length;

      const scale15Total = questions.filter(q => q.type === 'scale_1_5').length;

      console.log(`Submission ${sub.id.substring(0, 8)}: ${scale15Answered}/${scale15Total} scale_1_5 questions answered`);

      if (scale15Answered < scale15Total) {
        const answered = answers.map(a => a.question_id);
        const missing = questions.filter(q => q.type === 'scale_1_5' && !answered.includes(q.id));
        console.log(`  Missing: ${missing.map(m => m.key).join(', ')}`);
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

detailedSubmissionAnalysis();
