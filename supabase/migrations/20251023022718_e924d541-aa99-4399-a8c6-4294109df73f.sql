-- Enable realtime for service_requests table
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;

-- Add service_requests to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;