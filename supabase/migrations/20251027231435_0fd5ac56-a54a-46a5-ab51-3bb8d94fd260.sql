-- Add vehicle information columns to service_requests table
ALTER TABLE public.service_requests
ADD COLUMN vehicle_make text,
ADD COLUMN vehicle_model text,
ADD COLUMN vehicle_year text,
ADD COLUMN vehicle_plate text;

COMMENT ON COLUMN public.service_requests.vehicle_make IS 'Vehicle manufacturer (e.g., Toyota, Honda)';
COMMENT ON COLUMN public.service_requests.vehicle_model IS 'Vehicle model (e.g., Camry, Accord)';
COMMENT ON COLUMN public.service_requests.vehicle_year IS 'Vehicle year of manufacture';
COMMENT ON COLUMN public.service_requests.vehicle_plate IS 'Vehicle license plate number';