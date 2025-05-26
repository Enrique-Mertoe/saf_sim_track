-- SQL migration script for Supabase

-- Add registered_on field to sim_cards table
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS registered_on TIMESTAMP WITH TIME ZONE;

-- Create a function to update registered_on when status changes to REGISTERED
CREATE OR REPLACE FUNCTION update_registered_on()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'REGISTERED' AND (OLD.status IS NULL OR OLD.status != 'REGISTERED') THEN
    NEW.registered_on = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update registered_on
DROP TRIGGER IF EXISTS set_registered_on ON sim_cards;
CREATE TRIGGER set_registered_on
BEFORE UPDATE ON sim_cards
FOR EACH ROW
EXECUTE FUNCTION update_registered_on();

-- Add index on registered_on for better query performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_registered_on ON sim_cards(registered_on);

-- Add index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_status ON sim_cards(status);

-- Add index on team_id for better query performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_team_id ON sim_cards(team_id);

-- Add index on sold_by_user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_sold_by_user_id ON sim_cards(sold_by_user_id);