-- Add commission tracking columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN provider_percentage numeric NOT NULL DEFAULT 70,
ADD COLUMN provider_amount numeric,
ADD COLUMN platform_amount numeric;

-- Add a trigger to automatically calculate amounts based on percentage
CREATE OR REPLACE FUNCTION public.calculate_commission_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate provider amount (percentage of total)
  NEW.provider_amount := (NEW.amount * NEW.provider_percentage / 100);
  
  -- Calculate platform amount (remainder)
  NEW.platform_amount := (NEW.amount - NEW.provider_amount);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate amounts before insert or update
CREATE TRIGGER calculate_transaction_commission
BEFORE INSERT OR UPDATE OF amount, provider_percentage ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_commission_amounts();