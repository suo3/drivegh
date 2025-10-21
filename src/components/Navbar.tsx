import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Truck } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole, loading, signOut } = useAuth();

  const handleDashboardClick = async () => {
    console.log('Dashboard clicked. UserRole:', userRole, 'User:', user?.id);
    try {
      let role = userRole;
      if (!role && user?.id) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        role = roleRow?.role as typeof userRole;
      }
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'provider':
          navigate('/provider');
          break;
        case 'customer':
          navigate('/customer');
          break;
        default:
          console.error('No role found or unknown role:', role);
          navigate('/');
      }
    } catch (e) {
      console.error('Error resolving role for dashboard navigation', e);
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="bg-white rounded-full p-2">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <span className="text-white font-bold text-lg">DRIVE Ghana</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-white">
          <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
          <Link to="/about" className="hover:text-accent transition-colors">ABOUT US</Link>
          <Link to="/partnership" className="hover:text-accent transition-colors">PARTNERSHIP</Link>
          <a href="#services" className="hover:text-accent transition-colors">SERVICES</a>
          <Link to="/track-rescue" className="hover:text-accent transition-colors">TRACK RESCUE</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button 
                onClick={handleDashboardClick} 
                variant="outline" 
                className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Dashboard'}
              </Button>
              <Button 
                onClick={async () => { await signOut(); navigate('/'); }} 
                variant="outline" 
                className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Login
            </Button>
          )}
          <Button onClick={() => navigate('/get-help')} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Get Help
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
