-- Add 'quoted' status to service_status enum
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'quoted' AFTER 'assigned';

-- Add 'awaiting_payment' status to service_status enum
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'awaiting_payment' AFTER 'quoted';

-- Add 'paid' status to service_status enum  
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'awaiting_payment';

-- Add 'awaiting_confirmation' status for when provider marks complete but customer hasn't confirmed
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation' AFTER 'in_progress';

-- Add quote and payment fields to service_requests
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS quoted_amount numeric,
ADD COLUMN IF NOT EXISTS quote_description text,
ADD COLUMN IF NOT EXISTS quoted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS quote_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paystack_reference text,
ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS provider_confirmed_payment_at timestamp with time zone;

-- Add index for paystack reference lookups
CREATE INDEX IF NOT EXISTS idx_service_requests_paystack_reference ON service_requests(paystack_reference);

-- Update transactions table to add paystack-specific fields
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS paystack_transfer_code text,
ADD COLUMN IF NOT EXISTS paystack_transfer_status text,
ADD COLUMN IF NOT EXISTS transfer_initiated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS transfer_completed_at timestamp with time zone;