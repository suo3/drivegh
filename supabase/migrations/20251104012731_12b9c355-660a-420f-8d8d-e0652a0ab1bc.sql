-- Create homepage sections table
CREATE TABLE public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Policies for homepage_sections table
CREATE POLICY "Anyone can view homepage sections"
  ON public.homepage_sections
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert sections"
  ON public.homepage_sections
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sections"
  ON public.homepage_sections
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sections"
  ON public.homepage_sections
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections
INSERT INTO public.homepage_sections (name, label, display_order, is_active) VALUES
  ('services', 'Services Section', 1, true),
  ('how_it_works', 'How It Works Section', 2, true),
  ('mobile_money', 'Mobile Money Section', 3, true),
  ('testimonials', 'Customer Testimonials', 4, true),
  ('cities', 'Coverage Cities', 5, true),
  ('cta', 'Call to Action', 6, true);