-- Secure handle_new_user function to prevent role hijacking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile from metadata
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign role - FORCED to 'customer' by default. 
  -- Explicitly ignoring metadata 'role' to prevent privilege escalation.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    'customer'::app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Secure find_nearby_providers RPC
-- Revoke access from anonymous users
REVOKE EXECUTE ON FUNCTION public.find_nearby_providers(double precision, double precision, double precision, text) FROM anon;

-- Ensure only authenticated users can call it
GRANT EXECUTE ON FUNCTION public.find_nearby_providers(double precision, double precision, double precision, text) TO authenticated;
