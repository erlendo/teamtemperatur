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

async function analyzeNokutQuestions() {
  try {
    const nokutId = '8ae767f5-4027-437e-ae75-d34b3769544c';
    
    console.log('=== NOKUT Team Analysis ===\n');

    // Get questionnaires
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id, name, is_active')
      .eq('team_id', nokutId)
      .order('created_at', { ascending: false });

    if (!questionnaires || questionnaires.length === 0) {
      console.log('No questionnaires found for this team');
      return;
    }

    const activeQ = questionnaires.find(q => q.is_active) || questionnaires[0];
    console.log(`Using Questionnaire: ${activeQ.name} (${activeQ.is_active ? 'active' : 'inactive'})\n`);

    // Get all questions
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, key, label, type, sort_order')
      .eq('questionnaire_id', activeQ.id)
      .order('sort_order', { ascending: true });

    console.log(`Total Questions: ${allQuestions.length}`);
    console.log(`Scale Questions: ${allQuestions.filter(q => q.type === 'scale_1_5').length}`);
    console.log(`Yes/No Questions: ${allQuestions.filter(q => q.type === 'yes_no').length}\n`);

    console.log('Question Details:');
    console.log('-'.repeat(80));

    for (const q of allQuestions) {
      // Get submissions with this question answered
      const { data: answers } = await supabase
        .from('answers')
        .select('submission_id', { count: 'exact' })
        .eq('question_id', q.id);

      const answerCount = answers?.length || 0;
      const typeLabel = q.type === 'scale_1_5' ? '📊' : '❓';
      const status = answerCount > 0 ? '✅' : '❌';

      console.log(`${q.sort_order.toString().padStart(2)} | ${typeLabel} ${status} | ${q.key.padEnd(15)} | ${answerCount.toString().padStart(2)} answers`);
      console.log(`   └─ ${q.label}`);
    }

    // Get submission weeks
    const { data: submissions } = await supabase
      .from('submissions')
      .select('week')
      .eq('team_id', nokutId)
      .order('week', { ascending: false });

    const weeks = [...new Set(submissions.map(s => s.week))];
    console.log(`\nWeeks with submissions: ${weeks.join(', ')}`);

  } catch (err) {
    console.error('Exception:', err);
  }
}

analyzeNokutQuestions();
