-- Create legal_documents table for managing terms and privacy policy
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL UNIQUE CHECK (document_type IN ('terms', 'privacy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view published documents
CREATE POLICY "Anyone can view published legal documents"
ON public.legal_documents
FOR SELECT
USING (is_published = true);

-- Admins can view all documents
CREATE POLICY "Admins can view all legal documents"
ON public.legal_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert documents
CREATE POLICY "Admins can insert legal documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update documents
CREATE POLICY "Admins can update legal documents"
ON public.legal_documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete documents
CREATE POLICY "Admins can delete legal documents"
ON public.legal_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default documents
INSERT INTO public.legal_documents (document_type, title, content, is_published)
VALUES 
(
  'terms',
  'Terms & Conditions',
  '# Terms & Conditions

Last updated: ' || to_char(now(), 'YYYY-MM-DD') || '

## 1. Acceptance of Terms

By accessing and using DRIVE Ghana''s roadside assistance services, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Service Description

DRIVE Ghana provides emergency roadside assistance services including but not limited to:
- Vehicle towing
- Tire changes
- Fuel delivery
- Battery jump-start
- Lockout services
- Minor repairs

## 3. Service Availability

Services are subject to availability and may vary by location. Response times are estimates and not guaranteed.

## 4. Payment Terms

- All services must be paid for at the time of service completion
- Payment methods include cash, mobile money, and credit/debit cards
- Prices are subject to change without notice

## 5. User Responsibilities

Users must:
- Provide accurate location information
- Be present at the service location
- Provide accurate vehicle information
- Ensure safe access to the vehicle

## 6. Limitation of Liability

DRIVE Ghana is not liable for:
- Delays in service delivery due to unforeseen circumstances
- Damage to vehicles resulting from pre-existing conditions
- Loss of personal items in the vehicle

## 7. Privacy

Your use of our service is also governed by our Privacy Policy.

## 8. Changes to Terms

We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of modified terms.

## 9. Contact Information

For questions about these Terms & Conditions, please contact us at:
- Email: support@drivegh.com
- Phone: +233 20 222 2244',
  true
),
(
  'privacy',
  'Privacy Policy',
  '# Privacy Policy

Last updated: ' || to_char(now(), 'YYYY-MM-DD') || '

## 1. Information We Collect

We collect information you provide directly to us when using our services:

### Personal Information
- Name and contact information
- Phone number and email address
- Vehicle information
- Location data (for service delivery)

### Automatically Collected Information
- Device information
- Usage data
- GPS coordinates (when you request service)

## 2. How We Use Your Information

We use the information we collect to:
- Provide roadside assistance services
- Match you with service providers
- Process payments
- Communicate with you about your service requests
- Improve our services
- Send service updates and notifications

## 3. Information Sharing

We may share your information with:
- Service providers assigned to your request
- Payment processors
- Legal authorities when required by law

We do not sell your personal information to third parties.

## 4. Data Security

We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.

## 5. Location Data

We collect your location data to:
- Dispatch the nearest service provider
- Track service delivery
- Calculate accurate distances
- Improve service efficiency

You can disable location services, but this may affect our ability to provide services.

## 6. Data Retention

We retain your information for as long as necessary to provide services and comply with legal obligations.

## 7. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your information
- Opt-out of marketing communications

## 8. Cookies

We use cookies and similar technologies to improve your experience and analyze usage patterns.

## 9. Children''s Privacy

Our services are not intended for users under 18 years of age.

## 10. Changes to Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## 11. Contact Us

For questions about this Privacy Policy, contact us at:
- Email: support@drivegh.com
- Phone: +233 53 507 2058
- Address: Estate #5. Kitase-Akuapim, Eastern Region, Ghana',
  true
)
ON CONFLICT (document_type) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON public.legal_documents(document_type);

-- Add comment
COMMENT ON TABLE public.legal_documents IS 'Stores legal documents like Terms & Conditions and Privacy Policy that can be managed by admins';