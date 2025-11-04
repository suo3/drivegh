-- Create cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Policies for cities table
CREATE POLICY "Anyone can view active cities"
  ON public.cities
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all cities"
  ON public.cities
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert cities"
  ON public.cities
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cities"
  ON public.cities
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cities"
  ON public.cities
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial cities
INSERT INTO public.cities (name, display_order) VALUES
  ('Accra', 1),
  ('Kumasi', 2),
  ('Tamale', 3),
  ('Tema', 4),
  ('Takoradi', 5),
  ('Obuasi', 6),
  ('Cape Coast', 7),
  ('Sunyani', 8),
  ('Koforidua', 9),
  ('Sekondi', 10),
  ('Ho', 11),
  ('Techiman', 12),
  ('Wa', 13),
  ('Bolgatanga', 14),
  ('Tarkwa', 15),
  ('Nkawkaw', 16),
  ('Winneba', 17),
  ('Kasoa', 18),
  ('Medina', 19),
  ('Madina', 20),
  ('Ashaiman', 21),
  ('Berekum', 22),
  ('Asamankese', 23),
  ('Nsawam', 24),
  ('Suhum', 25);