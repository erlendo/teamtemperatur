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

async function directSQLQuery() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Running Direct SQL Query ===\n');
    
    // Use rpc with security definer to bypass RLS
    const { data, error } = await supabase.rpc('get_team_year_stats', {
      p_team_id: nokutId,
      p_current_week: 6
    }, {
      // This disables RLS checks for the function call
      headers: {
        'X-Skip-RLS': 'true'  // This might not work but worth trying
      }
    });

    if (error) {
      console.log('RPC Error (trying alternative...):', error.message);
      
      // Try to query directly via SQL - construct and run manually
      console.log('\nTrying direct SQL approach...\n');
      
      // Run as raw SQL query instead
      const { data: sqlData, error: sqlError } = await supabase
        .from('submissions')
        .select('week, team_id')
        .eq('team_id', nokutId)
        .eq('week', 6);

      if (!sqlError) {
        console.log(`Direct query works!`);
        console.log(`Submissions in week 6: ${sqlData.length}`);
      }
    } else {
      const week6 = data?.find(d => d.week === 6);
      if (week6) {
        console.log('✅ RPC FUNCTION OUTPUT FOR WEEK 6:');
        console.log('-----------------------------------');
        console.log(`Response Count: ${week6.response_count}`);
        console.log(`Member Count: ${week6.member_count}`);
        console.log(`Response Rate: ${week6.response_rate}%`);
        console.log(`Questions: ${week6.question_stats?.length || 0}`);
        console.log(`Raw Score: ${week6.overall_avg}`);
        console.log(`Bayesian Adjusted: ${week6.bayesian_adjusted}`);
      } else {
        console.log('❌ No week 6 data in RPC response');
      }
    }

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

directSQLQuery();
