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

async function analyzeDiscrepancy() {
  try {
    const nokutId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e';
    
    console.log('=== ANALYZING THE DISCREPANCY ===\n');
    
    // Check active members
    const { count: activeMemberCount } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact' })
      .eq('team_id', nokutId)
      .eq('status', 'active');

    console.log(`Active members in team: ${activeMemberCount}`);

    // Check week 6 submissions
    const { data: week6Subs } = await supabase
      .from('submissions')
      .select('id, submitted_by, submitted_at')
      .eq('team_id', nokutId)
      .eq('week', 6);

    console.log(`Week 6 submissions: ${week6Subs.length}`);
    
    const uniqueRespondents = new Set(week6Subs.map(s => s.submitted_by));
    console.log(`Week 6 unique respondents: ${uniqueRespondents.size}`);
    console.log(`Response rate: ${uniqueRespondents.size}/${activeMemberCount} = ${(uniqueRespondents.size/activeMemberCount*100).toFixed(0)}%\n`);

    // If not matching, find who didn't respond
    if (uniqueRespondents.size < activeMemberCount) {
      const { data: members } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', nokutId)
        .eq('status', 'active');

      const memberIds = new Set(members.map(m => m.user_id));
      const nonRespondents = [...memberIds].filter(id => !uniqueRespondents.has(id));
      
      console.log(`Members who did NOT respond in week 6: ${nonRespondents.length}`);
      nonRespondents.forEach((id, i) => {
        console.log(`  ${i+1}. ${id}`);
      });
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

analyzeDiscrepancy();
