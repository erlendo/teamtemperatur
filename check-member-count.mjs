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

async function checkMemberCount() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== Checking Active Members in NOKUT ===\n');

    // Simple count
    const { count: count1 } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact' })
      .eq('team_id', nokutId)
      .eq('status', 'active');

    console.log(`Active memberships (status='active'): ${count1}`);

    // Get all and list them
    const { data: members } = await supabase
      .from('team_memberships')
      .select('user_id, role, status')
      .eq('team_id', nokutId)
      .eq('status', 'active');

    console.log(`\nDetails:`);
    members.forEach((m, i) => {
      console.log(`  ${i+1}. User: ${m.user_id.substring(0, 8)}... | Role: ${m.role}`);
    });

    // Check if there are any inactive members
    const { count: inactiveCount } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact' })
      .eq('team_id', nokutId)
      .neq('status', 'active');

    console.log(`\nInactive memberships: ${inactiveCount}`);

    // What about total?
    const { count: totalCount } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact' })
      .eq('team_id', nokutId);

    console.log(`Total memberships: ${totalCount}`);

    // Maybe the issue is different - check if member_count uses team_memberships or something else
    console.log('\n--- Checking if there might be another count ---');
    
    // Check if there's a settings field or anything
    const { data: teamSettings } = await supabase
      .from('teams')
      .select('*')
      .eq('id', nokutId)
      .single();

    if (teamSettings?.settings) {
      console.log('Team settings:', JSON.stringify(teamSettings.settings, null, 2));
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkMemberCount();
