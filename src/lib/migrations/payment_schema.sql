-- Payment Requests Table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  plan_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  checkout_url TEXT,
  transaction_id TEXT,
  payment_method TEXT,
  payment_details JSONB
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_reference TEXT REFERENCES payment_requests(reference),
  auto_renew BOOLEAN DEFAULT FALSE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_payment_reference ON payment_requests(reference);
CREATE INDEX idx_payment_user ON payment_requests(user_id);
CREATE INDEX idx_payment_status ON payment_requests(status);
CREATE INDEX idx_subscription_user ON subscriptions(user_id);
CREATE INDEX idx_subscription_status ON subscriptions(status);
CREATE INDEX idx_subscription_expires ON subscriptions(expires_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON payment_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a view for subscription status
CREATE OR REPLACE VIEW subscription_status AS
SELECT
  u.id as user_id,
  u.full_name,
  u.email,
  s.plan_id,
  s.status,
  s.starts_at,
  s.expires_at,
  CASE
    WHEN s.status = 'active' AND s.expires_at > NOW() THEN TRUE
    ELSE FALSE
  END as is_active,
  EXTRACT(DAY FROM (s.expires_at - NOW())) as days_remaining,
  p.amount as last_payment_amount,
  p.created_at as last_payment_date
FROM
  users u
LEFT JOIN
  subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN
  payment_requests p ON s.payment_reference = p.reference
WHERE
  s.id IS NOT NULL;