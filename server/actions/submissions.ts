"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type AnswerPayload = {
  question_id: string;
  value_num?: number | null;
  value_bool?: boolean | null;
  value_text?: string | null;
};

export async function loadActiveQuestionnaire(teamId: string) {
  const supabase = supabaseServer();

  const { data: q, error: qErr } = await supabase
    .from("questionnaires")
    .select("id, name, version")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (qErr) throw qErr;

  const { data: questions, error: quErr } = await supabase
    .from("questions")
    .select("id, key, label, type, required, sort_order")
    .eq("questionnaire_id", q.id)
    .order("sort_order", { ascending: true });

  if (quErr) throw quErr;

  return { questionnaire: q, questions: questions ?? [] };
}

export async function submitSurvey(input: {
  teamId: string;
  questionnaireId: string;
  week: number;
  displayName?: string;
  isAnonymous: boolean;
  answers: AnswerPayload[];
}) {
  const supabase = supabaseServer();
  const { data: u, error: authError } = await supabase.auth.getUser();
  
  if (authError || !u.user) {
    redirect("/login");
  }

  const { data: submission, error: sErr } = await supabase
    .from("submissions")
    .insert({
      team_id: input.teamId,
      questionnaire_id: input.questionnaireId,
      week: input.week,
      submitted_by: u.user.id,
      display_name: input.displayName ?? null,
      is_anonymous: input.isAnonymous,
    })
    .select()
    .single();

  if (sErr) throw sErr;

  const rows = input.answers.map((a) => ({
    submission_id: submission.id,
    question_id: a.question_id,
    value_num: a.value_num ?? null,
    value_bool: a.value_bool ?? null,
    value_text: a.value_text ?? null,
  }));

  const { error: aErr } = await supabase.from("answers").insert(rows);
  if (aErr) throw aErr;

  return submission.id as string;
}
