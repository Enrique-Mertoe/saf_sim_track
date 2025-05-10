/**
 * SQL schema for Supabase database
 * This file can be executed manually in the Supabase SQL editor
 * or used with migration tools
 */

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema
CREATE SCHEMA IF NOT EXISTS "public";

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  leader_id UUID,
  region TEXT NOT NULL,
  territory TEXT,
  van_number_plate TEXT,
  van_location TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  mobigo_number TEXT,
  role TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  staff_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  auth_user_id UUID UNIQUE NOT NULL
);

-- Add foreign key constraint for team leader
ALTER TABLE teams
  ADD CONSTRAINT fk_team_leader
  FOREIGN KEY (leader_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- SIM Cards Table
CREATE TABLE IF NOT EXISTS sim_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  serial_number TEXT UNIQUE NOT NULL,
  customer_msisdn TEXT NOT NULL,
  customer_id_number TEXT NOT NULL,
  customer_id_front_url TEXT,
  customer_id_back_url TEXT,
  agent_msisdn TEXT NOT NULL,
  sold_by_user_id UUID REFERENCES users(id) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sale_location TEXT NOT NULL,
  activation_date TIMESTAMP WITH TIME ZONE,
  top_up_amount DECIMAL(10,2),
  top_up_date TIMESTAMP WITH TIME ZONE,
  first_usage_date TIMESTAMP WITH TIME ZONE,
  first_usage_amount DECIMAL(10,2),
  status TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) NOT NULL,
  region TEXT NOT NULL,
  fraud_flag BOOLEAN DEFAULT FALSE,
  fraud_reason TEXT,
  quality_score INTEGER
);

-- Onboarding Requests Table
CREATE TABLE IF NOT EXISTS onboarding_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_by_id UUID REFERENCES users(id) NOT NULL,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  mobigo_number TEXT,
  role TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  staff_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id UUID REFERENCES users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB NOT NULL,
  ip_address TEXT,
  device_info TEXT,
  is_offline_action BOOLEAN DEFAULT FALSE,
  sync_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_sim_serial ON sim_cards(serial_number);
CREATE INDEX idx_sim_customer_msisdn ON sim_cards(customer_msisdn);
CREATE INDEX idx_sim_agent_msisdn ON sim_cards(agent_msisdn);
CREATE INDEX idx_sim_team ON sim_cards(team_id);
CREATE INDEX idx_sim_status ON sim_cards(status);
CREATE INDEX idx_sim_sale_date ON sim_cards(sale_date);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_team ON users(team_id);
CREATE INDEX idx_request_status ON onboarding_requests(status);
CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_action ON activity_logs(action_type);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW team_performance AS
SELECT
  t.id as team_id,
  t.name as team_name,
  u.full_name as leader_name,
  COUNT(s.id) as sim_cards_sold,
  COALESCE(SUM(CASE WHEN s.status = 'activated' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(s.id), 0), 0) as activation_rate,
  COALESCE(AVG(s.top_up_amount), 0) as avg_top_up,
  COUNT(CASE WHEN s.fraud_flag = TRUE THEN 1 END) as fraud_flags,
  s.region,
  to_char(date_trunc('month', s.sale_date), 'YYYY-MM') as period
FROM teams t
LEFT JOIN users u ON t.leader_id = u.id
LEFT JOIN sim_cards s ON t.id = s.team_id
GROUP BY t.id, t.name, u.full_name, s.region, period;

CREATE OR REPLACE VIEW staff_performance AS
SELECT
  u.id as user_id,
  u.full_name,
  t.id as team_id,
  t.name as team_name,
  COUNT(s.id) as sim_cards_sold,
  COALESCE(SUM(CASE WHEN s.status = 'activated' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(s.id), 0), 0) as activation_rate,
  COALESCE(AVG(s.top_up_amount), 0) as avg_top_up,
  COUNT(CASE WHEN s.fraud_flag = TRUE THEN 1 END) as fraud_flags,
  to_char(date_trunc('month', s.sale_date), 'YYYY-MM') as period
