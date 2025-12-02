-- Add super_admin to the app_role enum
-- This must be done in a separate transaction before using the value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Update has_role function comment to document super_admin
COMMENT ON FUNCTION public.has_role IS 'Check if a user has a specific role. Roles: customer, provider, admin, super_admin';