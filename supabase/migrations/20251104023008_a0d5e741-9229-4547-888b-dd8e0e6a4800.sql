-- Create settings table for admin configurations
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage settings using existing has_role function
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow everyone to read settings (for map visibility)
CREATE POLICY "Everyone can read settings"
ON public.settings
FOR SELECT
USING (true);

-- Insert default map settings
INSERT INTO public.settings (key, value)
VALUES ('maps_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();