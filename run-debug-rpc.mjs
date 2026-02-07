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

async function runDebugRPCFunction() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Creating and Running Debug RPC Function ===\n');
    
    // First, create the debug function
    const createFunctionSQL = fs.readFileSync('/Users/erlendo/Teamtemperatur/debug-rpc-nokut.sql', 'utf-8').split('\n').slice(0, 100).join('\n');
    
    // Try to call the debug function
    const { data, error } = await supabase.rpc('debug_get_team_year_stats', {
      p_team_id: nokutId
    });

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('Debug function does not exist yet.');
        console.log('Trying an alternative approach using raw SQL...\n');
        
        // Use regular query to simulate the calculations
        // Get week 6 data manually
        const { data: submissions } = await supabase
          .from('submissions')
          .select('id, submitted_by')
          .eq('team_id', nokutId)
          .eq('week', 6);

        const { data: memberships } = await supabase
          .from('team_memberships')
          .select('user_id')
          .eq('team_id', nokutId)
          .eq('status', 'active');

        const respondents = new Set(submissions.map(s => s.submitted_by));
        const responseRate = (respondents.size / memberships.length) * 100;

        console.log('SIMULATED RESULT:');
        console.log(`Week: 6`);
        console.log(`Response Count: ${respondents.size}`);
        console.log(`Member Count: ${memberships.length}`);
        console.log(`Response Rate: ${responseRate.toFixed(1)}%`);
        
        // Get questions
        const { data: questionnaires } = await supabase
          .from('questionnaires')
          .select('id')
          .eq('team_id', nokutId)
          .eq('is_active', true)
          .single();

        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('questionnaire_id', questionnaires.id)
          .eq('type', 'scale_1_5');

        console.log(`Question Count: ${questions.length}`);
        
      } else {
        console.error('RPC Error:', error.message);
      }
    } else {
      const week6 = data?.find(d => d.week === 6);
      if (week6) {
        console.log('✅ DEBUG RPC RESULT FOR WEEK 6:');
        console.log('-----------------------------------');
        console.log(`Response Count: ${week6.response_count}`);
        console.log(`Member Count: ${week6.member_count}`);
        console.log(`Response Rate: ${week6.response_rate}%`);
        console.log(`Questions: ${week6.num_questions || 0}`);
      }
    }

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

runDebugRPCFunction();
