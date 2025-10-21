-- Create table for partnership applications
CREATE TABLE public.partnership_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.partnership_applications ENABLE ROW LEVEL SECURITY;

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.partnership_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update applications (to review them)
CREATE POLICY "Admins can update applications"
ON public.partnership_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Anyone can submit an application
CREATE POLICY "Anyone can submit applications"
ON public.partnership_applications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_partnership_applications_status ON public.partnership_applications(status);
CREATE INDEX idx_partnership_applications_created_at ON public.partnership_applications(created_at DESC);