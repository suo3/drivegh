-- Allow customers to cancel their own pending/assigned requests
CREATE POLICY "Customers can cancel their own requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id 
  AND status IN ('pending', 'assigned', 'accepted')
)
WITH CHECK (
  auth.uid() = customer_id 
  AND status = 'cancelled'
);