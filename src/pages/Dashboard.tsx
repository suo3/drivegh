
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ProviderDashboard } from '@/components/dashboard/ProviderDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching role:', error);
          toast.error('Failed to load user profile');
        } else if (data && data.length > 0) {
          const roles = data.map(r => r.role);

          if (roles.includes('super_admin')) {
            setUserRole('super_admin');
            toast.success('Welcome Super Admin');
          } else if (roles.includes('admin')) {
            setUserRole('admin');
            toast.success('Welcome Admin');
          } else if (roles.includes('provider')) {
            setUserRole('provider');
          } else {
            setUserRole('customer');
          }
        } else {
          console.log('No specific role assigned, defaulting to customer');
          setUserRole('customer');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchUserRole();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (userRole) {
    case 'admin':
    case 'super_admin':
      return <AdminDashboard />;
    case 'provider':
      return <ProviderDashboard />;
    case 'customer':
      return <CustomerDashboard />;
    default:
      return <CustomerDashboard />;
  }
};

export default Dashboard;
