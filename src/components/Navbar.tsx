import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Truck, User, LogOut, LayoutDashboard } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole, loading, signOut } = useAuth();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data) setServices(data);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Settings;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary backdrop-blur-sm border-b border-white/10 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <img src="/icon-192.png" alt="DRIVE Ghana" className="h-10 w-10 rounded-full" />
          <span className="text-white font-bold text-lg">DRIVE <span className="text-accent2">GHANA</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-white">
          <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
          <Link to="/about" className="hover:text-accent transition-colors">ABOUT US</Link>
          <Link to="/partnership" className="hover:text-accent transition-colors">PARTNERSHIP</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-accent transition-colors outline-none">
              SERVICES
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 bg-background">
              {services.map((service) => {
                const Icon = getIconComponent(service.icon);
                return (
                  <DropdownMenuItem
                    key={service.id}
                    onClick={() => navigate(`/request-service?service=${service.slug}`)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {service.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/billing" className="hover:text-accent transition-colors">BILLING</Link>
          <Link to="/track-rescue" className="hover:text-accent transition-colors">TRACK RESCUE</Link>
        </div>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="!bg-transparent border-white text-white hover:bg-white hover:text-primary"
                  disabled={loading}
                >
                  <User className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'My Account'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleDashboardClick}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => { 
                    await signOut(); 
                    navigate('/'); 
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="outline" className="!bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Login
            </Button>
          )}
          <Button onClick={() => navigate('/request-service')} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Get Help
          </Button>
        </div>

        {/* Mobile buttons - Icon only */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="!bg-transparent border-white text-white hover:bg-white hover:text-primary"
                  disabled={loading}
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleDashboardClick}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => { 
                    await signOut(); 
                    navigate('/'); 
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              variant="outline" 
              size="icon"
              className="!bg-transparent border-white text-white hover:bg-white hover:text-primary"
            >
              <User className="h-4 w-4" />
            </Button>
          )}
          <Button 
            onClick={() => navigate('/request-service')} 
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Get Help
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
