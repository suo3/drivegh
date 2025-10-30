-- Create services table
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Admins can view all services
CREATE POLICY "Admins can view all services"
ON public.services
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert services
CREATE POLICY "Admins can insert services"
ON public.services
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update services
CREATE POLICY "Admins can update services"
ON public.services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete services
CREATE POLICY "Admins can delete services"
ON public.services
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, slug, description, icon, display_order) VALUES
  ('Towing', 'towing', 'Vehicle towing service', 'Truck', 1),
  ('Tire Change', 'tire_change', 'Flat tire replacement', 'Wrench', 2),
  ('Fuel Delivery', 'fuel_delivery', 'Emergency fuel service', 'Fuel', 3),
  ('Battery Jump', 'battery_jump', 'Jump start service', 'Battery', 4),
  ('Lockout Service', 'lockout_service', 'Vehicle unlock', 'Key', 5),
  ('Emergency Help', 'emergency_assistance', 'Other emergencies', 'Settings', 6);