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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkNokutWeeks() {
  try {
    console.log('Fetching weeks with submissions for NOKUT team...\n');
    
    const { data, error } = await supabase.rpc('get_team_year_stats', {
      p_team_id: '8ae767f5-4027-437e-ae75-d34b3769544c',
      p_current_week: null,
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Results from get_team_year_stats:');
    console.log('================================\n');
    
    data.forEach((row) => {
      console.log(`Week ${row.week}:`);
      console.log(`  Response Count: ${row.response_count}`);
      console.log(`  Member Count: ${row.member_count}`);
      console.log(`  Response Rate: ${row.response_rate}%`);
      console.log(`  Questions in stats: ${row.question_stats?.length || 0}`);
      
      if (row.question_stats && row.question_stats.length > 0) {
        console.log(`  Question keys: ${row.question_stats.map(q => q.question_key).join(', ')}`);
      }
      console.log();
    });

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkNokutWeeks();
