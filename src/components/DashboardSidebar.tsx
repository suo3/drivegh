import { ClipboardList, CreditCard, User, Users, UserCheck, DollarSign, LayoutDashboard, Settings, MessageSquare } from 'lucide-react';
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
    { title: 'Services', view: 'services', icon: Settings },
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
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-sidebar/95 backdrop-blur-lg supports-[backdrop-filter]:bg-sidebar/90 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {items.slice(0, 5).map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px]",
                currentView === item.view
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                currentView === item.view && "scale-110"
              )} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">
                {item.title.split(' ')[0]}
              </span>
            </button>
          ))}
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
