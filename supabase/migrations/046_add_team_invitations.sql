CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (team_id, email, status)
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_admins_can_read_invitations" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_memberships
      WHERE team_memberships.team_id = team_invitations.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.role IN ('owner', 'admin')
        AND team_memberships.status = 'active'
    )
  );

CREATE POLICY "team_admins_can_insert_invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_memberships
      WHERE team_memberships.team_id = team_invitations.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.role IN ('owner', 'admin')
        AND team_memberships.status = 'active'
    )
  );

CREATE POLICY "team_admins_can_update_invitations" ON team_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_memberships
      WHERE team_memberships.team_id = team_invitations.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.role IN ('owner', 'admin')
        AND team_memberships.status = 'active'
    )
  );
