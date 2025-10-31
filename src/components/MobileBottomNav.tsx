import { Home, Search, Phone, User, LogIn, ClipboardList, MapPin, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, userRole } = useAuth();

  // Don't show on dashboard pages (they have their own navigation)
  if (location.pathname === '/dashboard') {
    return null;
  }

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  // Guest user navigation
  const guestItems = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Services', path: '/request-service', icon: Search },
    { title: 'Track', path: '/track-rescue', icon: MapPin },
    { title: 'Contact', path: '/contact', icon: Phone },
    { title: 'Sign In', path: '/auth', icon: LogIn },
  ];

  // Authenticated user navigation
  const authenticatedItems = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Services', path: '/request-service', icon: Search },
    { title: 'Dashboard', path: '/dashboard', icon: ClipboardList },
    { title: 'Track', path: '/track-rescue', icon: MapPin },
    { title: 'Profile', path: '/dashboard', icon: User },
  ];

  const items = user ? authenticatedItems : guestItems;
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {items.map((item) => {
          const isActive = currentPath === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
