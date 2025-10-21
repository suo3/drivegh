import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Truck } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  const handleDashboardClick = () => {
    console.log('Dashboard clicked. UserRole:', userRole, 'User:', user?.id);
    
    if (!userRole) {
      console.error('No user role found');
      return;
    }

    switch (userRole) {
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
        console.error('Unknown role:', userRole);
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
            <Button 
              onClick={handleDashboardClick} 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
              disabled={loading || !userRole}
            >
              {loading ? 'Loading...' : 'Dashboard'}
            </Button>
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
