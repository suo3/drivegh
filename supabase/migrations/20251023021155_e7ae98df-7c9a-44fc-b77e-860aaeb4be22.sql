-- Add is_available column to profiles table for provider availability status
ALTER TABLE public.profiles 
ADD COLUMN is_available boolean NOT NULL DEFAULT true;