FROM users u
JOIN teams t ON u.team_id = t.id
LEFT JOIN sim_cards s ON u.id = s.sold_by_user_id
WHERE u.role = 'staff'
GROUP BY u.id, u.full_name, t.id, t.name, period;

-- Create functions for complex operations
CREATE OR REPLACE FUNCTION get_team_hierarchy(in_team_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  leader_id UUID,
  leader_name TEXT,
  staff_count INTEGER,
  staff JSON[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.leader_id,
    leader.full_name,
    COUNT(staff.id)::INTEGER,
    array_agg(
      json_build_object(
        'user_id', staff.id,
        'full_name', staff.full_name,
        'staff_type', staff.staff_type,
        'sim_sales_count', (
          SELECT COUNT(*) FROM sim_cards WHERE sold_by_user_id = staff.id
        )
      )
    )::JSON[] as staff
  FROM teams t
  LEFT JOIN users leader ON t.leader_id = leader.id
  LEFT JOIN users staff ON staff.team_id = t.id AND staff.role = 'staff'
  WHERE t.id = in_team_id
  GROUP BY t.id, t.name, t.leader_id, leader.full_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_sim_cards(
  search_term TEXT,
  status_filter TEXT DEFAULT NULL,
  team_id UUID DEFAULT NULL,
  from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  serial_number TEXT,
  customer_msisdn TEXT,
  agent_msisdn TEXT,
  sold_by_name TEXT,
  sale_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  team_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.serial_number,
    s.customer_msisdn,
    s.agent_msisdn,
    u.full_name as sold_by_name,
    s.sale_date,
    s.status,
    t.name as team_name
  FROM sim_cards s
  JOIN users u ON s.sold_by_user_id = u.id
  JOIN teams t ON s.team_id = t.id
  WHERE (
    search_term IS NULL OR
    s.serial_number ILIKE '%' || search_term || '%' OR
    s.customer_msisdn ILIKE '%' || search_term || '%' OR
    s.agent_msisdn ILIKE '%' || search_term || '%' OR
    u.full_name ILIKE '%' || search_term || '%'
  )
  AND (status_filter IS NULL OR s.status = status_filter)
  AND (team_id IS NULL OR s.team_id = team_id)
  AND (from_date IS NULL OR s.sale_date >= from_date)
  AND (to_date IS NULL OR s.sale_date <= to_date)
  ORDER BY s.sale_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a secure function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to check if a user is a team leader
CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
     AND role ILIKE 'team_leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to get the user's ID from auth.uid()
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM users WHERE auth_user_id = auth.uid();
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to get the user's team_id from auth.uid()
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID AS $$
DECLARE
  team_id UUID;
BEGIN
  SELECT users.team_id INTO team_id
  FROM users
  WHERE auth_user_id = auth.uid();
  RETURN team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to check if the user is a team leader of a specific team
CREATE OR REPLACE FUNCTION is_leader_of_team(team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_id
    AND leader_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Admins can see all users"
  ON users FOR SELECT
  USING (is_admin());

CREATE POLICY "Team leaders can see their team members"
  ON users FOR SELECT
  USING (
    is_leader_of_team(team_id)
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "Users can see themselves"
  ON users FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can create users"
  ON users FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (is_admin());

-- Create policies for teams table
CREATE POLICY "All authenticated users can view teams"
  ON teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (is_admin());

-- Create policies for sim_cards table
CREATE POLICY "Admins can see all SIM cards"
  ON sim_cards FOR SELECT
  USING (is_admin());

CREATE POLICY "Team leaders can see their team's SIM cards"
  ON sim_cards FOR SELECT
  USING (is_leader_of_team(team_id));

CREATE POLICY "Staff can see their own SIM cards"
  ON sim_cards FOR SELECT
  USING (sold_by_user_id = get_user_id());

CREATE POLICY "Staff can create SIM cards"
  ON sim_cards FOR INSERT
  WITH CHECK (
    (is_admin() OR is_team_leader() OR get_user_id() IN (SELECT id FROM users WHERE role = 'staff'))
    AND sold_by_user_id = get_user_id()
  );

CREATE POLICY "Staff can update their own SIM cards"
  ON sim_cards FOR UPDATE
  USING (sold_by_user_id = get_user_id());

-- Create policies for onboarding_requests table
CREATE POLICY "Admins can see all onboarding requests"
  ON onboarding_requests FOR SELECT
  USING (is_admin());

CREATE POLICY "Team leaders can see their own onboarding requests"
  ON onboarding_requests FOR SELECT
  USING (
    requested_by_id = get_user_id()
    OR is_leader_of_team(team_id)
  );

CREATE POLICY "Team leaders can create onboarding requests"
  ON onboarding_requests FOR INSERT
  WITH CHECK (is_team_leader());

CREATE POLICY "Admins can update onboarding requests"
  ON onboarding_requests FOR UPDATE
  USING (is_admin());

-- Create policies for activity_logs table
CREATE POLICY "Users can create their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (user_id = get_user_id());

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (user_id = get_user_id());

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (is_admin());






-- Create tables for user security functionality

-- Table for user security settings
CREATE TABLE user_security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_method TEXT DEFAULT 'email', -- 'email', 'sms', 'authenticator'
  two_factor_verified BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  recovery_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for tracking security activity
CREATE TABLE user_security_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_password_change TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  active_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for tracking user sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Table for two-factor authentication verifications
CREATE TABLE two_factor_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL, -- 'email', 'sms'
  identifier TEXT, -- email or phone number (can be null for current user's primary contact)
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- Table for password reset requests
CREATE TABLE password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create RLS policies

-- User security settings policies
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security settings"
  ON user_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
  ON user_security_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings"
  ON user_security_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User security activity policies
ALTER TABLE user_security_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security activity"
  ON user_security_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update user security activity"
  ON user_security_activity FOR UPDATE
  USING (true);

CREATE POLICY "System can insert user security activity"
  ON user_security_activity FOR INSERT
  WITH CHECK (true);

-- User sessions policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert and update user sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update user sessions"
  ON user_sessions FOR UPDATE
  USING (true);

-- Two-factor verifications policies
ALTER TABLE two_factor_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
  ON two_factor_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert verifications"
  ON two_factor_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update verifications"
  ON two_factor_verifications FOR UPDATE
  USING (true);

-- Password reset requests policies
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reset requests"
  ON password_reset_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert password reset requests"
  ON password_reset_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update password reset requests"
  ON password_reset_requests FOR UPDATE
  USING (true);

-- Create functions for security features

-- Function to register user's session
CREATE OR REPLACE FUNCTION register_user_session()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_sessions (
    user_id,
    device_info,
    ip_address,
    user_agent,
    expires_at
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.device_info, 'Unknown Device'),
    NEW.ip_address,
    NEW.user_agent,
    NOW() + INTERVAL '30 days'
  );

  -- Update active sessions count
  INSERT INTO user_security_activity (user_id, active_sessions, last_login)
  VALUES (NEW.user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    active_sessions = (
      SELECT COUNT(*) FROM user_sessions
      WHERE user_id = NEW.user_id
    ),
    last_login = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for session tracking
-- Note: In a real implementation, you would need to hook this to auth events
-- This is a simplified example assuming you'd track this in your application

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < NOW();

  -- Update active sessions count for affected users
  UPDATE user_security_activity
  SET active_sessions = (
    SELECT COUNT(*) FROM user_sessions
    WHERE user_id = user_security_activity.user_id
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled function to run cleanup daily
-- Note: In Supabase, you would use the pgcron extension or a serverless function
-- This is pseudocode as the exact implementation depends on your setup
--
-- SELECT cron.schedule(
--   'cleanup-expired-sessions',
--   '0 0 * * *', -- Run at midnight every day
--   'SELECT cleanup_expired_sessions();'
-- );