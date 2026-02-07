"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ItemType = "ukemål" | "pipeline" | "mål" | "retro";
type ItemStatus = "planlagt" | "pågår" | "ferdig";

export interface TeamItem {
  id: string;
  team_id: string;
  type: ItemType;
  title: string;
  status: ItemStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  members: Array<{ user_id: string }>;
  tags: Array<{ tag_name: string }>;
}

export async function getTeamItems(
  teamId: string,
  type?: ItemType
): Promise<{ items: TeamItem[]; error?: string }> {
  const supabase = supabaseServer();

  try {
    // Fetch items first
    let itemQuery = supabase
      .from("team_items")
      .select("*")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (type) {
      itemQuery = itemQuery.eq("type", type);
    }

    const { data: items, error: itemsError } = await itemQuery;

    if (itemsError) {
      return { items: [], error: itemsError.message };
    }

    if (!items || items.length === 0) {
      return { items: [] };
    }

    // Fetch members separately
    const { data: members, error: membersError } = await supabase
      .from("team_item_members")
      .select("item_id, user_id")
      .in(
        "item_id",
        items.map((i) => i.id)
      );

    if (membersError) {
      return { items: [], error: membersError.message };
    }

    // Fetch tags separately
    const { data: tags, error: tagsError } = await supabase
      .from("team_item_tags")
      .select("item_id, tag_name")
      .in(
        "item_id",
        items.map((i) => i.id)
      );

    if (tagsError) {
      return { items: [], error: tagsError.message };
    }

    // Combine data
    const itemsWithRelations: TeamItem[] = items.map((item) => ({
      ...item,
      members: (members || []).filter((m) => m.item_id === item.id),
      tags: (tags || []).filter((t) => t.item_id === item.id),
    }));

    return { items: itemsWithRelations };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { items: [], error: message };
  }
}

export async function createItem(
  teamId: string,
  type: ItemType,
  title: string
): Promise<{ itemId?: string; error?: string }> {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Ikke autentisert" };
  }

  const { data, error } = await supabase
    .from("team_items")
    .insert({
      team_id: teamId,
      type,
      title,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/t/${teamId}`);
  return { itemId: data.id };
}

export async function updateItem(
  itemId: string,
  updates: { title?: string; status?: ItemStatus }
): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Ikke autentisert" };
  }

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("team_items")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function deleteItem(itemId: string): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase.from("team_items").delete().eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function toggleItemStatus(
  itemId: string,
  currentStatus: ItemStatus
): Promise<{ error?: string }> {
  const newStatus =
    currentStatus === "ferdig" ? "planlagt" : "ferdig";
  return updateItem(itemId, { status: newStatus });
}

export async function addMemberTag(
  itemId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("team_item_members")
    .insert({ item_id: itemId, user_id: userId });

  if (error) {
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function removeMemberTag(
  itemId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("team_item_members")
    .delete()
    .eq("item_id", itemId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function addSystemTag(
  itemId: string,
  tagName: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  // Normalize to lowercase
  const normalizedTag = tagName.trim().toLowerCase();

  if (!normalizedTag) {
    return { error: "Tom tag" };
  }

  // Check max 5 tags
  const { data: existingTags } = await supabase
    .from("team_item_tags")
    .select("id")
    .eq("item_id", itemId);

  if (existingTags && existingTags.length >= 5) {
    return { error: "Maks 5 tags per oppgave" };
  }

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("team_item_tags")
    .insert({ item_id: itemId, tag_name: normalizedTag });

  if (error) {
    // Ignore duplicate errors
    if (error.code === "23505") {
      return {};
    }
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function removeSystemTag(
  itemId: string,
  tagName: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer();

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from("team_items")
    .select("team_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("team_item_tags")
    .delete()
    .eq("item_id", itemId)
    .eq("tag_name", tagName.toLowerCase());

  if (error) {
    return { error: error.message };
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`);
  }
  return {};
}

export async function getSystemTagSuggestions(
  teamId: string
): Promise<{ suggestions: string[]; error?: string }> {
  const supabase = supabaseServer();

  const { data, error } = await supabase.rpc("get_team_tag_suggestions", {
    p_team_id: teamId,
  });

  if (error) {
    return { suggestions: [], error: error.message };
  }

  return {
    suggestions: (data || []).map((row: { tag_name: string }) => row.tag_name),
  };
}
