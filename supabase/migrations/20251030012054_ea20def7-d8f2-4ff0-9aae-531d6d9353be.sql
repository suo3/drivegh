-- Add tracking_code column to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN tracking_code TEXT UNIQUE;

-- Create function to generate unique tracking code
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code (uppercase)
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM service_requests WHERE tracking_code = code) INTO exists_code;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create trigger to auto-generate tracking code on insert
CREATE OR REPLACE FUNCTION public.set_tracking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_tracking_code_trigger
BEFORE INSERT ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_tracking_code();

-- Backfill tracking codes for existing requests
UPDATE public.service_requests 
SET tracking_code = generate_tracking_code() 
WHERE tracking_code IS NULL;