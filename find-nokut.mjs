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

async function findNokut() {
  try {
    console.log('=== Finding NOKUT Team ===\n');

    // Get all teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name');

    const nokut = teams.find(t => t.name.includes('NOKUT'));
    
    if (!nokut) {
      console.log('NOKUT team not found!');
      console.log('Available teams:', teams.map(t => t.name).join(', '));
      return;
    }

    console.log(`Found NOKUT: ${nokut.id}\n`);

    // Now analyze NOKUT
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id, name, is_active')
      .eq('team_id', nokut.id)
      .order('created_at', { ascending: false });

    console.log(`Questionnaires: ${questionnaires.length}`);
    questionnaires.forEach(q => {
      console.log(`  - ${q.name} (${q.is_active ? '✅ active' : '❌ inactive'})`);
    });

    if (questionnaires.length === 0) {
      console.log('\nNo questionnaires found!');
      return;
    }

    const activeQ = questionnaires.find(q => q.is_active) || questionnaires[0];

    // Get questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id, key, label, type, sort_order')
      .eq('questionnaire_id', activeQ.id)
      .order('sort_order', { ascending: true });

    console.log(`\nUsing: ${activeQ.name}`);
    console.log(`Total Questions: ${questions.length}`);
    console.log(`Scale (1-5) Questions: ${questions.filter(q => q.type === 'scale_1_5').length}`);
    console.log(`Yes/No Questions: ${questions.filter(q => q.type === 'yes_no').length}`);
    console.log('\nQuestions with answer counts:');
    console.log('-'.repeat(80));

    for (const q of questions) {
      const { count: answerCount } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', q.id);

      const typeLabel = q.type === 'scale_1_5' ? '📊' : '❓';
      const status = answerCount > 0 ? '✅' : '❌';

      console.log(`${q.sort_order.toString().padStart(2)} | ${typeLabel} ${status} | ${q.key.padEnd(15)} | ${answerCount.toString().padStart(2)} answers`);
      console.log(`   └─ "${q.label}"`);
    }

    // Summary
    const scaleQuestions = questions.filter(q => q.type === 'scale_1_5');
    const questionsWithAnswers = scaleQuestions.filter(async q => {
      const { count } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', q.id);
      return count > 0;
    });

  } catch (err) {
    console.error('Exception:', err);
  }
}

findNokut();
