-- Fix search path for calculate_commission_amounts function
CREATE OR REPLACE FUNCTION public.calculate_commission_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate provider amount (percentage of total)
  NEW.provider_amount := (NEW.amount * NEW.provider_percentage / 100);
  
  -- Calculate platform amount (remainder)
  NEW.platform_amount := (NEW.amount - NEW.provider_amount);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;