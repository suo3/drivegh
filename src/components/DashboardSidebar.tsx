import { ClipboardList, CreditCard, User, Users, UserCheck, DollarSign, LayoutDashboard, Settings, MessageSquare, MoreHorizontal, MapPin, Layout, Star } from 'lucide-react';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  role: 'customer' | 'provider' | 'admin';
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardSidebar({ role, currentView, onViewChange }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const customerItems = [
    { title: 'Service Requests', view: 'requests', icon: ClipboardList },
    { title: 'Payment History', view: 'payments', icon: CreditCard },
    { title: 'Profile', view: 'profile', icon: User },
  ];

  const providerItems = [
    { title: 'Assigned Jobs', view: 'assigned', icon: ClipboardList },
    { title: 'Completed Jobs', view: 'completed', icon: ClipboardList },
    { title: 'Profile', view: 'profile', icon: User },
  ];

  const adminItems = [
    { title: 'Service Requests', view: 'requests', icon: ClipboardList },
    { title: 'Providers', view: 'providers', icon: UserCheck },
    { title: 'Customers', view: 'customers', icon: Users },
    { title: 'Users', view: 'users', icon: User },
    { title: 'Payments', view: 'payments', icon: DollarSign },
    { title: 'Partnership Applications', view: 'applications', icon: UserCheck },
    { title: 'Contact Messages', view: 'messages', icon: MessageSquare },
    { title: 'Services', view: 'services', icon: LayoutDashboard },
    { title: 'Cities', view: 'cities', icon: MapPin },
    { title: 'Testimonials', view: 'testimonials', icon: Star },
    { title: 'Homepage', view: 'homepage', icon: Layout },
    { title: 'System Settings', view: 'settings', icon: Settings },
    { title: 'Profile', view: 'profile', icon: User },
  ];

  const items = role === 'customer' ? customerItems : role === 'provider' ? providerItems : adminItems;
  
  const getRoleTitle = () => {
    if (role === 'customer') return 'Customer Portal';
    if (role === 'provider') return 'Provider Portal';
    return 'Admin Portal';
  };

  // Mobile: Horizontal bottom navigation
  if (isMobile) {
    // For admin, show first 4 items + More menu
    const primaryItems = role === 'admin' ? items.slice(0, 4) : items.slice(0, 5);
    const moreItems = role === 'admin' ? items.slice(4) : [];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border/50 bg-gradient-to-t from-sidebar via-sidebar/95 to-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80 shadow-[0_-4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-around px-2 py-2.5 safe-area-inset-bottom">
          {primaryItems.map((item) => {
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 min-w-[68px] relative group",
                  isActive
                    ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:scale-105 active:scale-95"
                )}
              >
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-accent via-accent to-transparent rounded-full animate-fade-in" />
                )}
                
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive && "scale-110 drop-shadow-lg",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold truncate max-w-[60px] transition-all duration-300",
                  isActive && "text-primary-foreground"
                )}>
                  {item.title.split(' ')[0]}
                </span>
                
                {/* Hover glow effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                )}
              </button>
            );
          })}
          
          {/* More menu for admin */}
          {moreItems.length > 0 && (
            <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 min-w-[68px] relative group",
                    moreItems.some(item => currentView === item.view)
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:scale-105 active:scale-95"
                  )}
                >
                  {moreItems.some(item => currentView === item.view) && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-accent via-accent to-transparent rounded-full animate-fade-in" />
                  )}
                  <MoreHorizontal className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
                  <span className="text-[10px] font-semibold">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl border-t-2 border-border/50 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    More Options
                  </SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 mt-6 pb-6">
                  {moreItems.map((item) => {
                    const isActive = currentView === item.view;
                    
                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          onViewChange(item.view);
                          setMoreMenuOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all duration-300 border-2 group",
                          isActive
                            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-transparent shadow-lg shadow-primary/20 scale-105"
                            : "bg-background border-border hover:border-primary/50 hover:bg-accent hover:scale-105 active:scale-95"
                        )}
                      >
                        <item.icon className={cn(
                          "h-7 w-7 transition-all duration-300",
                          isActive ? "drop-shadow-lg" : "group-hover:scale-110"
                        )} />
                        <span className="text-xs font-semibold text-center">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </nav>
    );
  }

  // Desktop: Vertical sidebar
  return (
    <Sidebar collapsible="icon" className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">{getRoleTitle()}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-sidebar-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.view)}
                    isActive={currentView === item.view}
                    tooltip={item.title}
                    className="group relative my-0.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:h-5 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-primary-foreground"
                  >
                    <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    {!collapsed && <span className="font-medium">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
