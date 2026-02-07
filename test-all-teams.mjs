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

async function checkAllData() {
  try {
    console.log('=== Analyzing all teams and data ===\n');
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }

    console.log(`Total teams: ${teams.length}\n`);
    
    for (const team of teams) {
      const { count: submissionCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('team_id', team.id)
        .eq('is_active', true)
        .single();

      const questionCount = questionnaires ? 
        (await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('questionnaire_id', questionnaires.id)).count || 0
        : 0;

      console.log(`${team.name.padEnd(30)} | Submissions: ${submissionCount} | Questions: ${questionCount}`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkAllData();
