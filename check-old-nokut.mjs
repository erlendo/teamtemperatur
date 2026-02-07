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

async function checkOldNokut() {
  try {
    const oldNokutId = '8ae767f5-4027-437e-ae75-d34b3769544c';
    
    console.log('=== Checking OLD NOKUT Team ===\n');
    console.log(`ID: ${oldNokutId}\n`);

    const { data: team } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', oldNokutId)
      .single();

    if (team) {
      console.log(`Team found: ${team.name}`);

      const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id, name, is_active')
        .eq('team_id', oldNokutId);

      console.log(`\nQuestionnaires: ${questionnaires.length}`);
      
      for (const q of questionnaires) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact' })
          .eq('questionnaire_id', q.id)
          .eq('type', 'scale_1_5');

        console.log(`  - ${q.name}: ${count} scale_1_5 questions (${q.is_active ? '✅' : '❌'})`);
      }

      // Check submissions
      const { count: subCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact' })
        .eq('team_id', oldNokutId);

      console.log(`\nSubmissions in old NOKUT: ${subCount}`);
    } else {
      console.log('❌ Old NOKUT Team NOT found');
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkOldNokut();
