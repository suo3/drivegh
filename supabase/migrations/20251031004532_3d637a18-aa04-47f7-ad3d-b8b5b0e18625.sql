-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.contact_messages IS 'Stores contact form submissions from users';