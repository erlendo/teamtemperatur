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

async function simulateGetTeamYearStats(teamId, currentWeek = null) {
  try {
    // Get current week if not provided
    if (!currentWeek) {
      const d = new Date();
      const start = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
      currentWeek = Math.ceil((days + start.getDay() + 1) / 7);
    }

    const vStartWeek = Math.max(1, currentWeek - 51);
    
    console.log(`=== Simulating get_team_year_stats ===`);
    console.log(`Team ID: ${teamId}`);
    console.log(`Current Week: ${currentWeek}`);
    console.log(`Data from week ${vStartWeek} to ${currentWeek}\n`);

    // Get active member count
    const { count: memberCount } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact' })
      .eq('team_id', teamId)
      .eq('status', 'active');

    // Get submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, week, submitted_by')
      .eq('team_id', teamId)
      .gte('week', vStartWeek)
      .lte('week', currentWeek);

    // Get questionnaire
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    // Get questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id, key, label, type, sort_order')
      .eq('questionnaire_id', questionnaires.id);

    const scale15Questions = questions.filter(q => q.type === 'scale_1_5');

    // Get all answers
    const { data: answers } = await supabase
      .from('answers')
      .select('submission_id, question_id, value_num')
      .in('submission_id', submissions.map(s => s.id));

    console.log(`DETAILED BREAKDOWN:`);
    console.log(`Total submissions: ${submissions.length}`);
    console.log(`Active members: ${memberCount}`);
    console.log(`Scale 1-5 questions: ${scale15Questions.length}`);
    console.log(`Total answers: ${answers.length}\n`);

    // For week 6 specifically  
    const week6Submissions = submissions.filter(s => s.week === 6);
    const week6SubmissionIds = week6Submissions.map(s => s.id);
    const week6Answers = answers.filter(a => week6SubmissionIds.includes(a.submission_id));
    
    // Count distinct respondents in week 6
    const week6Respondents = new Set(week6Submissions.map(s => s.submitted_by));
    
    // Count answers per question for week 6
    const week6AnswersByQuestion = {};
    scale15Questions.forEach(q => {
      const qAnswers = week6Answers.filter(a => a.question_id === q.id && a.value_num !== null);
      week6AnswersByQuestion[q.key] = {
        count: qAnswers.length,
        avg: qAnswers.length > 0 ? qAnswers.reduce((s, a) => s + a.value_num, 0) / qAnswers.length : 0
      };
    });

    console.log(`━━━ WEEK 6 ANALYSIS ━━━`);
    console.log(`Submissions: ${week6Submissions.length}`);
    console.log(`Distinct respondents: ${week6Respondents.size}`);
    console.log(`Response rate: ${week6Respondents.size}/${memberCount} = ${(week6Respondents.size/memberCount*100).toFixed(1)}%\n`);
    
    console.log(`Answers per scale_1_5 question:`);
    scale15Questions.forEach(q => {
      const stats = week6AnswersByQuestion[q.key];
      console.log(`  ${q.key.padEnd(15)} | ${stats.count} answers | avg: ${stats.avg.toFixed(2)}`);
    });

    const questionsWithAnswers = Object.values(week6AnswersByQuestion).filter(s => s.count > 0).length;
    console.log(`\nQuestions with answers: ${questionsWithAnswers}/${scale15Questions.length}`);

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

// Run the simulation
simulateGetTeamYearStats('dbbd1841-eee9-4091-968e-69b8b6214b8e', 6);
