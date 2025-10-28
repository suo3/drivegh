-- Add policy to allow public read access to service_requests for tracking
-- This enables the Track Rescue page to work without login
CREATE POLICY "Anyone can view service requests for tracking"
ON public.service_requests
FOR SELECT
USING (true);