-- Insert customer role for existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('75cc1633-0cdd-4974-9a30-abf7b2dad087', 'customer')
ON CONFLICT (user_id, role) DO NOTHING;