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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRPCWithBothClients() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Testing RPC with different clients ===\n');

    // Try with service role (no RLS)
    console.log('1. Service Role Client (no RLS):');
    const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data: srvData, error: srvErr } = await supabaseService.rpc(
      'get_team_year_stats',
      { p_team_id: nokutId, p_current_week: 6 }
    );

    if (srvErr) {
      console.log(`   Error: ${srvErr.message}`);
    } else {
      const week6Data = srvData?.find(d => d.week === 6);
      if (week6Data) {
        console.log(`   Week 6 - Response Count: ${week6Data.response_count}, Member Count: ${week6Data.member_count}`);
        console.log(`   Response Rate: ${week6Data.response_rate}%`);
        console.log(`   Question Stats: ${week6Data.question_stats?.length || 0} questions`);
      } else {
        console.log(`   No data for week 6`);
      }
    }

    // Try with anon key (will hit RLS)
    console.log('\n2. Anon Client (with RLS):');
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    
    const { data: anonData, error: anonErr } = await supabaseAnon.rpc(
      'get_team_year_stats',
      { p_team_id: nokutId, p_current_week: 6 }
    );

    if (anonErr) {
      console.log(`   Error: ${anonErr.message}`);
    } else if (!anonData || anonData.length === 0) {
      console.log(`   No data (likely RLS blocking)`);
    } else {
      const week6Data = anonData?.find(d => d.week === 6);
      if (week6Data) {
        console.log(`   Week 6 - Response Count: ${week6Data.response_count}, Member Count: ${week6Data.member_count}`);
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

testRPCWithBothClients();
