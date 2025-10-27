import { NavLink } from 'react-router-dom';
import { ClipboardList, CreditCard, User, Users, UserCheck, DollarSign } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface DashboardSidebarProps {
  role: 'customer' | 'provider' | 'admin';
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardSidebar({ role, currentView, onViewChange }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
    { title: 'Payments', view: 'payments', icon: DollarSign },
    { title: 'Profile', view: 'profile', icon: User },
  ];

  const items = role === 'customer' ? customerItems : role === 'provider' ? providerItems : adminItems;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.view)}
                    isActive={currentView === item.view}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
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
