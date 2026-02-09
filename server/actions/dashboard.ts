'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ItemType = 'ukemål' | 'pipeline' | 'mål' | 'retro'
type ItemStatus = 'planlagt' | 'pågår' | 'ferdig'

export interface TeamItem {
  id: string
  team_id: string
  type: ItemType
  title: string
  status: ItemStatus
  sort_order: number
  created_at: string
  updated_at: string
  updated_by: string | null
  members: Array<{ user_id: string }>
  tags: Array<{ tag_name: string }>
}

export async function getTeamItems(
  teamId: string,
  type?: ItemType
): Promise<{ items: TeamItem[]; error?: string }> {
  const supabase = supabaseServer()

  try {
    // Fetch items first
    let itemQuery = supabase
      .from('team_items')
      .select('*')
      .eq('team_id', teamId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (type) {
      itemQuery = itemQuery.eq('type', type)
    }

    const { data: items, error: itemsError } = await itemQuery

    if (itemsError) {
      return { items: [], error: itemsError.message }
    }

    if (!items || items.length === 0) {
      return { items: [] }
    }

    // Fetch members separately
    const { data: members, error: membersError } = await supabase
      .from('team_item_members')
      .select('item_id, user_id')
      .in(
        'item_id',
        items.map((i) => i.id)
      )

    if (membersError) {
      return { items: [], error: membersError.message }
    }

    // Fetch tags separately
    const { data: tags, error: tagsError } = await supabase
      .from('team_item_tags')
      .select('item_id, tag_name')
      .in(
        'item_id',
        items.map((i) => i.id)
      )

    if (tagsError) {
      return { items: [], error: tagsError.message }
    }

    // Combine data
    const itemsWithRelations: TeamItem[] = items.map((item) => ({
      ...item,
      members: (members || []).filter((m) => m.item_id === item.id),
      tags: (tags || []).filter((t) => t.item_id === item.id),
    }))

    return { items: itemsWithRelations }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { items: [], error: message }
  }
}

export async function createItem(
  teamId: string,
  type: ItemType,
  title: string
): Promise<{ itemId?: string; error?: string }> {
  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Ikke autentisert' }
  }

  const { data, error } = await supabase
    .from('team_items')
    .insert({
      team_id: teamId,
      type,
      title,
      updated_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/t/${teamId}`)
  return { itemId: data.id }
}

export async function updateItem(
  itemId: string,
  updates: { title?: string; status?: ItemStatus }
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Ikke autentisert' }
  }

  // Get team_id for revalidation
  const { data: item } = await supabase
    .from('team_items')
    .select('team_id')
    .eq('id', itemId)
    .single()

  const { error } = await supabase
    .from('team_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  if (item) {
    revalidatePath(`/t/${item.team_id}`)
  }
  return {}
}

export async function deleteItem(itemId: string): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Ikke autentisert' }
  }

  // Get item and team info first
  const { data: item, error: fetchError } = await supabase
    .from('team_items')
    .select('id, team_id, title')
    .eq('id', itemId)
    .single()

  if (fetchError) {
    return { error: `Fant ikke oppgaven: ${fetchError.message}` }
  }

  if (!item) {
    return { error: 'Oppgaven eksisterer ikke' }
  }

  // Verify user is member of this team
  const { data: memberships, error: membershipError } = await supabase
    .from('team_memberships')
    .select('role, status')
    .eq('team_id', item.team_id)
    .eq('user_id', user.id)

  if (membershipError) {
    return {
      error: `Kunne ikke verifisere medlemskap: ${membershipError.message}`,
    }
  }

  if (!memberships || memberships.length === 0) {
    return {
      error: 'Du har ikke tilgang til denne oppgaven (ikke medlem av teamet)',
    }
  }

  const activeMembership = memberships.find((m) => m.status === 'active')
  if (!activeMembership) {
    return {
      error: 'Du har ikke tilgang til denne oppgaven (inaktivt medlemskap)',
    }
  }

  // Delete related records first (CASCADE should handle but being explicit)
  const { error: _membersDeleteError } = await supabase
    .from('team_item_members')
    .delete()
    .eq('item_id', itemId)

  const { error: _tagsDeleteError } = await supabase
    .from('team_item_tags')
    .delete()
    .eq('item_id', itemId)

  // Delete the item itself
  const { error: deleteError } = await supabase
    .from('team_items')
    .delete()
    .eq('id', itemId)

  if (deleteError) {
    return { error: `Sletting feilet: ${deleteError.message}` }
  }

  revalidatePath(`/t/${item.team_id}`)
  return {}
}

export async function toggleItemStatus(
  itemId: string,
  currentStatus: ItemStatus
): Promise<{ error?: string }> {
  const newStatus = currentStatus === 'ferdig' ? 'planlagt' : 'ferdig'
  return updateItem(itemId, { status: newStatus })
}

export async function addMemberTag(
  itemId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  try {
    console.log('=== addMemberTag START ===')
    console.log('itemId:', itemId, 'userId:', userId)

    // Validate userId format
    if (!userId || userId.trim() === '') {
      console.error('✗ userId is empty')
      return { error: 'Bruker-ID er tom' }
    }

    // Get team_id for revalidation
    console.log('Fetching team_id for item...')
    const { data: item, error: itemError } = await supabase
      .from('team_items')
      .select('id, team_id, title')
      .eq('id', itemId)

    if (itemError) {
      console.error('✗ Error fetching item:', itemError.code, itemError.message)
      return { error: `Kunne ikke finne oppgave: ${itemError.message}` }
    }

    if (!item || item.length === 0) {
      console.error('✗ Item not found')
      return { error: 'Oppgave ikke funnet' }
    }

    const itemData = item[0]
    if (!itemData) {
      console.error('✗ Item data is null')
      return { error: 'Oppgave-data mangler' }
    }

    console.log(
      '✓ Found item:',
      itemData.title,
      '(team:',
      itemData.team_id,
      ')'
    )

    // Verify user is a member of the team
    console.log('Verifying user is member of team...')
    const { data: membership, error: memberError } = await supabase
      .from('team_memberships')
      .select('user_id, status')
      .eq('team_id', itemData.team_id)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (memberError) {
      console.error('✗ Error checking membership:', memberError.message)
      return {
        error: `Kunne ikke verifisere medlemskap: ${memberError.message}`,
      }
    }

    if (!membership || membership.length === 0) {
      console.error('✗ User is not an active member of this team')
      return { error: 'Person er ikke medlem av laget' }
    }

    console.log('✓ User is active team member')

    console.log('Inserting member tag...')
    const { error, data } = await supabase
      .from('team_item_members')
      .insert({ item_id: itemId, user_id: userId })
      .select()

    if (error) {
      // Ignore duplicate errors (same person already tagged)
      if (error.code === '23505') {
        console.log('Member already tagged, ignoring duplicate')
        return {}
      }
      console.error('✗ Error inserting member tag:', error.code, error.message)
      console.error('  Details:', error.details)
      console.error('  Hint:', error.hint)
      return { error: `Kunne ikke legge til person: ${error.message}` }
    }

    console.log('✓ Member tag inserted:', data)
    console.log('Revalidating path:', `/t/${itemData.team_id}`)
    revalidatePath(`/t/${itemData.team_id}`)
    console.log('=== addMemberTag SUCCESS ===')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('✗ Unexpected error in addMemberTag:', message, err)
    return { error: `Uventet feil: ${message}` }
  }
}

export async function removeMemberTag(
  itemId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  try {
    console.log('=== removeMemberTag START ===')
    console.log('itemId:', itemId, 'userId:', userId)

    // Get team_id for revalidation
    console.log('Fetching team_id for item...')
    const { data: item, error: itemError } = await supabase
      .from('team_items')
      .select('id, team_id, title')
      .eq('id', itemId)

    if (itemError) {
      console.error('✗ Error fetching item:', itemError.message)
      return { error: `Kunne ikke finne oppgave: ${itemError.message}` }
    }

    if (!item || item.length === 0) {
      console.error('✗ Item not found')
      return { error: 'Oppgave ikke funnet' }
    }

    const itemData = item[0]
    if (!itemData) {
      console.error('✗ Item data is null')
      return { error: 'Oppgave-data mangler' }
    }

    console.log('✓ Found item:', itemData.title)

    console.log('Removing member tag...')
    const { error } = await supabase
      .from('team_item_members')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', userId)

    if (error) {
      console.error('✗ Error removing member tag:', error.code, error.message)
      return { error: `Kunne ikke fjerne person: ${error.message}` }
    }

    console.log('✓ Member tag removed')
    console.log('Revalidating path:', `/t/${itemData.team_id}`)
    revalidatePath(`/t/${itemData.team_id}`)
    console.log('=== removeMemberTag SUCCESS ===')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('✗ Unexpected error in removeMemberTag:', message)
    return { error: `Uventet feil: ${message}` }
  }
}

export async function addSystemTag(
  itemId: string,
  tagName: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  // Normalize to lowercase
  const normalizedTag = tagName.trim().toLowerCase()

  if (!normalizedTag) {
    return { error: 'Tom tag' }
  }

  try {
    console.log('=== addSystemTag START ===')
    console.log('itemId:', itemId, 'tagName:', normalizedTag)

    // Get authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return { error: 'Ikke autentisert' }
    }
    console.log('✓ User authenticated:', user.id)

    // Check max 5 tags
    console.log('Checking existing tags...')
    const { data: existingTags, error: tagsError } = await supabase
      .from('team_item_tags')
      .select('id')
      .eq('item_id', itemId)

    if (tagsError) {
      console.error(
        '✗ Error fetching existing tags:',
        tagsError.code,
        tagsError.message
      )
      return {
        error: `Kunne ikke hente eksisterende tagger: ${tagsError.message}`,
      }
    }

    console.log('✓ Found', existingTags?.length || 0, 'existing tags')
    if (existingTags && existingTags.length >= 5) {
      return { error: 'Maks 5 tags per oppgave' }
    }

    // Get team_id for revalidation (try without .single() first to see if item exists)
    console.log('Fetching team_id for item...')
    const {
      data: item,
      error: itemError,
      status: itemStatus,
    } = await supabase
      .from('team_items')
      .select('id, team_id, title')
      .eq('id', itemId)

    if (itemError) {
      console.error(
        `✗ Error fetching item (status ${itemStatus}):`,
        itemError.code,
        itemError.message
      )
      return { error: `Kunne ikke finne oppgave: ${itemError.message}` }
    }

    if (!item || item.length === 0) {
      console.error('✗ Item not found with id:', itemId)
      return { error: 'Oppgave ikke funnet' }
    }

    const itemData = item[0]
    if (!itemData) {
      console.error('✗ Item data is null')
      return { error: 'Oppgave-data mangler' }
    }

    console.log(
      '✓ Found item:',
      itemData.title,
      '(team:',
      itemData.team_id,
      ')'
    )

    console.log('Inserting tag into team_item_tags...')
    const { error, data } = await supabase
      .from('team_item_tags')
      .insert({ item_id: itemId, tag_name: normalizedTag })
      .select()

    if (error) {
      // Ignore duplicate errors
      if (error.code === '23505') {
        console.log('Tag already exists, skipping')
        return {}
      }
      console.error(`✗ Error inserting tag (${error.code}):`, error.message)
      console.error('  Details:', error.details)
      console.error('  Hint:', error.hint)
      return { error: `Kunne ikke lagre tag: ${error.message}` }
    }

    console.log('✓ Tag inserted successfully:', data)
    console.log('Revalidating path:', `/t/${itemData.team_id}`)
    revalidatePath(`/t/${itemData.team_id}`)
    console.log('=== addSystemTag SUCCESS ===')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('✗ Unexpected error in addSystemTag:', message, err)
    return { error: `Uventet feil: ${message}` }
  }
}

export async function removeSystemTag(
  itemId: string,
  tagName: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  try {
    console.log('=== removeSystemTag START ===')
    console.log('itemId:', itemId, 'tagName:', tagName)

    // Get authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('✗ Auth error:', authError)
      return { error: 'Ikke autentisert' }
    }
    console.log('✓ User authenticated:', user.id)

    // Get team_id for revalidation
    console.log('Fetching team_id for item...')
    const { data: item, error: itemError } = await supabase
      .from('team_items')
      .select('id, team_id, title')
      .eq('id', itemId)

    if (itemError) {
      console.error('✗ Error fetching item:', itemError.message)
      return { error: `Kunne ikke finne oppgave: ${itemError.message}` }
    }

    if (!item || item.length === 0) {
      console.error('✗ Item not found')
      return { error: 'Oppgave ikke funnet' }
    }

    const itemData = item[0]
    if (!itemData) {
      console.error('✗ Item data is null')
      return { error: 'Oppgave-data mangler' }
    }

    console.log('✓ Found item:', itemData.title)

    console.log('Deleting tag:', {
      item_id: itemId,
      tag_name: tagName.toLowerCase(),
    })
    const { error } = await supabase
      .from('team_item_tags')
      .delete()
      .eq('item_id', itemId)
      .eq('tag_name', tagName.toLowerCase())

    if (error) {
      console.error('✗ Error deleting tag:', error.code, error.message)
      return { error: `Kunne ikke slette tag: ${error.message}` }
    }

    console.log('✓ Tag removed successfully:', tagName.toLowerCase())
    console.log('Revalidating path:', `/t/${itemData.team_id}`)
    revalidatePath(`/t/${itemData.team_id}`)
    console.log('=== removeSystemTag SUCCESS ===')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('✗ Unexpected error in removeSystemTag:', message, err)
    return { error: `Uventet feil: ${message}` }
  }
}

export async function getSystemTagSuggestions(
  teamId: string
): Promise<{ suggestions: string[]; error?: string }> {
  const supabase = supabaseServer()

  try {
    const { data, error } = await supabase.rpc('get_team_tag_suggestions', {
      p_team_id: teamId,
    })

    if (error) {
      console.error('Error fetching tag suggestions:', error)
      return { suggestions: [], error: error.message }
    }

    const suggestions = (data || []).map(
      (row: { tag_name: string }) => row.tag_name
    )
    console.log('Tag suggestions fetched:', suggestions.length)
    return { suggestions }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error in getSystemTagSuggestions:', message)
    return { suggestions: [], error: message }
  }
}

export async function reorderItem(
  itemId: string,
  newSortOrder: number,
  teamId: string
): Promise<{ error?: string }> {
  const supabase = supabaseServer()

  try {
    console.log(
      `Reordering item ${itemId} to sort_order ${newSortOrder} in team ${teamId}`
    )

    const { error } = await supabase
      .from('team_items')
      .update({
        sort_order: newSortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('team_id', teamId)

    if (error) {
      console.error('Error reordering item:', error)
      return { error: error.message }
    }

    revalidatePath(`/t/${teamId}`)
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error in reorderItem:', message)
    return { error: message }
  }
}
