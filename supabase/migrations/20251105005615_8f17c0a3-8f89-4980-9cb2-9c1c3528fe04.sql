-- Add location coordinates to service_requests table
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS customer_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS provider_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS provider_lng DOUBLE PRECISION;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_service_requests_coordinates 
ON service_requests(customer_lat, customer_lng, provider_lat, provider_lng);

-- Add comment explaining the columns
COMMENT ON COLUMN service_requests.customer_lat IS 'Customer location latitude';
COMMENT ON COLUMN service_requests.customer_lng IS 'Customer location longitude';
COMMENT ON COLUMN service_requests.provider_lat IS 'Provider current location latitude';
COMMENT ON COLUMN service_requests.provider_lng IS 'Provider current location longitude';