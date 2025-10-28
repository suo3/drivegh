-- Make customer_id nullable to support guest requests
ALTER TABLE public.service_requests 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add phone_number column for guest requests
ALTER TABLE public.service_requests 
ADD COLUMN phone_number text;

-- Update RLS policy to allow guest requests
DROP POLICY IF EXISTS "Customers can create service requests" ON public.service_requests;

CREATE POLICY "Anyone can create service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (
  -- Either authenticated user creating their own request
  (auth.uid() = customer_id) 
  OR 
  -- Or guest user providing phone number
  (auth.uid() IS NULL AND phone_number IS NOT NULL AND customer_id IS NULL)
);

-- Update view policy to include phone-based tracking
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.service_requests;

CREATE POLICY "Users can view their requests"
ON public.service_requests
FOR SELECT
USING (
  -- Authenticated users can see their own requests
  (auth.uid() = customer_id) 
  OR 
  -- Providers can see assigned requests
  (auth.uid() = provider_id) 
  OR 
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Anyone can view (for guest tracking)
  true
);