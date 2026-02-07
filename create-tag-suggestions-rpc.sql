-- Create RPC function to get tag suggestions for a team
CREATE OR REPLACE FUNCTION public.get_team_tag_suggestions(p_team_id uuid)
RETURNS TABLE(tag_name text)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT DISTINCT tag_name
  FROM public.team_item_tags
  WHERE item_id IN (
    SELECT id FROM public.team_items WHERE team_id = p_team_id
  )
  ORDER BY tag_name ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_tag_suggestions(uuid) TO authenticated;
