-- Add location tracking and experience fields to profiles for providers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_lat double precision,
ADD COLUMN IF NOT EXISTS current_lng double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0;

-- Create function to find nearby available providers within a radius (km)
CREATE OR REPLACE FUNCTION public.find_nearby_providers(
  customer_lat double precision,
  customer_lng double precision,
  radius_km double precision DEFAULT 5.0,
  service_type_param text DEFAULT NULL
)
RETURNS TABLE (
  provider_id uuid,
  full_name text,
  avatar_url text,
  phone_number text,
  years_experience integer,
  is_available boolean,
  current_lat double precision,
  current_lng double precision,
  distance_km double precision,
  avg_rating numeric,
  total_reviews bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as provider_id,
    p.full_name,
    p.avatar_url,
    p.phone_number,
    COALESCE(p.years_experience, 0) as years_experience,
    p.is_available,
    p.current_lat,
    p.current_lng,
    -- Haversine formula for distance in km
    (6371 * acos(
      cos(radians(customer_lat)) * cos(radians(p.current_lat)) *
      cos(radians(p.current_lng) - radians(customer_lng)) +
      sin(radians(customer_lat)) * sin(radians(p.current_lat))
    )) as distance_km,
    COALESCE(AVG(r.rating), 0)::numeric as avg_rating,
    COUNT(r.id) as total_reviews
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'provider'
  LEFT JOIN ratings r ON r.provider_id = p.id
  WHERE 
    p.is_available = true
    AND p.current_lat IS NOT NULL 
    AND p.current_lng IS NOT NULL
    -- Filter by radius using Haversine
    AND (6371 * acos(
      cos(radians(customer_lat)) * cos(radians(p.current_lat)) *
      cos(radians(p.current_lng) - radians(customer_lng)) +
      sin(radians(customer_lat)) * sin(radians(p.current_lat))
    )) <= radius_km
  GROUP BY p.id, p.full_name, p.avatar_url, p.phone_number, p.years_experience, p.is_available, p.current_lat, p.current_lng
  ORDER BY distance_km ASC;
END;
$$;

-- Create function to get the closest available provider (for auto-assign)
CREATE OR REPLACE FUNCTION public.find_closest_provider(
  customer_lat double precision,
  customer_lng double precision
)
RETURNS TABLE (
  provider_id uuid,
  full_name text,
  distance_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as provider_id,
    p.full_name,
    (6371 * acos(
      cos(radians(customer_lat)) * cos(radians(p.current_lat)) *
      cos(radians(p.current_lng) - radians(customer_lng)) +
      sin(radians(customer_lat)) * sin(radians(p.current_lat))
    )) as distance_km
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'provider'
  WHERE 
    p.is_available = true
    AND p.current_lat IS NOT NULL 
    AND p.current_lng IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.find_nearby_providers TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_closest_provider TO anon, authenticated;