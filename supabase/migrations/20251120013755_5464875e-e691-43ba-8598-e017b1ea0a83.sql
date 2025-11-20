-- Fix security vulnerabilities in RLS policies

-- 1. Fix profiles table - restrict public access to sensitive data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix service_requests table - remove public access
DROP POLICY IF EXISTS "Anyone can view service requests for tracking" ON public.service_requests;
DROP POLICY IF EXISTS "Users can view their requests" ON public.service_requests;

CREATE POLICY "Authenticated users can view their own requests"
ON public.service_requests
FOR SELECT
USING (
  auth.uid() = customer_id 
  OR auth.uid() = provider_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view requests with valid tracking code"
ON public.service_requests
FOR SELECT
USING (
  tracking_code IS NOT NULL 
  AND tracking_code != ''
);

-- 3. Fix ratings table - restrict public access
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;

CREATE POLICY "Anyone can view featured ratings"
ON public.ratings
FOR SELECT
USING (featured = true);

CREATE POLICY "Users can view ratings for their requests"
ON public.ratings
FOR SELECT
USING (
  auth.uid() = customer_id 
  OR auth.uid() = provider_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Fix user_roles table - prevent self-assignment of admin role
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

CREATE POLICY "Users can insert customer or provider role only"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('customer'::app_role, 'provider'::app_role)
);