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

async function testGetYearStats() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e'; // The actual NOKUT ID

    console.log('=== Testing get_team_year_stats ===\n');
    console.log(`NOKUT Team ID: ${nokutId}\n`);

    const { data, error } = await supabase.rpc('get_team_year_stats', {
      p_team_id: nokutId,
      p_current_week: null,
    });

    if (error) {
      console.error('RPC Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No data returned from get_team_year_stats');
      return;
    }

    console.log(`Weeks returned: ${data.length}\n`);

    for (const week of data) {
      console.log(`\nWeek ${week.week}:`);
      console.log(`  Response Count: ${week.response_count}`);
      console.log(`  Member Count: ${week.member_count}`);
      console.log(`  Response Rate: ${week.response_rate}%`);
      
      const questions = week.question_stats || [];
      console.log(`  Questions in stats: ${questions.length}`);
      
      if (questions.length > 0) {
        console.log(`  Question keys: ${questions.map(q => q.question_key).join(', ')}`);
      } else {
        console.log(`  ⚠️  NO QUESTIONS IN THIS WEEK!`);
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

testGetYearStats();
