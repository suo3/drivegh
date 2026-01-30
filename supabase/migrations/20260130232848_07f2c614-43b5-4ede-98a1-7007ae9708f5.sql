-- Update a request to have a quote for testing customer approval flow
UPDATE service_requests 
SET 
  status = 'quoted',
  quoted_amount = 150.00,
  quote_description = 'Towing service: Travel (15km) - GHS 50, Service fee - GHS 100',
  quoted_at = now()
WHERE id = '9457463e-174d-4c7d-b849-9244d2f55f76';