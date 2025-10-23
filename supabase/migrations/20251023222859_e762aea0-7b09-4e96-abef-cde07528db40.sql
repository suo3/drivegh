-- Add amount column to service_requests table
ALTER TABLE public.service_requests
ADD COLUMN amount numeric;

COMMENT ON COLUMN public.service_requests.amount IS 'Total amount charged for the service when completed';