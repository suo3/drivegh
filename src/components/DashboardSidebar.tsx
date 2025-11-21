import { ClipboardList, CreditCard, User, Users, UserCheck, DollarSign, LayoutDashboard, Settings, MessageSquare, MoreHorizontal, MapPin, Layout, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

export function DashboardSidebar({ role, currentView }: DashboardSidebarProps) {
  const navigate = useNavigate();
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
    const primaryItems = role === 'admin' ? items.slice(0, 4) : items;
    const moreItems = role === 'admin' ? items.slice(4) : [];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t-2 border-sidebar-border bg-sidebar/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-around px-1 py-2 safe-area-inset-bottom max-w-screen-lg mx-auto">
          {primaryItems.map((item) => {
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.view}
                onClick={() => navigate(`/dashboard/${item.view}`)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[72px] relative group touch-manipulation",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/70"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[11px] font-medium truncate max-w-full transition-colors duration-200",
                  isActive ? "text-primary-foreground" : "text-inherit"
                )}>
                  {item.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
          
          {/* More menu for admin */}
          {moreItems.length > 0 && (
            <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[72px] relative group touch-manipulation",
                    moreItems.some(item => currentView === item.view)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/70"
                  )}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-[11px] font-medium">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-t-2 border-border bg-background">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-2xl font-bold">More Options</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 pb-safe">
                  {moreItems.map((item) => {
                    const isActive = currentView === item.view;
                    
                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          navigate(`/dashboard/${item.view}`);
                          setMoreMenuOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-200 border touch-manipulation",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card border-border hover:border-primary/30 hover:bg-accent active:bg-accent/70"
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="text-sm font-medium text-center leading-tight">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
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
                    onClick={() => navigate(`/dashboard/${item.view}`)}
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
