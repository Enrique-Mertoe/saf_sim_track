-- Migration to add admin_id to teams table and update RLS policies
-- This migration adds a relationship between admins and teams

-- Add admin_id column to teams table
ALTER TABLE teams ADD COLUMN admin_id UUID REFERENCES users(id);

-- Update existing teams to set admin_id to the current leader's admin
-- This assumes that team leaders are already associated with an admin
-- If this is not the case, you'll need to manually set the admin_id for existing teams
UPDATE teams
SET admin_id = (
  SELECT u.id
  FROM users u
  WHERE u.role = 'admin'
  LIMIT 1
);

-- Modify RLS policies for teams table

-- Drop existing policy for admins
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

-- Create new policy that restricts admins to their own teams
CREATE POLICY "Admins can manage their own teams"
  ON teams FOR ALL
  USING (
    admin_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
    OR
    is_admin() AND admin_id IS NULL -- For backward compatibility with existing teams
  );

-- Modify the team creation process to set admin_id
CREATE OR REPLACE FUNCTION set_team_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If admin_id is not set and the current user is an admin, set it
  IF NEW.admin_id IS NULL AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    NEW.admin_id = (SELECT id FROM users WHERE auth_user_id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set admin_id on team creation
DROP TRIGGER IF EXISTS set_team_admin_id_trigger ON teams;
CREATE TRIGGER set_team_admin_id_trigger
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION set_team_admin_id();