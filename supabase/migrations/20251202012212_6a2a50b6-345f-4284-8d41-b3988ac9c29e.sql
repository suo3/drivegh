-- Add new service types to the enum
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'mechanic_fault';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'electrical_fault';

-- Insert new services into the services table
INSERT INTO services (name, slug, description, icon, is_active, display_order)
VALUES 
  (
    'Mechanic Faults',
    'mechanic-fault',
    'Expert mechanics to diagnose and fix mechanical issues with your vehicle',
    'Wrench',
    true,
    (SELECT COALESCE(MAX(display_order), 0) + 1 FROM services)
  ),
  (
    'Electrical Fault',
    'electrical-fault',
    'Professional electrical system diagnostics and repairs for your vehicle',
    'Zap',
    true,
    (SELECT COALESCE(MAX(display_order), 0) + 2 FROM services)
  )
ON CONFLICT (slug) DO NOTHING;