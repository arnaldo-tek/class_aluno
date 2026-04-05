-- Add subscription tracking fields to package_access
ALTER TABLE package_access
  ADD COLUMN IF NOT EXISTS pagarme_subscription_id text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz;
