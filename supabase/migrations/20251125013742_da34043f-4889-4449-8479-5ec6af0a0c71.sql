-- Add fuel delivery specific columns to service_requests table
ALTER TABLE service_requests 
ADD COLUMN fuel_type text,
ADD COLUMN fuel_amount numeric;

-- Add comment to document the columns
COMMENT ON COLUMN service_requests.fuel_type IS 'Type of fuel: petrol, diesel, etc. Only applicable for fuel_delivery service type';
COMMENT ON COLUMN service_requests.fuel_amount IS 'Amount of fuel in liters. Only applicable for fuel_delivery service type';