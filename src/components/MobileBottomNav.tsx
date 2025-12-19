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
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  // Guest user navigation
  const guestItems = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Services', path: '/', icon: Search },
    { title: 'Track', path: '/track-rescue', icon: MapPin },
    { title: 'Contact', path: '/contact', icon: Phone },
    { title: 'Sign In', path: '/auth', icon: LogIn },
  ];

  // Authenticated user navigation
  const authenticatedItems = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Services', path: '/', icon: Search },
    { title: 'Dashboard', path: '/dashboard', icon: ClipboardList },
    { title: 'Track', path: '/track-rescue', icon: MapPin },
    { title: 'My Account', path: '/dashboard', icon: User },
  ];

  const items = user ? authenticatedItems : guestItems;
  const currentPath = location.pathname;

  const handleNavClick = (path: string, title: string) => {
    if (title === 'Services' && currentPath === '/') {
      // Scroll to service form on homepage
      const formElement = document.getElementById('mobile-service-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-white/10  backdrop-blur-xl  shadow-[0_-4px_30px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2.5">
        {items.map((item) => {
          // Services button is never "active" - it's an action button that scrolls
          const isActive = item.title !== 'Services' && currentPath === item.path;
          
          return (
            <button
              key={item.title}
              onClick={() => handleNavClick(item.path, item.title)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 min-w-[68px] relative group active:scale-95 touch-manipulation",
                isActive
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-105"
                  : "text-foreground/60 hover:text-foreground hover:bg-accent/50 hover:scale-105"
              )}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-accent via-accent to-transparent rounded-full animate-fade-in" />
              )}
              
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300",
                isActive ? "scale-110 drop-shadow-lg text-accent-foreground" : "text-white group-hover:scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-semibold truncate max-w-[60px] transition-all duration-300",
                isActive ? "text-accent-foreground" : "text-white"
              )}>
                {item.title}
              </span>
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </nav>
  );
}
