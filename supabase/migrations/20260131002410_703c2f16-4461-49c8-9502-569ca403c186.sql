-- Drop the restrictive cancellation-only policy
DROP POLICY IF EXISTS "Customers can cancel their own requests" ON public.service_requests;

-- Create a policy that allows customers to approve quotes and update their requests
CREATE POLICY "Customers can update their own requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Allow anonymous users (via tracking page) to approve quotes for their requests
CREATE POLICY "Guests can approve quotes for their requests"
ON public.service_requests
FOR UPDATE
TO anon
USING (
  status = 'quoted'
)
WITH CHECK (
  status IN ('awaiting_payment', 'quoted')
);