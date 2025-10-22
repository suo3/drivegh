-- Assign customer role to user Sam Yibaah
INSERT INTO public.user_roles (user_id, role)
VALUES ('71b2d614-9f30-4e5f-9e9d-ae09b9897f98', 'customer')
ON CONFLICT (user_id, role) DO NOTHING;