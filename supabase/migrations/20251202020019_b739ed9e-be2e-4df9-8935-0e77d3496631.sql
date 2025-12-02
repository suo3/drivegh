-- Add super_admin policies for critical tables

-- Super admins can manage all user roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can view and manage all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins have full access to settings
CREATE POLICY "Super admins can manage all settings" ON public.settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can view all service requests
CREATE POLICY "Super admins can view all service requests" ON public.service_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage all transactions
CREATE POLICY "Super admins can manage all transactions" ON public.transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage all services
CREATE POLICY "Super admins can manage all services" ON public.services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage cities
CREATE POLICY "Super admins can manage cities" ON public.cities
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage homepage sections
CREATE POLICY "Super admins can manage homepage sections" ON public.homepage_sections
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage legal documents
CREATE POLICY "Super admins can manage legal documents" ON public.legal_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage contact messages
CREATE POLICY "Super admins can manage contact messages" ON public.contact_messages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage partnership applications
CREATE POLICY "Super admins can manage partnership applications" ON public.partnership_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage ratings
CREATE POLICY "Super admins can manage ratings" ON public.ratings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));