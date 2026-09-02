-- Accept an invitation without exposing invitation rows to ordinary members.
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_id uuid;
  invitation_team_id uuid;
  invitation_email text;
  invitation_status text;
  invitation_expires_at timestamptz;
  current_email text;
BEGIN
  SELECT id, team_id, email, status, expires_at
  INTO invitation_id, invitation_team_id, invitation_email,
    invitation_status, invitation_expires_at
  FROM public.team_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitasjonen ble ikke funnet';
  END IF;

  IF invitation_status <> 'pending' THEN
    RAISE EXCEPTION 'Invitasjonen er allerede brukt';
  END IF;

  IF invitation_expires_at < now() THEN
    UPDATE public.team_invitations
    SET status = 'expired'
    WHERE id = invitation_id;
    RAISE EXCEPTION 'Invitasjonen er utløpt';
  END IF;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF current_email = '' OR current_email <> lower(invitation_email) THEN
    RAISE EXCEPTION 'Invitasjonen er sendt til en annen e-postadresse';
  END IF;

  INSERT INTO public.team_memberships (team_id, user_id, role, status)
  VALUES (invitation_team_id, auth.uid(), 'member', 'active')
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.team_invitations
  SET status = 'accepted'
  WHERE id = invitation_id;

  RETURN invitation_team_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_team_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;
