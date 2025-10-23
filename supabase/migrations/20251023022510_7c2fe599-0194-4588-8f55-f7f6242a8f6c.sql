-- Create trigger to automatically calculate commission amounts
CREATE TRIGGER calculate_transaction_commissions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission_amounts();