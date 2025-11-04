-- Add featured column to ratings table
ALTER TABLE public.ratings 
ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Update existing high-rated reviews to be featured by default
UPDATE public.ratings 
SET featured = true 
WHERE rating >= 4 AND review IS NOT NULL;