-- Allow admins to delete partnership applications
CREATE POLICY "Admins can delete applications"
ON public.partnership_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));