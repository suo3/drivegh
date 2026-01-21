import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Star, DollarSign, ClipboardList, Users, UserCheck, UserX, Edit, Trash2, MessageSquare, Mail, Eye, Archive, Search, Filter, Phone, User, Clock, MapPin, CreditCard, Calendar, Building2, CheckCircle, Fuel } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ProfileForm } from '@/components/ProfileForm';
import ServiceManager from '@/components/ServiceManager';
import CitiesManager from '@/components/CitiesManager';
import HomepageSectionsManager from '@/components/HomepageSectionsManager';
import TestimonialsManager from '@/components/TestimonialsManager';
import { z } from 'zod';

const Dashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { view } = useParams();
  const [loading, setLoading] = useState(true);
  const currentView = view || 'requests';

  // Customer state
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Provider state
  const [earnings, setEarnings] = useState(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);

  // Admin state
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState<string | null>(null);
  const [mapsEnabled, setMapsEnabled] = useState(true);

  // Admin filters
  const [adminRequestFilter, setAdminRequestFilter] = useState('');
  const [adminCustomerFilter, setAdminCustomerFilter] = useState('');
  const [adminProviderFilter, setAdminProviderFilter] = useState('');
  const [adminApplicationFilter, setAdminApplicationFilter] = useState('');

  // Contact messages filters
  const [messageStatusFilter, setMessageStatusFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  // Customer request filters
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  useEffect(() => {

    if (authLoading) {
      return;
    }

    if (!user) {

      navigate('/auth');
      return;
    }

    if (userRole) {

      // Navigate to default view based on role if on base /dashboard
      if (!view) {
        if (userRole === 'customer') navigate('/dashboard/requests', { replace: true });
        else if (userRole === 'provider') navigate('/dashboard/assigned', { replace: true });
        else if (userRole === 'admin' || userRole === 'super_admin') navigate('/dashboard/requests', { replace: true });
      }
      fetchData();
    } else {
      // If userRole is not available after auth is done, stop loading
      setLoading(false);
    }
  }, [user, userRole, authLoading, navigate, view]);

  useEffect(() => {
    if (!user || (userRole !== 'admin' && userRole !== 'super_admin')) return;

    const requestsChannel = supabase
      .channel('service_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests'
        },
        () => {
          fetchServiceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests'
        },
        () => {
          fetchServiceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          // Handle DELETE optimistically - remove from state without re-fetching
          setAllRequests(prev => prev.filter(req => req.id !== payload.old.id));
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, userRole]);

  const fetchData = async () => {

    setLoading(true);
    try {
      if (userRole === 'customer') {
        console.log('Fetching customer data');
        await fetchCustomerData();
      } else if (userRole === 'provider') {
        console.log('Fetching provider data');
        await fetchProviderData();
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        console.log('Fetching admin data');
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      console.log('fetchData complete, setting loading to false');
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    const [requestsRes, transactionsRes, profileRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select(`
          *, 
          profiles!service_requests_provider_id_fkey(full_name),
          transactions(amount, provider_amount)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase.from('transactions').select('*, service_requests(service_type)').eq('service_requests.customer_id', user?.id),
      supabase.from('profiles').select('*').eq('id', user?.id).single()
    ]);

    if (requestsRes.data) setRequests(requestsRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (profileRes.data) setProfile(profileRes.data);
  };

  const fetchProviderData = async () => {
    const [requestsRes, transactionsRes, ratingsRes, profileRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select(`
          *, 
          profiles!service_requests_customer_id_fkey(full_name, phone_number),
          transactions(amount, provider_amount)
        `)
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase.from('transactions').select('provider_amount, service_requests!inner(provider_id)').eq('service_requests.provider_id', user?.id),
      supabase.from('ratings').select('*').eq('provider_id', user?.id),
      supabase.from('profiles').select('is_available').eq('id', user?.id).single()
    ]);

    if (requestsRes.data) setRequests(requestsRes.data);
    if (transactionsRes.data) {
      const total = transactionsRes.data.reduce((sum, t) => sum + Number(t.provider_amount || 0), 0);
      setEarnings(total);
    }
    if (ratingsRes.data) {
      setRatings(ratingsRes.data);
      if (ratingsRes.data.length > 0) {
        const avg = ratingsRes.data.reduce((sum, r) => sum + r.rating, 0) / ratingsRes.data.length;
        setAvgRating(avg);
      }
    }
    if (profileRes.data) {
      setIsAvailable(profileRes.data.is_available);
    }
  };

  const fetchAdminData = async () => {
    // Fetch IDs by role first to avoid relying on PostgREST relationship inference
    const [requestsRes, providerIdsRes, customerIdsRes, transactionsRes, appsRes, contactMessagesRes, allProfilesRes, allUserRolesRes, ratingsRes, settingsRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select(`
          *, 
          profiles!service_requests_customer_id_fkey(full_name),
          transactions(amount, provider_amount, platform_amount)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'provider'),
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('partnership_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('ratings').select('*'),
      supabase.from('settings').select('*').eq('key', 'maps_enabled').single(),
    ]);

    const providerIds = providerIdsRes.data?.map((r: any) => r.user_id) || [];
    const customerIds = customerIdsRes.data?.map((r: any) => r.user_id) || [];

    const [providersRes, customersRes] = await Promise.all([
      providerIds.length
        ? supabase.from('profiles').select('*').in('id', providerIds)
        : Promise.resolve({ data: [], error: null }),
      customerIds.length
        ? supabase.from('profiles').select('*').in('id', customerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (requestsRes.data) setAllRequests(requestsRes.data);
    if (providersRes.data) {
      // Add ratings to providers
      const providersWithRatings = providersRes.data.map(provider => {
        const providerRatings = ratingsRes.data?.filter(r => r.provider_id === provider.id) || [];
        const avgRating = providerRatings.length > 0
          ? providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length
          : 0;
        return {
          ...provider,
          ratings: providerRatings,
          avgRating,
          ratingCount: providerRatings.length
        };
      });
      setProviders(providersWithRatings);
    }
    if (customersRes.data) setCustomers(customersRes.data);
    if (transactionsRes.data) setAllTransactions(transactionsRes.data);
    if (appsRes.data) setApplications(appsRes.data);
    if (contactMessagesRes.data) setContactMessages(contactMessagesRes.data);
    if (settingsRes.data) {
      const settingsValue = settingsRes.data.value as { enabled?: boolean };
      setMapsEnabled(settingsValue?.enabled ?? true);
    }

    // Combine profiles with their roles
    if (allProfilesRes.data && allUserRolesRes.data) {
      const profilesWithRoles = allProfilesRes.data.map(profile => ({
        ...profile,
        user_roles: allUserRolesRes.data.filter(ur => ur.user_id === profile.id)
      }));
      setAllUsers(profilesWithRoles);
    }
  };

  const handleUpdateProfile = async (updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', user?.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      fetchData();
    }
  };

  const handleCreateRequest = async (data: any) => {
    const { error } = await supabase.from('service_requests').insert([{
      customer_id: user?.id,
      service_type: data.service_type,
      location: data.location,
      description: data.description,
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      vehicle_year: data.vehicle_year || null,
      vehicle_plate: data.vehicle_plate || null
    }]);
    if (error) {
      toast.error('Failed to create request');
    } else {
      toast.success('Service request created successfully');
      fetchData();
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    const { error } = await supabase.from('service_requests').update({ status: status as any }).eq('id', requestId);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated successfully');
      fetchData();
    }
  };

  const handleAssignProvider = async (requestId: string, providerId: string) => {
    const { error } = await supabase.from('service_requests').update({
      provider_id: providerId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      assigned_by: user?.id
    }).eq('id', requestId);
    if (error) {
      toast.error('Failed to assign provider');
    } else {
      toast.success('Provider assigned successfully');
      fetchData();
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    // Optimistically remove from state for instant UI feedback
    setAllRequests(prev => prev.filter(req => req.id !== requestId));

    const { error } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to delete request');
      // Re-fetch to restore state on error
      fetchServiceRequests();
    } else {
      toast.success('Request deleted successfully');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      toast.error('Failed to delete profile');
    } else {
      toast.success('Profile deleted successfully');
      fetchData();
    }
  };

  const handleToggleMaps = async (enabled: boolean) => {
    const { error } = await supabase
      .from('settings')
      .update({ value: { enabled } })
      .eq('key', 'maps_enabled');

    if (error) {
      toast.error('Failed to update map settings');
    } else {
      toast.success(`Maps ${enabled ? 'enabled' : 'disabled'} successfully`);
      setMapsEnabled(enabled);
    }
  };

  const fetchServiceRequests = async () => {
    const { data } = await supabase
      .from('service_requests')
      .select('*, profiles!service_requests_customer_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    if (data) setAllRequests(data);
  };

  const transactionSchema = z.object({
    amount: z.number().positive({ message: "Amount must be positive" }).max(1000000, { message: "Amount too large" }),
    provider_percentage: z.number().min(0, { message: "Percentage must be at least 0" }).max(100, { message: "Percentage cannot exceed 100" })
  });

  const handleCompletePayment = async (requestId: string, amount: number, providerPercentage: number) => {
    try {
      transactionSchema.parse({ amount, provider_percentage: providerPercentage });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    const { error: txError } = await supabase.from('transactions').insert([{
      service_request_id: requestId,
      transaction_type: 'customer_to_business',
      amount,
      provider_percentage: providerPercentage,
      payment_method: 'mobile_money',
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString()
    }]);

    if (txError) {
      toast.error('Failed to record payment');
      return;
    }

    const { error: reqError } = await supabase.from('service_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', requestId);

    if (reqError) {
      toast.error('Failed to complete request');
    } else {
      toast.success('Payment recorded and request completed');
      fetchData();
    }
  };

  const handleUpdateTransaction = async (transactionId: string, amount: number, providerPercentage: number) => {
    try {
      transactionSchema.parse({ amount, provider_percentage: providerPercentage });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        amount,
        provider_percentage: providerPercentage
      })
      .eq('id', transactionId);

    if (error) {
      toast.error('Failed to update transaction');
    } else {
      toast.success('Transaction updated successfully');
      fetchData();
    }
  };

  const handleToggleAvailability = async (available: boolean) => {
    setIsAvailable(available);
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: available })
      .eq('id', user?.id);

    if (error) {
      toast.error('Failed to update availability');
      setIsAvailable(!available);
    } else {
      toast.success(`You are now ${available ? 'available' : 'unavailable'} for new requests`);
    }
  };

  const handleCreateUser = async (email: string, password: string, fullName: string, phoneNumber: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email,
          password,
          fullName,
          phoneNumber,
          role
        }
      });

      if (error) {
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      if (data?.error) {
        toast.error('Failed to create user: ' + data.error);
        return;
      }

      toast.success('User created successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message);
    }
  };

  const handleUpdateUser = async (userId: string, updates: { full_name?: string; phone_number?: string; email?: string; location?: string; is_available?: boolean }) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update user');
      return;
    }

    toast.success('User updated successfully');
    fetchData();
  };

  const handleUpdateUserRole = async (userId: string, newRole: string, oldRole: string) => {
    // Remove old role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', oldRole as any);

    if (deleteError) {
      toast.error('Failed to remove old role');
      return;
    }

    // Add new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: newRole as any }]);

    if (insertError) {
      toast.error('Failed to assign new role');
      return;
    }

    toast.success('User role updated successfully');
    fetchData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast.error('Failed to delete user');
      return;
    }

    toast.success('User deleted successfully');
    fetchData();
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase
      .from('partnership_applications')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to update application status');
      return;
    }

    toast.success('Application status updated successfully');
    fetchData();
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this partnership application? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('partnership_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to delete application');
      return;
    }

    toast.success('Application deleted successfully');
    fetchData();
  };

  const handleUpdateContactMessageStatus = async (messageId: string, status: 'new' | 'read' | 'archived') => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to update message status');
      return;
    }

    toast.success(`Message marked as ${status}`);
    fetchData();
  };

  const handleDeleteContactMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
      return;
    }

    toast.success('Message deleted successfully');
    fetchData();
  };

  const handleCreateUserFromApplication = async (application: any, role: 'provider' | 'customer', password: string) => {
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: application.email,
          password: password,
          fullName: application.contact_person,
          phoneNumber: application.phone,
          role: role,
          applicationId: application.id
        }
      });

      if (error) {
        toast.error('Failed to create user account: ' + error.message);
        return;
      }

      if (data?.error) {
        toast.error('Failed to create user account: ' + data.error);
        return;
      }

      toast.success(`User account created successfully as ${role}`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create user account: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusBorderColor = (status: string) => {
    const colors: any = {
      pending: 'border-l-yellow-500',
      assigned: 'border-l-blue-500',
      accepted: 'border-l-blue-600',
      en_route: 'border-l-purple-500',
      in_progress: 'border-l-purple-600',
      completed: 'border-l-green-500',
      cancelled: 'border-l-red-500',
      denied: 'border-l-red-600'
    };
    return colors[status] || 'border-l-gray-500';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center space-y-6 animate-scale-in">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-lg font-semibold text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Card className="max-w-md shadow-2xl border-2 animate-scale-in">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <UserX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">No Role Assigned</CardTitle>
            <CardDescription className="text-base">
              Your account doesn't have a role assigned yet. Please contact support for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Customer Dashboard
  if (userRole === 'customer') {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
          <DashboardSidebar role="customer" currentView={currentView} />

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />

            {/* Compact mobile header */}
            <header className="sticky top-16 z-10 border-b bg-gradient-to-r from-primary/10 via-background to-accent/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm lg:block hidden">
              <div className="flex items-center gap-3 px-4 py-4 lg:px-6 lg:py-5">
                <SidebarTrigger className="-ml-2 hover:bg-primary/10 transition-colors" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
                  </h1>
                  <p className="text-sm text-muted-foreground">Manage your service requests</p>
                </div>
              </div>
            </header>

            {/* Mobile: compact greeting */}
            <div className="lg:hidden sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary px-4 py-3 shadow-md">
              <h1 className="text-lg font-bold text-primary-foreground truncate">
                Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
              </h1>
            </div>

            <main className="flex-1 p-3 lg:p-6 lg:pt-24 space-y-3 lg:space-y-6 overflow-auto bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-28 lg:pb-6">
              {/* Mobile: Single CTA button at top */}
              <div className="lg:hidden">
                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-semibold"
                  size="lg"
                >
                  New Service Request
                </Button>
              </div>

              {/* Desktop: Stats and CTA */}
              <div className="hidden lg:flex justify-end">
                <Button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-semibold"
                  size="lg"
                >
                  New Service Request
                </Button>
              </div>

              {/* Compact stats on mobile, full on desktop */}
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 lg:gap-6">
                <Card className="hover-lift bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 hover:border-blue-200 animate-scale-in">
                  <CardHeader className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-2">
                      <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Total</CardTitle>
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                        <ClipboardList className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-2xl lg:text-4xl font-bold text-primary text-center lg:text-left">{requests.length}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">All time</p>
                  </CardContent>
                </Card>
                <Card className="hover-lift bg-gradient-to-br from-purple-50 to-pink-50/50 border-2 hover:border-purple-200 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-2">
                      <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Active</CardTitle>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                        <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-2xl lg:text-4xl font-bold text-primary text-center lg:text-left">{requests.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">In progress</p>
                  </CardContent>
                </Card>
                <Card className="hover-lift bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 hover:border-green-200 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-2">
                      <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Done</CardTitle>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                        <UserCheck className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-2xl lg:text-4xl font-bold text-primary text-center lg:text-left">{requests.filter(r => r.status === 'completed').length}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">Successfully done</p>
                  </CardContent>
                </Card>
              </div>

              {currentView === 'requests' && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Requests</CardTitle>
                    <CardDescription>View and manage your service requests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by service, location, or provider..."
                            value={requestSearchQuery}
                            onChange={(e) => setRequestSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="en_route">En Route</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results count */}
                    {(requestStatusFilter !== 'all' || requestSearchQuery) && (
                      <div className="text-sm text-muted-foreground">
                        Showing {requests.filter(request => {
                          const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                          const matchesSearch = !requestSearchQuery ||
                            request.service_type?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                            request.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                            request.profiles?.full_name?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                          return matchesStatus && matchesSearch;
                        }).length} of {requests.length} requests
                      </div>
                    )}

                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests
                            .filter(request => {
                              const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                              const matchesSearch = !requestSearchQuery ||
                                request.service_type?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                request.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                request.profiles?.full_name?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                              return matchesStatus && matchesSearch;
                            })
                            .length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <ClipboardList className="h-8 w-8" />
                                  <p>No requests found matching your filters</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            requests
                              .filter(request => {
                                const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                                const matchesSearch = !requestSearchQuery ||
                                  request.service_type?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                  request.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                  request.profiles?.full_name?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                                return matchesStatus && matchesSearch;
                              })
                              .map((request) => (
                                <TableRow key={request.id}>
                                  <TableCell>{request.service_type}</TableCell>
                                  <TableCell>{request.location}</TableCell>
                                  <TableCell>{request.profiles?.full_name || 'Unassigned'}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {request.transactions && request.transactions.length > 0 && request.transactions[0].amount
                                      ? `GHS ${Number(request.transactions[0].amount).toFixed(2)}`
                                      : request.status === 'completed' ? 'Pending Payment' : '-'}
                                  </TableCell>
                                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    {['pending', 'assigned', 'accepted'].includes(request.status) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          if (confirm('Are you sure you want to cancel this request?')) {
                                            const { error } = await supabase
                                              .from('service_requests')
                                              .update({ status: 'cancelled' })
                                              .eq('id', request.id);

                                            if (error) {
                                              toast.error('Failed to cancel request');
                                            } else {
                                              toast.success('Request cancelled successfully');
                                              fetchData();
                                            }
                                          }
                                        }}
                                        className="mr-2"
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                    {request.status === 'completed' && (
                                      <Dialog open={ratingDialogOpen === request.id} onOpenChange={(open) => setRatingDialogOpen(open ? request.id : null)}>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm">Rate</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Rate Service</DialogTitle>
                                          </DialogHeader>
                                          <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!user?.id) {
                                              toast.error('You must be signed in to submit a rating');
                                              return;
                                            }
                                            const formData = new FormData(e.currentTarget);
                                            const rating = Number(formData.get('rating'));
                                            const review = (formData.get('review') as string) || null;

                                            const payload = {
                                              service_request_id: request.id,
                                              provider_id: request.provider_id,
                                              customer_id: user.id,
                                              rating,
                                              review,
                                            };

                                            const { error } = await supabase.from('ratings').insert([payload]);

                                            if (error) {
                                              // Handle duplicate rating by updating existing record
                                              if ((error as any).code === '23505' || error.message?.includes('duplicate key value')) {
                                                const { error: updateError } = await supabase
                                                  .from('ratings')
                                                  .update({ rating, review })
                                                  .eq('service_request_id', request.id)
                                                  .eq('customer_id', user.id);

                                                if (updateError) {
                                                  toast.error('Failed to update existing rating');
                                                  return;
                                                }

                                                toast.success('Rating updated successfully');
                                                setRatingDialogOpen(null);
                                                fetchData();
                                              } else {
                                                toast.error(error.message || 'Failed to submit rating');
                                              }
                                            } else {
                                              toast.success('Rating submitted successfully');
                                              setRatingDialogOpen(null);
                                              fetchData();
                                            }
                                          }}>
                                            <div className="space-y-4">
                                              <div>
                                                <Label>Rating (1-5)</Label>
                                                <Input name="rating" type="number" min="1" max="5" required />
                                              </div>
                                              <div>
                                                <Label>Review</Label>
                                                <Textarea name="review" />
                                              </div>
                                              <Button type="submit" className="w-full">Submit</Button>
                                            </div>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View - Shown on Mobile Only */}
                    <div className="md:hidden space-y-4">
                      {requests
                        .filter(request => {
                          const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                          const matchesSearch = !requestSearchQuery ||
                            request.service_type?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                            request.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                            request.profiles?.full_name?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                          return matchesStatus && matchesSearch;
                        })
                        .length === 0 ? (
                        <div className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ClipboardList className="h-8 w-8" />
                            <p>No requests found matching your filters</p>
                          </div>
                        </div>
                      ) : (
                        requests
                          .filter(request => {
                            const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                            const matchesSearch = !requestSearchQuery ||
                              request.service_type?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                              request.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                              request.profiles?.full_name?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                            return matchesStatus && matchesSearch;
                          })
                          .map((request) => (
                            <Card key={request.id} className={`border-2 border-l-4 ${getStatusBorderColor(request.status)}`}>
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1 flex-1">
                                    <h3 className="font-semibold capitalize">{request.service_type}</h3>
                                    <p className="text-sm text-muted-foreground">{request.location}</p>
                                  </div>
                                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                </div>

                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{request.profiles?.full_name || 'Unassigned'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {request.transactions && request.transactions.length > 0 && request.transactions[0].amount
                                        ? `GHS ${Number(request.transactions[0].amount).toFixed(2)}`
                                        : request.status === 'completed' ? 'Pending Payment' : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t">
                                  {['pending', 'assigned', 'accepted'].includes(request.status) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to cancel this request?')) {
                                          const { error } = await supabase
                                            .from('service_requests')
                                            .update({ status: 'cancelled' })
                                            .eq('id', request.id);

                                          if (error) {
                                            toast.error('Failed to cancel request');
                                          } else {
                                            toast.success('Request cancelled successfully');
                                            fetchData();
                                          }
                                        }
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                  {request.status === 'completed' && (
                                    <Dialog open={ratingDialogOpen === request.id} onOpenChange={(open) => setRatingDialogOpen(open ? request.id : null)}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex-1">Rate</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Rate Service</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={async (e) => {
                                          e.preventDefault();
                                          if (!user?.id) {
                                            toast.error('You must be signed in to submit a rating');
                                            return;
                                          }
                                          const formData = new FormData(e.currentTarget);
                                          const rating = Number(formData.get('rating'));
                                          const review = (formData.get('review') as string) || null;

                                          const payload = {
                                            service_request_id: request.id,
                                            provider_id: request.provider_id,
                                            customer_id: user.id,
                                            rating,
                                            review,
                                          };

                                          const { error } = await supabase.from('ratings').insert([payload]);

                                          if (error) {
                                            if ((error as any).code === '23505' || error.message?.includes('duplicate key value')) {
                                              const { error: updateError } = await supabase
                                                .from('ratings')
                                                .update({ rating, review })
                                                .eq('service_request_id', request.id)
                                                .eq('customer_id', user.id);

                                              if (updateError) {
                                                toast.error('Failed to update existing rating');
                                                return;
                                              }

                                              toast.success('Rating updated successfully');
                                              setRatingDialogOpen(null);
                                              fetchData();
                                            } else {
                                              toast.error(error.message || 'Failed to submit rating');
                                            }
                                          } else {
                                            toast.success('Rating submitted successfully');
                                            setRatingDialogOpen(null);
                                            fetchData();
                                          }
                                        }}>
                                          <div className="space-y-4">
                                            <div>
                                              <Label>Rating (1-5)</Label>
                                              <Input name="rating" type="number" min="1" max="5" required />
                                            </div>
                                            <div>
                                              <Label>Review</Label>
                                              <Textarea name="review" />
                                            </div>
                                            <Button type="submit" className="w-full">Submit</Button>
                                          </div>
                                        </form>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentView === 'payments' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.service_requests?.service_type}</TableCell>
                            <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                            <TableCell>{tx.payment_method}</TableCell>
                            <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={tx.confirmed_at ? 'default' : 'secondary'}>
                                {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {currentView === 'profile' && (
                <ProfileForm onSuccess={fetchData} />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Provider Dashboard
  if (userRole === 'provider') {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
          <DashboardSidebar role="provider" currentView={currentView} />

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />

            {/* Desktop header */}
            <header className="sticky top-16 z-10 border-b bg-gradient-to-r from-primary/10 via-background to-accent/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm lg:block hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-6 lg:py-5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <SidebarTrigger className="-ml-2 hover:bg-primary/10 transition-colors" />
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                      Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 💼
                    </h1>
                    <p className="text-sm text-muted-foreground">Manage your service assignments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 glass-dark px-4 py-2 rounded-xl">
                  <Label className="text-sm font-semibold">Available</Label>
                  <Switch checked={isAvailable} onCheckedChange={handleToggleAvailability} />
                </div>
              </div>
            </header>

            {/* Mobile header */}
            <div className="lg:hidden sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary px-4 py-3 shadow-md">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-primary-foreground truncate">
                  Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 💼
                </h1>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-xs font-semibold text-primary-foreground">Available</span>
                  <Switch checked={isAvailable} onCheckedChange={handleToggleAvailability} className="scale-75" />
                </div>
              </div>
            </div>

            <main className="flex-1 p-3 lg:p-6 lg:pt-24 space-y-3 lg:space-y-6 overflow-auto bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-28 lg:pb-6">
              {/* Compact stats on mobile, full on desktop */}
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 lg:gap-6">
                <Card className="hover-lift bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 hover:border-green-200 animate-scale-in">
                  <CardHeader className="p-3 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-between pb-2 gap-2">
                    <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Earnings</CardTitle>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                      <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-4xl font-bold text-primary text-center lg:text-left">${earnings.toFixed(0)}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">From completed jobs</p>
                  </CardContent>
                </Card>
                <Card className="hover-lift bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 hover:border-yellow-200 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="p-3 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-between pb-2 gap-2">
                    <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Rating</CardTitle>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                      <Star className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-4xl font-bold text-primary text-center lg:text-left">{avgRating.toFixed(1)}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">Customer satisfaction</p>
                  </CardContent>
                </Card>
                <Card className="hover-lift bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 hover:border-blue-200 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="p-3 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-between pb-2 gap-2">
                    <CardTitle className="text-xs lg:text-lg order-2 lg:order-1 text-center lg:text-left">Jobs</CardTitle>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-1.5 lg:p-2 order-1 lg:order-2">
                      <ClipboardList className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-4xl font-bold text-primary text-center lg:text-left">{requests.length}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">All time</p>
                  </CardContent>
                </Card>
              </div>

              {currentView === 'assigned' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop table (hidden on mobile) */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Customer Phone</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests
                            .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
                            .map((request) => (
                              <TableRow key={request.id}>
                                <TableCell>{request.service_type}</TableCell>
                                <TableCell>{request.profiles?.full_name || 'Guest'}</TableCell>
                                <TableCell>{request.profiles?.phone_number || 'N/A'}</TableCell>
                                <TableCell>{request.location}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2 items-center flex-wrap">
                                    {request.status === 'assigned' && (
                                      <>
                                        <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'accepted')}>
                                          Accept
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleUpdateRequestStatus(request.id, 'cancelled')}>
                                          Deny
                                        </Button>
                                      </>
                                    )}
                                    {request.status === 'accepted' && (
                                      <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'en_route')}>
                                        Start Driving
                                      </Button>
                                    )}
                                    {request.status === 'en_route' && (
                                      <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}>
                                        Start Service
                                      </Button>
                                    )}
                                    {request.status === 'in_progress' && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm">Complete</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Complete Service</DialogTitle>
                                            <DialogDescription>
                                              Ask customer to send payment to business mobile money number
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <p className="text-sm">Business Mobile Money: <strong>+256-XXX-XXXXXX</strong></p>
                                            <p className="text-sm text-muted-foreground">
                                              Once you receive payment confirmation, the admin will complete the transaction.
                                            </p>
                                            <Button onClick={() => {
                                              toast.success('Customer notified to send payment');
                                              handleUpdateRequestStatus(request.id, 'completed');
                                            }}>
                                              Mark as Awaiting Payment
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}

                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">Details</Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Request Details</DialogTitle>
                                          <DialogDescription>Service Request #{request.id.slice(0, 8)}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-muted-foreground">Service Type</Label>
                                              <p className="font-medium capitalize">{request.service_type.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Status</Label>
                                              <div>
                                                <Badge className={getStatusColor(request.status)}>{request.status.replace('_', ' ')}</Badge>
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Customer</Label>
                                              <div className="flex flex-col">
                                                <span className="font-medium">{request.profiles?.full_name}</span>
                                                {request.profiles?.phone_number && (
                                                  <a href={`tel:${request.profiles.phone_number}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                                                    <Phone className="h-3 w-3" />
                                                    {request.profiles.phone_number}
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Location</Label>
                                              <p className="font-medium">{request.location}</p>
                                            </div>

                                            {/* Fuel Details - Only for fuel_delivery */}
                                            {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                                              <div className="col-span-1 md:col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                                <Label className="text-amber-800 mb-2 block flex items-center gap-2">
                                                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <Fuel className="h-3 w-3 text-amber-600" />
                                                  </div>
                                                  Fuel Details
                                                </Label>
                                                <div className="flex gap-4">
                                                  {request.fuel_type && (
                                                    <div>
                                                      <span className="text-xs text-amber-600/80 block">Type</span>
                                                      <span className="font-medium text-amber-900 capitalize">{request.fuel_type}</span>
                                                    </div>
                                                  )}
                                                  {request.fuel_amount && (
                                                    <div>
                                                      <span className="text-xs text-amber-600/80 block">Amount</span>
                                                      <span className="font-medium text-amber-900">{request.fuel_amount} Liters</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {(request.vehicle_make || request.vehicle_model || request.vehicle_image_url) && (
                                              <div className="col-span-1 md:col-span-2 bg-muted/30 p-3 rounded-lg mt-2">
                                                <Label className="text-muted-foreground mb-2 block flex items-center gap-2">
                                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <ClipboardList className="h-3 w-3 text-primary" />
                                                  </div>
                                                  Vehicle Details
                                                </Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                      <div>
                                                        <span className="text-xs text-muted-foreground block">Make/Model</span>
                                                        <span className="font-medium">{request.vehicle_make} {request.vehicle_model}</span>
                                                      </div>
                                                      {request.vehicle_year && (
                                                        <div>
                                                          <span className="text-xs text-muted-foreground block">Year</span>
                                                          <span className="font-medium">{request.vehicle_year}</span>
                                                        </div>
                                                      )}
                                                      {request.vehicle_plate && (
                                                        <div>
                                                          <span className="text-xs text-muted-foreground block">Plate Number</span>
                                                          <span className="font-medium">{request.vehicle_plate}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {request.vehicle_image_url && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block mb-1">Photo</span>
                                                      <img
                                                        src={request.vehicle_image_url}
                                                        alt="Vehicle"
                                                        className="w-full h-32 object-cover rounded-md border"
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {request.description && (
                                              <div className="col-span-1 md:col-span-2">
                                                <Label className="text-muted-foreground">Description</Label>
                                                <p className="text-sm bg-muted/30 p-3 rounded-md mt-1">{request.description}</p>
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex flex-wrap gap-2 justify-end border-t pt-4">
                                            {request.status === 'assigned' && (
                                              <>
                                                <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'accepted')}>
                                                  Accept
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleUpdateRequestStatus(request.id, 'cancelled')}>
                                                  Deny
                                                </Button>
                                              </>
                                            )}
                                            {request.status === 'accepted' && (
                                              <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'en_route')}>
                                                Start Driving (En Route)
                                              </Button>
                                            )}
                                            {request.status === 'en_route' && (
                                              <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}>
                                                Arrived - Start Service
                                              </Button>
                                            )}
                                            {request.status === 'in_progress' && (
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <Button size="sm">Complete</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                  <DialogHeader>
                                                    <DialogTitle>Complete Service</DialogTitle>
                                                    <DialogDescription>
                                                      Ask customer to send payment to business mobile money number
                                                    </DialogDescription>
                                                  </DialogHeader>
                                                  <div className="space-y-4">
                                                    <p className="text-sm">Business Mobile Money: <strong>+256-XXX-XXXXXX</strong></p>
                                                    <p className="text-sm text-muted-foreground">
                                                      Once you receive payment confirmation, the admin will complete the transaction.
                                                    </p>
                                                    <Button onClick={() => {
                                                      toast.success('Customer notified to send payment');
                                                      handleUpdateRequestStatus(request.id, 'completed');
                                                    }}>
                                                      Mark as Awaiting Payment
                                                    </Button>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                            )}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile cards (shown on mobile only) */}
                    <div className="md:hidden space-y-4 mt-4">
                      {requests
                        .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
                        .map((request) => (
                          <Card key={request.id} className={`border-2 border-l-4 ${getStatusBorderColor(request.status)} shadow-sm`}>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="font-semibold text-sm capitalize truncate">{request.service_type}</p>
                                  <p className="text-xs text-muted-foreground truncate">{request.location}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {request.profiles?.full_name}
                                    {request.profiles?.phone_number && (
                                      <span className="ml-1 text-[11px]">({request.profiles.phone_number})</span>
                                    )}
                                  </p>
                                </div>
                                <Badge className={`capitalize text-xs ${getStatusColor(request.status)}`}>
                                  {request.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t mt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="w-full sm:w-auto">View Details</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Request Details</DialogTitle>
                                      <DialogDescription>Service Request #{request.id.slice(0, 8)}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Service Type</Label>
                                          <p className="font-medium">{request.service_type}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Status</Label>
                                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Customer</Label>
                                          <p className="font-medium">{request.profiles?.full_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Phone</Label>
                                          <p className="font-medium">{request.profiles?.phone_number || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Location</Label>
                                          <p className="font-medium">{request.location}</p>
                                        </div>

                                        {/* Fuel Details - Only for fuel_delivery */}
                                        {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                                          <div className="col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                            <Label className="text-amber-800 mb-2 block flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                <Fuel className="h-3 w-3 text-amber-600" />
                                              </div>
                                              Fuel Details
                                            </Label>
                                            <div className="flex gap-4">
                                              {request.fuel_type && (
                                                <div>
                                                  <span className="text-xs text-amber-600/80 block">Type</span>
                                                  <span className="font-medium text-amber-900 capitalize">{request.fuel_type}</span>
                                                </div>
                                              )}
                                              {request.fuel_amount && (
                                                <div>
                                                  <span className="text-xs text-amber-600/80 block">Amount</span>
                                                  <span className="font-medium text-amber-900">{request.fuel_amount} Liters</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {(request.vehicle_make || request.vehicle_model || request.vehicle_image_url) && (
                                          <div className="col-span-2 bg-muted/30 p-3 rounded-lg mt-2">
                                            <Label className="text-muted-foreground mb-2 block flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <ClipboardList className="h-3 w-3 text-primary" />
                                              </div>
                                              Vehicle Details
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <span className="text-xs text-muted-foreground block">Make/Model</span>
                                                    <span className="font-medium">{request.vehicle_make} {request.vehicle_model}</span>
                                                  </div>
                                                  {request.vehicle_year && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block">Year</span>
                                                      <span className="font-medium">{request.vehicle_year}</span>
                                                    </div>
                                                  )}
                                                  {request.vehicle_plate && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block">Plate Number</span>
                                                      <span className="font-medium">{request.vehicle_plate}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              {request.vehicle_image_url && (
                                                <div>
                                                  <span className="text-xs text-muted-foreground block mb-1">Photo</span>
                                                  <img
                                                    src={request.vehicle_image_url}
                                                    alt="Vehicle"
                                                    className="w-full h-32 object-cover rounded-md border"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {request.description && (
                                          <div className="col-span-2">
                                            <Label className="text-muted-foreground">Description</Label>
                                            <p className="font-medium">{request.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {request.status === 'assigned' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="w-full sm:w-auto"
                                      onClick={() => handleUpdateRequestStatus(request.id, 'accepted')}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="w-full sm:w-auto"
                                      onClick={() => handleUpdateRequestStatus(request.id, 'cancelled')}
                                    >
                                      Deny
                                    </Button>
                                  </>
                                )}

                                {request.status === 'accepted' && (
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleUpdateRequestStatus(request.id, 'en_route')}
                                  >
                                    Start Driving (En Route)
                                  </Button>
                                )}

                                {request.status === 'en_route' && (
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}
                                  >
                                    Arrived - Start Service
                                  </Button>
                                )}

                                {request.status === 'in_progress' && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" className="w-full sm:w-auto">Complete</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Complete Service</DialogTitle>
                                        <DialogDescription>
                                          Ask customer to send payment to business mobile money number
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-sm">Business Mobile Money: <strong></strong></p>
                                        <p className="text-sm text-muted-foreground">
                                          Once you receive payment confirmation, the admin will complete the transaction.
                                        </p>
                                        <Button
                                          onClick={() => {
                                            toast.success('Customer notified to send payment');
                                            handleUpdateRequestStatus(request.id, 'completed');
                                          }}
                                        >
                                          Mark as Awaiting Payment
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentView === 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.filter(r => r.status === 'completed').map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.service_type}</TableCell>
                            <TableCell>{request.profiles?.full_name}</TableCell>
                            <TableCell>{request.location}</TableCell>
                            <TableCell>
                              {request.transactions && request.transactions.length > 0 && request.transactions[0].provider_amount
                                ? `GHS ${Number(request.transactions[0].provider_amount).toFixed(2)}`
                                : request.status === 'completed' ? 'Pending Payment' : '-'}
                            </TableCell>
                            <TableCell>{new Date(request.completed_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {currentView === 'profile' && (
                <ProfileForm onSuccess={fetchData} />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Admin Dashboard
  if (userRole === 'admin' || userRole === 'super_admin') {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
          <DashboardSidebar role="admin" currentView={currentView} />

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />

            {/* Desktop header */}
            <header className="sticky top-16 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block hidden">
              <div className="flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
                <SidebarTrigger className="-ml-2" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">Admin Dashboard</h1>
                </div>
              </div>
            </header>

            {/* Mobile header */}
            <div className="lg:hidden sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary px-4 py-3 shadow-md">
              <h1 className="text-lg font-bold text-primary-foreground truncate">
                Admin Dashboard 🛡️
              </h1>
            </div>

            <main className="flex-1 p-3 lg:p-6 lg:pt-24 space-y-3 lg:space-y-6 overflow-auto pb-28 lg:pb-6">
              {/* Compact stats on mobile, full on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                <Card>
                  <CardHeader className="p-3 lg:p-6">
                    <CardTitle className="text-xs lg:text-base">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-3xl font-bold">${allTransactions.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-3 lg:p-6">
                    <CardTitle className="text-xs lg:text-base">Pending</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-3xl font-bold">{allRequests.filter(r => r.status === 'pending').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-3 lg:p-6">
                    <CardTitle className="text-xs lg:text-base">Providers</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-3xl font-bold">{providers.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-3 lg:p-6">
                    <CardTitle className="text-xs lg:text-base">Customers</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <p className="text-xl lg:text-3xl font-bold">{customers.length}</p>
                  </CardContent>
                </Card>
              </div>

              {currentView === 'requests' && (
                <Card>
                  <CardHeader>
                    <CardTitle>All Service Requests</CardTitle>
                    <CardDescription>Manage all service requests across the platform</CardDescription>
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        placeholder="Search by service, customer, location, provider, or status..."
                        value={adminRequestFilter}
                        onChange={(e) => setAdminRequestFilter(e.target.value)}
                        className="max-w-2xl"
                      />
                      {adminRequestFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdminRequestFilter('')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allRequests.filter(request => {
                            const searchLower = adminRequestFilter.toLowerCase();
                            const provider = providers.find(p => p.id === request.provider_id);
                            return (
                              request.service_type?.toLowerCase().includes(searchLower) ||
                              request.location?.toLowerCase().includes(searchLower) ||
                              request.status?.toLowerCase().includes(searchLower) ||
                              request.tracking_code?.toLowerCase().includes(searchLower) ||
                              request.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                              provider?.full_name?.toLowerCase().includes(searchLower) ||
                              request.vehicle_make?.toLowerCase().includes(searchLower) ||
                              request.vehicle_model?.toLowerCase().includes(searchLower)
                            );
                          }).map((request) => {
                            const provider = providers.find(p => p.id === request.provider_id);

                            return (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.service_type}</TableCell>
                                <TableCell>{request.profiles?.full_name || 'Unknown'}</TableCell>
                                <TableCell className="max-w-xs truncate">{request.location}</TableCell>
                                <TableCell>
                                  {provider ? (
                                    <div>
                                      <p className="font-medium">{provider.full_name}</p>
                                      <p className="text-xs text-muted-foreground">{provider.phone_number}</p>
                                    </div>
                                  ) : (
                                    <Badge variant="secondary">Unassigned</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {request.transactions && request.transactions.length > 0 && request.transactions[0].amount
                                    ? `GHS ${Number(request.transactions[0].amount).toFixed(2)}`
                                    : request.status === 'completed' ? 'Pending Payment' : '-'}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm">{new Date(request.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">Details</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Request Details</DialogTitle>
                                          <DialogDescription>Service Request #{request.id.slice(0, 8)}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-muted-foreground">Service Type</Label>
                                              <p className="font-medium">{request.service_type}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Status</Label>
                                              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Customer</Label>
                                              <p className="font-medium">{request.profiles?.full_name}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Provider</Label>
                                              <p className="font-medium">{provider?.full_name || 'Not assigned'}</p>
                                            </div>
                                            <div className="col-span-2">
                                              <Label className="text-muted-foreground">Location</Label>
                                              <p className="font-medium">{request.location}</p>
                                            </div>

                                            {/* Fuel Details - Only for fuel_delivery */}
                                            {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                                              <div className="col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                                <Label className="text-amber-800 mb-2 block flex items-center gap-2">
                                                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <Fuel className="h-3 w-3 text-amber-600" />
                                                  </div>
                                                  Fuel Details
                                                </Label>
                                                <div className="flex gap-4">
                                                  {request.fuel_type && (
                                                    <div>
                                                      <span className="text-xs text-amber-600/80 block">Type</span>
                                                      <span className="font-medium text-amber-900 capitalize">{request.fuel_type}</span>
                                                    </div>
                                                  )}
                                                  {request.fuel_amount && (
                                                    <div>
                                                      <span className="text-xs text-amber-600/80 block">Amount</span>
                                                      <span className="font-medium text-amber-900">{request.fuel_amount} Liters</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {(request.vehicle_make || request.vehicle_model || request.vehicle_image_url) && (
                                              <div className="col-span-2 bg-muted/30 p-3 rounded-lg mt-2">
                                                <Label className="text-muted-foreground mb-2 block flex items-center gap-2">
                                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <ClipboardList className="h-3 w-3 text-primary" />
                                                  </div>
                                                  Vehicle Details
                                                </Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                      <div>
                                                        <span className="text-xs text-muted-foreground block">Make/Model</span>
                                                        <span className="font-medium">{request.vehicle_make} {request.vehicle_model}</span>
                                                      </div>
                                                      {request.vehicle_year && (
                                                        <div>
                                                          <span className="text-xs text-muted-foreground block">Year</span>
                                                          <span className="font-medium">{request.vehicle_year}</span>
                                                        </div>
                                                      )}
                                                      {request.vehicle_plate && (
                                                        <div>
                                                          <span className="text-xs text-muted-foreground block">Plate Number</span>
                                                          <span className="font-medium">{request.vehicle_plate}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {request.vehicle_image_url && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block mb-1">Photo</span>
                                                      <img
                                                        src={request.vehicle_image_url}
                                                        alt="Vehicle"
                                                        className="w-full h-32 object-cover rounded-md border"
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                            {request.description && (
                                              <div className="col-span-2">
                                                <Label className="text-muted-foreground">Description</Label>
                                                <p className="font-medium">{request.description}</p>
                                              </div>
                                            )}
                                            <div>
                                              <Label className="text-muted-foreground">Created</Label>
                                              <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
                                            </div>
                                            {request.completed_at && (
                                              <div>
                                                <Label className="text-muted-foreground">Completed</Label>
                                                <p className="text-sm">{new Date(request.completed_at).toLocaleString()}</p>
                                              </div>
                                            )}
                                            {request.status === 'completed' && (() => {
                                              const transaction = allTransactions.find(t => t.service_request_id === request.id);
                                              return transaction ? (
                                                <div className="col-span-2">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-muted-foreground">Payment Details</Label>
                                                    <Dialog>
                                                      <DialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                          <Edit className="h-4 w-4 mr-2" />
                                                          Edit Payment
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent>
                                                        <DialogHeader>
                                                          <DialogTitle>Edit Payment</DialogTitle>
                                                          <DialogDescription>Update payment amount and provider percentage</DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={(e) => {
                                                          e.preventDefault();
                                                          const formData = new FormData(e.currentTarget);
                                                          const amount = Number(formData.get('amount'));
                                                          const percentage = Number(formData.get('provider_percentage'));
                                                          handleUpdateTransaction(transaction.id, amount, percentage);
                                                        }}>
                                                          <div className="space-y-4">
                                                            <div>
                                                              <Label>Amount (GHS)</Label>
                                                              <Input
                                                                name="amount"
                                                                type="number"
                                                                step="0.01"
                                                                required
                                                                defaultValue={transaction.amount}
                                                                min="0.01"
                                                                max="1000000"
                                                              />
                                                            </div>
                                                            <div>
                                                              <Label>Provider Percentage (%)</Label>
                                                              <Input
                                                                name="provider_percentage"
                                                                type="number"
                                                                step="1"
                                                                min="0"
                                                                max="100"
                                                                required
                                                                defaultValue={transaction.provider_percentage}
                                                              />
                                                            </div>
                                                            <div className="bg-muted p-3 rounded-md">
                                                              <p className="text-sm font-medium mb-1">Current Breakdown:</p>
                                                              <p className="text-sm">Provider: GHS {Number(transaction.provider_amount || 0).toFixed(2)}</p>
                                                              <p className="text-sm">Platform: GHS {Number(transaction.platform_amount || 0).toFixed(2)}</p>
                                                            </div>
                                                            <Button type="submit" className="w-full">Update Payment</Button>
                                                          </div>
                                                        </form>
                                                      </DialogContent>
                                                    </Dialog>
                                                  </div>
                                                  <div className="space-y-1">
                                                    <p className="font-medium text-lg">GHS {Number(transaction.amount).toFixed(2)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                      Provider gets {transaction.provider_percentage}% (GHS {Number(transaction.provider_amount || 0).toFixed(2)})
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                      Platform gets GHS {Number(transaction.platform_amount || 0).toFixed(2)}
                                                    </p>
                                                  </div>
                                                </div>
                                              ) : null;
                                            })()}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm">{request.provider_id ? 'Reassign' : 'Assign'}</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>{request.provider_id ? 'Reassign Provider' : 'Assign Provider'}</DialogTitle>
                                          <DialogDescription>Select an available provider for this service request</DialogDescription>
                                        </DialogHeader>
                                        {providers.filter(p => p.is_available !== false).length === 0 ? (
                                          <div className="text-center py-6">
                                            <p className="text-muted-foreground">No available providers at the moment</p>
                                          </div>
                                        ) : (
                                          <Select onValueChange={(value) => handleAssignProvider(request.id, value)}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {providers.filter(p => p.is_available !== false).map((provider) => (
                                                <SelectItem key={provider.id} value={provider.id}>
                                                  {provider.full_name} - {provider.phone_number}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          Change Status
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Change Request Status</DialogTitle>
                                          <DialogDescription>Update the status of this service request</DialogDescription>
                                        </DialogHeader>
                                        <Select onValueChange={(value) => handleUpdateRequestStatus(request.id, value)}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select new status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="assigned">Assigned</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </DialogContent>
                                    </Dialog>

                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteRequest(request.id)}
                                    >
                                      Delete
                                    </Button>

                                    {request.status === 'completed' && !allTransactions.find(t => t.service_request_id === request.id) && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="outline">Payment</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Record Payment</DialogTitle>
                                            <DialogDescription>Record mobile money payment for this service</DialogDescription>
                                          </DialogHeader>
                                          <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            handleCompletePayment(
                                              request.id,
                                              Number(formData.get('amount')),
                                              Number(formData.get('provider_percentage'))
                                            );
                                          }}>
                                            <div className="space-y-4">
                                              <div>
                                                <Label>Amount Received (GHS)</Label>
                                                <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                                              </div>
                                              <div>
                                                <Label>Provider Percentage (%)</Label>
                                                <Input
                                                  name="provider_percentage"
                                                  type="number"
                                                  step="1"
                                                  min="0"
                                                  max="100"
                                                  required
                                                  defaultValue="70"
                                                  placeholder="70"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  Percentage of payment that goes to the provider
                                                </p>
                                              </div>
                                              <Button type="submit" className="w-full">Confirm Payment</Button>
                                            </div>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {allRequests.filter(request => {
                        const searchLower = adminRequestFilter.toLowerCase();
                        const provider = providers.find(p => p.id === request.provider_id);
                        return (
                          request.service_type?.toLowerCase().includes(searchLower) ||
                          request.location?.toLowerCase().includes(searchLower) ||
                          request.status?.toLowerCase().includes(searchLower) ||
                          request.tracking_code?.toLowerCase().includes(searchLower) ||
                          request.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                          provider?.full_name?.toLowerCase().includes(searchLower) ||
                          request.vehicle_make?.toLowerCase().includes(searchLower) ||
                          request.vehicle_model?.toLowerCase().includes(searchLower)
                        );
                      }).map((request) => {
                        const provider = providers.find(p => p.id === request.provider_id);

                        return (
                          <Card key={request.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg capitalize">{request.service_type.replace('_', ' ')}</h3>
                                  <p className="text-sm text-muted-foreground">{request.location}</p>
                                </div>
                                <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Customer:</span>
                                  <span>{request.profiles?.full_name || 'Unknown'}</span>
                                </div>

                                {provider ? (
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Provider:</span>
                                    <span>{provider.full_name}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <UserX className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="secondary">Unassigned</Badge>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Amount:</span>
                                  <span>
                                    {request.transactions && request.transactions.length > 0 && request.transactions[0].amount
                                      ? `GHS ${Number(request.transactions[0].amount).toFixed(2)}`
                                      : request.status === 'completed' ? 'Pending Payment' : '-'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                  <span className="text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="flex-1">Details</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Request Details</DialogTitle>
                                      <DialogDescription>Service Request #{request.id.slice(0, 8)}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Service Type</Label>
                                          <p className="font-medium">{request.service_type}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Status</Label>
                                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Customer</Label>
                                          <p className="font-medium">{request.profiles?.full_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Provider</Label>
                                          <p className="font-medium">{provider?.full_name || 'Not assigned'}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Location</Label>
                                          <p className="font-medium">{request.location}</p>
                                        </div>

                                        {/* Fuel Details - Only for fuel_delivery */}
                                        {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                                          <div className="col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                            <Label className="text-amber-800 mb-2 block flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                <Fuel className="h-3 w-3 text-amber-600" />
                                              </div>
                                              Fuel Details
                                            </Label>
                                            <div className="flex gap-4">
                                              {request.fuel_type && (
                                                <div>
                                                  <span className="text-xs text-amber-600/80 block">Type</span>
                                                  <span className="font-medium text-amber-900 capitalize">{request.fuel_type}</span>
                                                </div>
                                              )}
                                              {request.fuel_amount && (
                                                <div>
                                                  <span className="text-xs text-amber-600/80 block">Amount</span>
                                                  <span className="font-medium text-amber-900">{request.fuel_amount} Liters</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {(request.vehicle_make || request.vehicle_model || request.vehicle_image_url) && (
                                          <div className="col-span-2 bg-muted/30 p-3 rounded-lg mt-2">
                                            <Label className="text-muted-foreground mb-2 block flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <ClipboardList className="h-3 w-3 text-primary" />
                                              </div>
                                              Vehicle Details
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <span className="text-xs text-muted-foreground block">Make/Model</span>
                                                    <span className="font-medium">{request.vehicle_make} {request.vehicle_model}</span>
                                                  </div>
                                                  {request.vehicle_year && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block">Year</span>
                                                      <span className="font-medium">{request.vehicle_year}</span>
                                                    </div>
                                                  )}
                                                  {request.vehicle_plate && (
                                                    <div>
                                                      <span className="text-xs text-muted-foreground block">Plate Number</span>
                                                      <span className="font-medium">{request.vehicle_plate}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              {request.vehicle_image_url && (
                                                <div>
                                                  <span className="text-xs text-muted-foreground block mb-1">Photo</span>
                                                  <img
                                                    src={request.vehicle_image_url}
                                                    alt="Vehicle"
                                                    className="w-full h-32 object-cover rounded-md border"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {request.description && (
                                          <div className="col-span-2">
                                            <Label className="text-muted-foreground">Description</Label>
                                            <p className="font-medium">{request.description}</p>
                                          </div>
                                        )}
                                        <div>
                                          <Label className="text-muted-foreground">Created</Label>
                                          <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
                                        </div>
                                        {request.completed_at && (
                                          <div>
                                            <Label className="text-muted-foreground">Completed</Label>
                                            <p className="text-sm">{new Date(request.completed_at).toLocaleString()}</p>
                                          </div>
                                        )}
                                        {request.status === 'completed' && (() => {
                                          const transaction = allTransactions.find(t => t.service_request_id === request.id);
                                          return transaction ? (
                                            <div className="col-span-2">
                                              <div className="flex items-center justify-between mb-2">
                                                <Label className="text-muted-foreground">Payment Details</Label>
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                    <Button size="sm" variant="ghost">
                                                      <Edit className="h-4 w-4 mr-2" />
                                                      Edit Payment
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent>
                                                    <DialogHeader>
                                                      <DialogTitle>Edit Payment</DialogTitle>
                                                      <DialogDescription>Update payment amount and provider percentage</DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={(e) => {
                                                      e.preventDefault();
                                                      const formData = new FormData(e.currentTarget);
                                                      const amount = Number(formData.get('amount'));
                                                      const percentage = Number(formData.get('provider_percentage'));
                                                      handleUpdateTransaction(transaction.id, amount, percentage);
                                                    }}>
                                                      <div className="space-y-4">
                                                        <div>
                                                          <Label>Amount (GHS)</Label>
                                                          <Input
                                                            name="amount"
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            defaultValue={transaction.amount}
                                                            min="0.01"
                                                            max="1000000"
                                                          />
                                                        </div>
                                                        <div>
                                                          <Label>Provider Percentage (%)</Label>
                                                          <Input
                                                            name="provider_percentage"
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            max="100"
                                                            required
                                                            defaultValue={transaction.provider_percentage}
                                                          />
                                                        </div>
                                                        <div className="bg-muted p-3 rounded-md">
                                                          <p className="text-sm font-medium mb-1">Current Breakdown:</p>
                                                          <p className="text-sm">Provider: GHS {Number(transaction.provider_amount || 0).toFixed(2)}</p>
                                                          <p className="text-sm">Platform: GHS {Number(transaction.platform_amount || 0).toFixed(2)}</p>
                                                        </div>
                                                        <Button type="submit" className="w-full">Update Payment</Button>
                                                      </div>
                                                    </form>
                                                  </DialogContent>
                                                </Dialog>
                                              </div>
                                              <div className="space-y-1">
                                                <p className="font-medium text-lg">GHS {Number(transaction.amount).toFixed(2)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  Provider gets {transaction.provider_percentage}% (GHS {Number(transaction.provider_amount || 0).toFixed(2)})
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                  Platform gets GHS {Number(transaction.platform_amount || 0).toFixed(2)}
                                                </p>
                                              </div>
                                            </div>
                                          ) : null;
                                        })()}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="flex-1">{request.provider_id ? 'Reassign' : 'Assign'}</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{request.provider_id ? 'Reassign Provider' : 'Assign Provider'}</DialogTitle>
                                      <DialogDescription>Select an available provider for this service request</DialogDescription>
                                    </DialogHeader>
                                    {providers.filter(p => p.is_available !== false).length === 0 ? (
                                      <div className="text-center py-6">
                                        <p className="text-muted-foreground">No available providers at the moment</p>
                                      </div>
                                    ) : (
                                      <Select onValueChange={(value) => handleAssignProvider(request.id, value)}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {providers.filter(p => p.is_available !== false).map((provider) => (
                                            <SelectItem key={provider.id} value={provider.id}>
                                              {provider.full_name} - {provider.phone_number}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Change Status
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Change Request Status</DialogTitle>
                                      <DialogDescription>Update the status of this service request</DialogDescription>
                                    </DialogHeader>
                                    <Select onValueChange={(value) => handleUpdateRequestStatus(request.id, value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
                                >
                                  Delete
                                </Button>

                                {request.status === 'completed' && !allTransactions.find(t => t.service_request_id === request.id) && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">Payment</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Record Payment</DialogTitle>
                                        <DialogDescription>Record mobile money payment for this service</DialogDescription>
                                      </DialogHeader>
                                      <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleCompletePayment(
                                          request.id,
                                          Number(formData.get('amount')),
                                          Number(formData.get('provider_percentage'))
                                        );
                                      }}>
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Amount Received (GHS)</Label>
                                            <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                                          </div>
                                          <div>
                                            <Label>Provider Percentage (%)</Label>
                                            <Input
                                              name="provider_percentage"
                                              type="number"
                                              step="1"
                                              min="0"
                                              max="100"
                                              required
                                              defaultValue="70"
                                              placeholder="70"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Percentage of payment that goes to the provider
                                            </p>
                                          </div>
                                          <Button type="submit" className="w-full">Confirm Payment</Button>
                                        </div>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {allRequests.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No service requests yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentView === 'providers' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Management</CardTitle>
                    <CardDescription>Manage service providers and their details</CardDescription>
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        placeholder="Search by name, email, phone, or location..."
                        value={adminProviderFilter}
                        onChange={(e) => setAdminProviderFilter(e.target.value)}
                        className="max-w-md"
                      />
                      {adminProviderFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdminProviderFilter('')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Jobs Completed</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {providers.filter(provider => {
                            const searchLower = adminProviderFilter.toLowerCase();
                            return (
                              provider.full_name?.toLowerCase().includes(searchLower) ||
                              provider.email?.toLowerCase().includes(searchLower) ||
                              provider.phone_number?.toLowerCase().includes(searchLower) ||
                              provider.location?.toLowerCase().includes(searchLower)
                            );
                          }).map((provider) => {
                            const completedJobs = allRequests.filter(r => r.provider_id === provider.id && r.status === 'completed').length;
                            const activeJobs = allRequests.filter(r => r.provider_id === provider.id && ['assigned', 'in_progress'].includes(r.status)).length;

                            return (
                              <TableRow key={provider.id}>
                                <TableCell className="font-medium">{provider.full_name}</TableCell>
                                <TableCell>{provider.email || 'N/A'}</TableCell>
                                <TableCell>{provider.phone_number || 'N/A'}</TableCell>
                                <TableCell>{provider.location || 'N/A'}</TableCell>
                                <TableCell>{completedJobs}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={provider.is_available === false ? 'secondary' : 'default'}>
                                      {provider.is_available === false ? 'Unavailable' : 'Available'}
                                    </Badge>
                                    {activeJobs > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {activeJobs} Active Job{activeJobs > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">View Details</Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Provider Details</DialogTitle>
                                          <DialogDescription>View and manage provider information</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-muted-foreground">Full Name</Label>
                                              <p className="font-medium">{provider.full_name}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Email</Label>
                                              <p className="font-medium">{provider.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Phone Number</Label>
                                              <p className="font-medium">{provider.phone_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Location</Label>
                                              <p className="font-medium">{provider.location || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Bio</Label>
                                              <p className="font-medium">{provider.bio || 'N/A'}</p>
                                            </div>
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Statistics</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">{completedJobs}</p>
                                                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                                                </CardContent>
                                              </Card>
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">{activeJobs}</p>
                                                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                                                </CardContent>
                                              </Card>
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">
                                                    ${allTransactions
                                                      .filter(t => allRequests.find(r => r.id === t.service_request_id && r.provider_id === provider.id))
                                                      .reduce((sum, t) => sum + Number(t.provider_amount || 0), 0)
                                                      .toFixed(2)}
                                                  </p>
                                                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                                                </CardContent>
                                              </Card>
                                            </div>
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Ratings & Reviews</h4>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <div className="flex items-center gap-2">
                                                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                                    <p className="text-2xl font-bold">
                                                      {provider.avgRating ? provider.avgRating.toFixed(1) : 'N/A'}
                                                    </p>
                                                  </div>
                                                  <p className="text-sm text-muted-foreground">Average Rating</p>
                                                </CardContent>
                                              </Card>
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">{provider.ratingCount || 0}</p>
                                                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                                                </CardContent>
                                              </Card>
                                            </div>
                                            {provider.ratings && provider.ratings.length > 0 ? (
                                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {provider.ratings.slice(0, 5).map((rating: any) => (
                                                  <div key={rating.id} className="p-3 border rounded">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                          <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < rating.rating
                                                              ? 'fill-yellow-400 text-yellow-400'
                                                              : 'text-gray-300'
                                                              }`}
                                                          />
                                                        ))}
                                                      </div>
                                                      <span className="text-sm text-muted-foreground">
                                                        {new Date(rating.created_at).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                    {rating.review && (
                                                      <p className="text-sm text-muted-foreground">{rating.review}</p>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
                                            )}
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Recent Jobs</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                              {allRequests
                                                .filter(r => r.provider_id === provider.id)
                                                .slice(0, 5)
                                                .map((job) => (
                                                  <div key={job.id} className="flex justify-between items-center p-2 border rounded">
                                                    <div>
                                                      <p className="font-medium">{job.service_type}</p>
                                                      <p className="text-sm text-muted-foreground">{job.location}</p>
                                                    </div>
                                                    <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                                                  </div>
                                                ))}
                                              {allRequests.filter(r => r.provider_id === provider.id).length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">No jobs assigned yet</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteProfile(provider.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {providers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No providers registered yet
                        </div>
                      )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {providers.filter(provider => {
                        const searchLower = adminProviderFilter.toLowerCase();
                        return (
                          provider.full_name?.toLowerCase().includes(searchLower) ||
                          provider.email?.toLowerCase().includes(searchLower) ||
                          provider.phone_number?.toLowerCase().includes(searchLower) ||
                          provider.location?.toLowerCase().includes(searchLower)
                        );
                      }).map((provider) => {
                        const completedJobs = allRequests.filter(r => r.provider_id === provider.id && r.status === 'completed').length;
                        const activeJobs = allRequests.filter(r => r.provider_id === provider.id && ['assigned', 'in_progress'].includes(r.status)).length;

                        return (
                          <Card key={provider.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{provider.full_name}</h3>
                                  <p className="text-sm text-muted-foreground">{provider.email || 'N/A'}</p>
                                </div>
                                <Badge variant={provider.is_available === false ? 'secondary' : 'default'}>
                                  {provider.is_available === false ? 'Unavailable' : 'Available'}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{provider.phone_number || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{provider.location || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Completed Jobs:</span>
                                  <span>{completedJobs}</span>
                                </div>

                                {activeJobs > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Active Jobs:</span>
                                    <span>{activeJobs}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Total Earnings:</span>
                                  <span>
                                    ${allTransactions
                                      .filter(t => allRequests.find(r => r.id === t.service_request_id && r.provider_id === provider.id))
                                      .reduce((sum, t) => sum + Number(t.provider_amount || 0), 0)
                                      .toFixed(2)}
                                  </span>
                                </div>

                                {provider.avgRating && (
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">Rating:</span>
                                    <span>{provider.avgRating.toFixed(1)} ({provider.ratingCount || 0} reviews)</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="flex-1">View Details</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Provider Details</DialogTitle>
                                      <DialogDescription>View and manage provider information</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Full Name</Label>
                                          <p className="font-medium">{provider.full_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Email</Label>
                                          <p className="font-medium">{provider.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Phone Number</Label>
                                          <p className="font-medium">{provider.phone_number || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Location</Label>
                                          <p className="font-medium">{provider.location || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Bio</Label>
                                          <p className="font-medium">{provider.bio || 'N/A'}</p>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Statistics</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">{completedJobs}</p>
                                              <p className="text-sm text-muted-foreground">Completed Jobs</p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">{activeJobs}</p>
                                              <p className="text-sm text-muted-foreground">Active Jobs</p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">
                                                ${allTransactions
                                                  .filter(t => allRequests.find(r => r.id === t.service_request_id && r.provider_id === provider.id))
                                                  .reduce((sum, t) => sum + Number(t.provider_amount || 0), 0)
                                                  .toFixed(2)}
                                              </p>
                                              <p className="text-sm text-muted-foreground">Total Earnings</p>
                                            </CardContent>
                                          </Card>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Ratings & Reviews</h4>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                          <Card>
                                            <CardContent className="pt-6">
                                              <div className="flex items-center gap-2">
                                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                                <p className="text-2xl font-bold">
                                                  {provider.avgRating ? provider.avgRating.toFixed(1) : 'N/A'}
                                                </p>
                                              </div>
                                              <p className="text-sm text-muted-foreground">Average Rating</p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">{provider.ratingCount || 0}</p>
                                              <p className="text-sm text-muted-foreground">Total Reviews</p>
                                            </CardContent>
                                          </Card>
                                        </div>
                                        {provider.ratings && provider.ratings.length > 0 ? (
                                          <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {provider.ratings.slice(0, 5).map((rating: any) => (
                                              <div key={rating.id} className="p-3 border rounded">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < rating.rating
                                                          ? 'fill-yellow-400 text-yellow-400'
                                                          : 'text-gray-300'
                                                          }`}
                                                      />
                                                    ))}
                                                  </div>
                                                  <span className="text-sm text-muted-foreground">
                                                    {new Date(rating.created_at).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                {rating.review && (
                                                  <p className="text-sm text-muted-foreground">{rating.review}</p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
                                        )}
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Recent Jobs</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {allRequests
                                            .filter(r => r.provider_id === provider.id)
                                            .slice(0, 5)
                                            .map((job) => (
                                              <div key={job.id} className="flex justify-between items-center p-2 border rounded">
                                                <div>
                                                  <p className="font-medium">{job.service_type}</p>
                                                  <p className="text-sm text-muted-foreground">{job.location}</p>
                                                </div>
                                                <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                                              </div>
                                            ))}
                                          {allRequests.filter(r => r.provider_id === provider.id).length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No jobs assigned yet</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProfile(provider.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {providers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No providers registered yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentView === 'customers' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Management</CardTitle>
                    <CardDescription>Manage customers and their service history</CardDescription>
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        placeholder="Search by name, email, phone, or location..."
                        value={adminCustomerFilter}
                        onChange={(e) => setAdminCustomerFilter(e.target.value)}
                        className="max-w-md"
                      />
                      {adminCustomerFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdminCustomerFilter('')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Total Requests</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.filter(customer => {
                            const searchLower = adminCustomerFilter.toLowerCase();
                            return (
                              customer.full_name?.toLowerCase().includes(searchLower) ||
                              customer.email?.toLowerCase().includes(searchLower) ||
                              customer.phone_number?.toLowerCase().includes(searchLower) ||
                              customer.location?.toLowerCase().includes(searchLower)
                            );
                          }).map((customer) => {
                            const totalRequests = allRequests.filter(r => r.customer_id === customer.id).length;
                            const activeRequests = allRequests.filter(r => r.customer_id === customer.id && ['pending', 'assigned', 'in_progress'].includes(r.status)).length;
                            const completedRequests = allRequests.filter(r => r.customer_id === customer.id && r.status === 'completed').length;

                            return (
                              <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.full_name}</TableCell>
                                <TableCell>{customer.email || 'N/A'}</TableCell>
                                <TableCell>{customer.phone_number || 'N/A'}</TableCell>
                                <TableCell>{customer.location || 'N/A'}</TableCell>
                                <TableCell>{totalRequests}</TableCell>
                                <TableCell>
                                  <Badge variant={activeRequests > 0 ? 'default' : 'secondary'}>
                                    {activeRequests > 0 ? `${activeRequests} Active` : 'No Active Requests'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">View Details</Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Customer Details</DialogTitle>
                                          <DialogDescription>View customer information and service history</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-muted-foreground">Full Name</Label>
                                              <p className="font-medium">{customer.full_name}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Email</Label>
                                              <p className="font-medium">{customer.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Phone Number</Label>
                                              <p className="font-medium">{customer.phone_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Location</Label>
                                              <p className="font-medium">{customer.location || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-muted-foreground">Bio</Label>
                                              <p className="font-medium">{customer.bio || 'N/A'}</p>
                                            </div>
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Statistics</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">{totalRequests}</p>
                                                  <p className="text-sm text-muted-foreground">Total Requests</p>
                                                </CardContent>
                                              </Card>
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">{completedRequests}</p>
                                                  <p className="text-sm text-muted-foreground">Completed</p>
                                                </CardContent>
                                              </Card>
                                              <Card>
                                                <CardContent className="pt-6">
                                                  <p className="text-2xl font-bold">
                                                    ${allTransactions
                                                      .filter(t => allRequests.find(r => r.id === t.service_request_id && r.customer_id === customer.id))
                                                      .reduce((sum, t) => sum + Number(t.amount), 0)
                                                      .toFixed(2)}
                                                  </p>
                                                  <p className="text-sm text-muted-foreground">Total Spent</p>
                                                </CardContent>
                                              </Card>
                                            </div>
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Service History</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                              {allRequests
                                                .filter(r => r.customer_id === customer.id)
                                                .slice(0, 5)
                                                .map((request) => (
                                                  <div key={request.id} className="flex justify-between items-center p-2 border rounded">
                                                    <div>
                                                      <p className="font-medium">{request.service_type}</p>
                                                      <p className="text-sm text-muted-foreground">{request.location}</p>
                                                      <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                                  </div>
                                                ))}
                                              {allRequests.filter(r => r.customer_id === customer.id).length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">No service requests yet</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteProfile(customer.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {customers.filter(customer => {
                        const searchLower = adminCustomerFilter.toLowerCase();
                        return (
                          customer.full_name?.toLowerCase().includes(searchLower) ||
                          customer.email?.toLowerCase().includes(searchLower) ||
                          customer.phone_number?.toLowerCase().includes(searchLower) ||
                          customer.location?.toLowerCase().includes(searchLower)
                        );
                      }).map((customer) => {
                        const totalRequests = allRequests.filter(r => r.customer_id === customer.id).length;
                        const activeRequests = allRequests.filter(r => r.customer_id === customer.id && ['pending', 'assigned', 'in_progress'].includes(r.status)).length;
                        const completedRequests = allRequests.filter(r => r.customer_id === customer.id && r.status === 'completed').length;

                        return (
                          <Card key={customer.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4 space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{customer.full_name}</p>
                                  </div>
                                </div>

                                {customer.email && (
                                  <div className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                                  </div>
                                )}

                                {customer.phone_number && (
                                  <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground truncate">{customer.phone_number}</p>
                                  </div>
                                )}

                                {customer.location && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground truncate">{customer.location}</p>
                                  </div>
                                )}

                                <div className="flex items-start gap-2">
                                  <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground">
                                    {totalRequests} total requests • {completedRequests} completed
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2 border-t">
                                <Badge variant={activeRequests > 0 ? 'default' : 'secondary'} className="text-xs">
                                  {activeRequests > 0 ? `${activeRequests} Active` : 'No Active Requests'}
                                </Badge>
                              </div>

                              <div className="flex gap-2 pt-2 border-t">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="flex-1">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Customer Details</DialogTitle>
                                      <DialogDescription>View customer information and service history</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Full Name</Label>
                                          <p className="font-medium">{customer.full_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Email</Label>
                                          <p className="font-medium">{customer.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Phone Number</Label>
                                          <p className="font-medium">{customer.phone_number || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Location</Label>
                                          <p className="font-medium">{customer.location || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Bio</Label>
                                          <p className="font-medium">{customer.bio || 'N/A'}</p>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Statistics</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">{totalRequests}</p>
                                              <p className="text-sm text-muted-foreground">Total Requests</p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">{completedRequests}</p>
                                              <p className="text-sm text-muted-foreground">Completed</p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="pt-6">
                                              <p className="text-2xl font-bold">
                                                ${allTransactions
                                                  .filter(t => allRequests.find(r => r.id === t.service_request_id && r.customer_id === customer.id))
                                                  .reduce((sum, t) => sum + Number(t.amount), 0)
                                                  .toFixed(2)}
                                              </p>
                                              <p className="text-sm text-muted-foreground">Total Spent</p>
                                            </CardContent>
                                          </Card>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Service History</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {allRequests
                                            .filter(r => r.customer_id === customer.id)
                                            .slice(0, 5)
                                            .map((request) => (
                                              <div key={request.id} className="flex justify-between items-center p-2 border rounded">
                                                <div>
                                                  <p className="font-medium">{request.service_type}</p>
                                                  <p className="text-sm text-muted-foreground">{request.location}</p>
                                                  <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                              </div>
                                            ))}
                                          {allRequests.filter(r => r.customer_id === customer.id).length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No service requests yet</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProfile(customer.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {customers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No customers registered yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentView === 'users' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Create, edit, and manage all users</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Create User</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>Add a new user to the system</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleCreateUser(
                              formData.get('email') as string,
                              formData.get('password') as string,
                              formData.get('full_name') as string,
                              formData.get('phone_number') as string,
                              formData.get('role') as string
                            );
                          }}>
                            <div className="space-y-4">
                              <div>
                                <Label>Full Name</Label>
                                <Input name="full_name" required />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input name="email" type="email" required />
                              </div>
                              <div>
                                <Label>Password</Label>
                                <Input name="password" type="password" required minLength={6} />
                              </div>
                              <div>
                                <Label>Phone Number</Label>
                                <Input name="phone_number" required />
                              </div>
                              <div>
                                <Label>Role</Label>
                                <Select name="role" required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="provider">Provider</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button type="submit" className="w-full">Create User</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allUsers.map((user) => {
                            const userRole = user.user_roles?.[0]?.role || 'N/A';
                            return (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.full_name}</TableCell>
                                <TableCell>{user.email || 'N/A'}</TableCell>
                                <TableCell>{user.phone_number || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge>{userRole}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">Edit</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit User</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                          e.preventDefault();
                                          const formData = new FormData(e.currentTarget);
                                          handleUpdateUser(user.id, {
                                            full_name: formData.get('full_name') as string,
                                            phone_number: formData.get('phone_number') as string,
                                            email: formData.get('email') as string,
                                            location: formData.get('location') as string,
                                          });
                                        }}>
                                          <div className="space-y-4">
                                            <div>
                                              <Label>Full Name</Label>
                                              <Input name="full_name" defaultValue={user.full_name} required />
                                            </div>
                                            <div>
                                              <Label>Email</Label>
                                              <Input name="email" type="email" defaultValue={user.email || ''} />
                                            </div>
                                            <div>
                                              <Label>Phone</Label>
                                              <Input name="phone_number" defaultValue={user.phone_number || ''} />
                                            </div>
                                            <div>
                                              <Label>Location</Label>
                                              <Input name="location" defaultValue={user.location || ''} />
                                            </div>
                                            <div>
                                              <Label>Change Role</Label>
                                              <Select
                                                defaultValue={userRole}
                                                onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole, userRole)}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="customer">Customer</SelectItem>
                                                  <SelectItem value="provider">Provider</SelectItem>
                                                  <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <Button type="submit" className="w-full">Save Changes</Button>
                                          </div>
                                        </form>
                                      </DialogContent>
                                    </Dialog>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {allUsers.map((user) => {
                        const userRole = user.user_roles?.[0]?.role || 'N/A';
                        return (
                          <Card key={user.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4 space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{user.full_name}</p>
                                  </div>
                                </div>

                                {user.email && (
                                  <div className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                )}

                                {user.phone_number && (
                                  <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground truncate">{user.phone_number}</p>
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t">
                                <Badge className="text-xs capitalize">{userRole}</Badge>
                              </div>

                              <div className="flex gap-2 pt-2 border-t">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="flex-1">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit User</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.currentTarget);
                                      handleUpdateUser(user.id, {
                                        full_name: formData.get('full_name') as string,
                                        phone_number: formData.get('phone_number') as string,
                                        email: formData.get('email') as string,
                                        location: formData.get('location') as string,
                                      });
                                    }}>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Full Name</Label>
                                          <Input name="full_name" defaultValue={user.full_name} required />
                                        </div>
                                        <div>
                                          <Label>Email</Label>
                                          <Input name="email" type="email" defaultValue={user.email || ''} />
                                        </div>
                                        <div>
                                          <Label>Phone</Label>
                                          <Input name="phone_number" defaultValue={user.phone_number || ''} />
                                        </div>
                                        <div>
                                          <Label>Location</Label>
                                          <Input name="location" defaultValue={user.location || ''} />
                                        </div>
                                        <div>
                                          <Label>Change Role</Label>
                                          <Select
                                            defaultValue={userRole}
                                            onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole, userRole)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="customer">Customer</SelectItem>
                                              <SelectItem value="provider">Provider</SelectItem>
                                              <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button type="submit" className="w-full">Save Changes</Button>
                                      </div>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentView === 'payments' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>View and manage all payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allTransactions.map((tx) => {
                            const request = allRequests.find(r => r.id === tx.service_request_id);
                            const customer = customers.find(c => c.id === request?.customer_id);

                            return (
                              <TableRow key={tx.id}>
                                <TableCell className="font-mono text-sm">{tx.id.slice(0, 8)}</TableCell>
                                <TableCell className="font-bold">GHS {Number(tx.amount).toFixed(2)}</TableCell>
                                <TableCell>{request?.service_type || 'N/A'}</TableCell>
                                <TableCell>{customer?.full_name || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{tx.transaction_type}</Badge>
                                </TableCell>
                                <TableCell className="capitalize">{tx.payment_method.replace('_', ' ')}</TableCell>
                                <TableCell>
                                  <Badge variant={tx.confirmed_at ? 'default' : 'secondary'}>
                                    {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">Details</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Transaction Details</DialogTitle>
                                        <DialogDescription>Transaction #{tx.id.slice(0, 8)}</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-muted-foreground">Amount</Label>
                                            <p className="text-2xl font-bold">GHS {Number(tx.amount).toFixed(2)}</p>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Status</Label>
                                            <Badge variant={tx.confirmed_at ? 'default' : 'secondary'} className="mt-2">
                                              {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                                            </Badge>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Transaction Type</Label>
                                            <p className="font-medium">{tx.transaction_type}</p>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Payment Method</Label>
                                            <p className="font-medium capitalize">{tx.payment_method.replace('_', ' ')}</p>
                                          </div>
                                          {tx.reference_number && (
                                            <div className="col-span-2">
                                              <Label className="text-muted-foreground">Reference Number</Label>
                                              <p className="font-mono font-medium">{tx.reference_number}</p>
                                            </div>
                                          )}
                                          <div className="col-span-2 border-t pt-4">
                                            <Label className="text-muted-foreground">Service Details</Label>
                                            <div className="mt-2 space-y-1">
                                              <p><span className="font-medium">Type:</span> {request?.service_type}</p>
                                              <p><span className="font-medium">Customer:</span> {customer?.full_name}</p>
                                              <p><span className="font-medium">Location:</span> {request?.location}</p>
                                            </div>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Created</Label>
                                            <p className="text-sm">{new Date(tx.created_at).toLocaleString()}</p>
                                          </div>
                                          {tx.confirmed_at && (
                                            <div>
                                              <Label className="text-muted-foreground">Confirmed</Label>
                                              <p className="text-sm">{new Date(tx.confirmed_at).toLocaleString()}</p>
                                            </div>
                                          )}
                                          {tx.notes && (
                                            <div className="col-span-2">
                                              <Label className="text-muted-foreground">Notes</Label>
                                              <p className="text-sm">{tx.notes}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {allTransactions.map((tx) => {
                        const request = allRequests.find(r => r.id === tx.service_request_id);
                        const customer = customers.find(c => c.id === request?.customer_id);

                        return (
                          <Card key={tx.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4 space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-bold text-sm">GHS {Number(tx.amount).toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground font-mono">#{tx.id.slice(0, 8)}</p>
                                    </div>
                                  </div>
                                  <Badge variant={tx.confirmed_at ? 'default' : 'secondary'} className="text-xs">
                                    {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                                  </Badge>
                                </div>

                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground truncate">{customer?.full_name || 'Unknown'}</p>
                                </div>

                                <div className="flex items-start gap-2">
                                  <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground truncate capitalize">{request?.service_type || 'N/A'}</p>
                                </div>

                                <div className="flex items-start gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground capitalize">{tx.payment_method.replace('_', ' ')}</p>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t">
                                <Badge variant="outline" className="text-xs capitalize">{tx.transaction_type.replace('_', ' ')}</Badge>
                              </div>

                              <div className="pt-2 border-t">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="w-full">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Transaction Details</DialogTitle>
                                      <DialogDescription>Transaction #{tx.id.slice(0, 8)}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Amount</Label>
                                          <p className="text-2xl font-bold">GHS {Number(tx.amount).toFixed(2)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Status</Label>
                                          <Badge variant={tx.confirmed_at ? 'default' : 'secondary'} className="mt-2">
                                            {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                                          </Badge>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Transaction Type</Label>
                                          <p className="font-medium">{tx.transaction_type}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Payment Method</Label>
                                          <p className="font-medium capitalize">{tx.payment_method.replace('_', ' ')}</p>
                                        </div>
                                        {tx.reference_number && (
                                          <div className="col-span-2">
                                            <Label className="text-muted-foreground">Reference Number</Label>
                                            <p className="font-mono font-medium">{tx.reference_number}</p>
                                          </div>
                                        )}
                                        <div className="col-span-2 border-t pt-4">
                                          <Label className="text-muted-foreground">Service Details</Label>
                                          <div className="mt-2 space-y-1">
                                            <p><span className="font-medium">Type:</span> {request?.service_type}</p>
                                            <p><span className="font-medium">Customer:</span> {customer?.full_name}</p>
                                            <p><span className="font-medium">Location:</span> {request?.location}</p>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Created</Label>
                                          <p className="text-sm">{new Date(tx.created_at).toLocaleString()}</p>
                                        </div>
                                        {tx.confirmed_at && (
                                          <div>
                                            <Label className="text-muted-foreground">Confirmed</Label>
                                            <p className="text-sm">{new Date(tx.confirmed_at).toLocaleString()}</p>
                                          </div>
                                        )}
                                        {tx.notes && (
                                          <div className="col-span-2">
                                            <Label className="text-muted-foreground">Notes</Label>
                                            <p className="text-sm">{tx.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {allTransactions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions recorded yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentView === 'applications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Partnership Applications</CardTitle>
                    <CardDescription>Review and manage partnership applications</CardDescription>
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        placeholder="Search by business name, contact person, email, phone, city, or status..."
                        value={adminApplicationFilter}
                        onChange={(e) => setAdminApplicationFilter(e.target.value)}
                        className="max-w-2xl"
                      />
                      {adminApplicationFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdminApplicationFilter('')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Business Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.filter(app => {
                            const searchLower = adminApplicationFilter.toLowerCase();
                            return (
                              app.business_name?.toLowerCase().includes(searchLower) ||
                              app.contact_person?.toLowerCase().includes(searchLower) ||
                              app.email?.toLowerCase().includes(searchLower) ||
                              app.phone?.toLowerCase().includes(searchLower) ||
                              app.city?.toLowerCase().includes(searchLower) ||
                              app.status?.toLowerCase().includes(searchLower)
                            );
                          }).map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.business_name}</TableCell>
                              <TableCell>{app.contact_person}</TableCell>
                              <TableCell>{app.email}</TableCell>
                              <TableCell>{app.phone}</TableCell>
                              <TableCell>{app.city}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    app.status === 'approved' ? 'default' :
                                      app.status === 'rejected' ? 'destructive' :
                                        'secondary'
                                  }
                                >
                                  {app.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{new Date(app.created_at).toLocaleDateString()}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleTimeString()}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">View</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Partnership Application Details</DialogTitle>
                                      <DialogDescription>{app.business_name}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-muted-foreground">Business Name</Label>
                                          <p className="font-medium">{app.business_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Contact Person</Label>
                                          <p className="font-medium">{app.contact_person}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Email</Label>
                                          <p className="font-medium">{app.email}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Phone</Label>
                                          <p className="font-medium">{app.phone}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">City/Location</Label>
                                          <p className="font-medium">{app.city}</p>
                                        </div>
                                        <div>
                                          <Label className="text-muted-foreground">Status</Label>
                                          <Badge
                                            variant={
                                              app.status === 'approved' ? 'default' :
                                                app.status === 'rejected' ? 'destructive' :
                                                  'secondary'
                                            }
                                            className="mt-2"
                                          >
                                            {app.status}
                                          </Badge>
                                        </div>
                                        {app.message && (
                                          <div className="col-span-2">
                                            <Label className="text-muted-foreground">Message</Label>
                                            <p className="font-medium whitespace-pre-wrap">{app.message}</p>
                                          </div>
                                        )}
                                        <div>
                                          <Label className="text-muted-foreground">Applied On</Label>
                                          <p className="text-sm">{new Date(app.created_at).toLocaleString()}</p>
                                        </div>
                                        {app.reviewed_at && (
                                          <div>
                                            <Label className="text-muted-foreground">Reviewed On</Label>
                                            <p className="text-sm">{new Date(app.reviewed_at).toLocaleString()}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="border-t pt-4 space-y-4">
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                                            disabled={app.status === 'approved'}
                                            className="flex-1"
                                          >
                                            Approve Only
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                            disabled={app.status === 'rejected'}
                                            className="flex-1"
                                          >
                                            Reject
                                          </Button>
                                          {app.status !== 'pending' && (
                                            <Button
                                              variant="outline"
                                              onClick={() => handleUpdateApplicationStatus(app.id, 'pending')}
                                              className="flex-1"
                                            >
                                              Reset to Pending
                                            </Button>
                                          )}
                                        </div>

                                        <div className="border-t pt-4">
                                          <Label className="text-sm font-semibold mb-2 block">Create User Account</Label>
                                          <p className="text-xs text-muted-foreground mb-3">
                                            Convert this application into a user account with provider or customer access
                                          </p>
                                          <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            handleCreateUserFromApplication(
                                              app,
                                              formData.get('role') as 'provider' | 'customer',
                                              formData.get('password') as string
                                            );
                                          }}>
                                            <div className="space-y-3">
                                              <div>
                                                <Label htmlFor={`role-${app.id}`}>Assign as</Label>
                                                <Select name="role" required>
                                                  <SelectTrigger id={`role-${app.id}`}>
                                                    <SelectValue placeholder="Select role" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="provider">Provider</SelectItem>
                                                    <SelectItem value="customer">Customer</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label htmlFor={`password-${app.id}`}>Initial Password</Label>
                                                <Input
                                                  id={`password-${app.id}`}
                                                  name="password"
                                                  type="password"
                                                  placeholder="Min. 6 characters"
                                                  required
                                                  minLength={6}
                                                />
                                              </div>
                                              <Button type="submit" className="w-full">
                                                Create Account
                                              </Button>
                                            </div>
                                          </form>
                                        </div>

                                        <div className="border-t pt-4">
                                          <Button
                                            variant="destructive"
                                            onClick={() => handleDeleteApplication(app.id)}
                                            className="w-full"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Application
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {applications.filter(app => {
                        const searchLower = adminApplicationFilter.toLowerCase();
                        return (
                          app.business_name?.toLowerCase().includes(searchLower) ||
                          app.contact_person?.toLowerCase().includes(searchLower) ||
                          app.email?.toLowerCase().includes(searchLower) ||
                          app.phone?.toLowerCase().includes(searchLower) ||
                          app.city?.toLowerCase().includes(searchLower) ||
                          app.status?.toLowerCase().includes(searchLower)
                        );
                      }).map((app) => (
                        <Card key={app.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{app.business_name}</span>
                                </div>
                                <Badge
                                  variant={
                                    app.status === 'approved' ? 'default' :
                                      app.status === 'rejected' ? 'destructive' :
                                        'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {app.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Contact:</span>
                                <span className="font-medium">{app.contact_person}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{app.email}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-medium">{app.phone}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">City:</span>
                                <span className="font-medium">{app.city}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Applied:</span>
                                <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Partnership Application Details</DialogTitle>
                                    <DialogDescription>{app.business_name}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Business Name</Label>
                                        <p className="font-medium">{app.business_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Contact Person</Label>
                                        <p className="font-medium">{app.contact_person}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{app.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p className="font-medium">{app.phone}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">City/Location</Label>
                                        <p className="font-medium">{app.city}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <Badge
                                          variant={
                                            app.status === 'approved' ? 'default' :
                                              app.status === 'rejected' ? 'destructive' :
                                                'secondary'
                                          }
                                          className="mt-2"
                                        >
                                          {app.status}
                                        </Badge>
                                      </div>
                                      {app.message && (
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Message</Label>
                                          <p className="font-medium whitespace-pre-wrap">{app.message}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-muted-foreground">Applied On</Label>
                                        <p className="text-sm">{new Date(app.created_at).toLocaleString()}</p>
                                      </div>
                                      {app.reviewed_at && (
                                        <div>
                                          <Label className="text-muted-foreground">Reviewed On</Label>
                                          <p className="text-sm">{new Date(app.reviewed_at).toLocaleString()}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t pt-4 space-y-4">
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                                          disabled={app.status === 'approved'}
                                          className="flex-1"
                                        >
                                          Approve Only
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                          disabled={app.status === 'rejected'}
                                          className="flex-1"
                                        >
                                          Reject
                                        </Button>
                                        {app.status !== 'pending' && (
                                          <Button
                                            variant="outline"
                                            onClick={() => handleUpdateApplicationStatus(app.id, 'pending')}
                                            className="flex-1"
                                          >
                                            Reset to Pending
                                          </Button>
                                        )}
                                      </div>

                                      <div className="border-t pt-4">
                                        <Label className="text-sm font-semibold mb-2 block">Create User Account</Label>
                                        <p className="text-xs text-muted-foreground mb-3">
                                          Convert this application into a user account with provider or customer access
                                        </p>
                                        <form onSubmit={(e) => {
                                          e.preventDefault();
                                          const formData = new FormData(e.currentTarget);
                                          handleCreateUserFromApplication(
                                            app,
                                            formData.get('role') as 'provider' | 'customer',
                                            formData.get('password') as string
                                          );
                                        }}>
                                          <div className="space-y-3">
                                            <div>
                                              <Label htmlFor={`role-${app.id}`}>Assign as</Label>
                                              <Select name="role" required>
                                                <SelectTrigger id={`role-${app.id}`}>
                                                  <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="provider">Provider</SelectItem>
                                                  <SelectItem value="customer">Customer</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label htmlFor={`password-${app.id}`}>Initial Password</Label>
                                              <Input
                                                id={`password-${app.id}`}
                                                name="password"
                                                type="password"
                                                placeholder="Min. 6 characters"
                                                required
                                                minLength={6}
                                              />
                                            </div>
                                            <Button type="submit" className="w-full">
                                              Create Account
                                            </Button>
                                          </div>
                                        </form>
                                      </div>

                                      <div className="border-t pt-4">
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleDeleteApplication(app.id)}
                                          className="w-full"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Application
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {applications.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No partnership applications yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentView === 'messages' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                            <p className="text-3xl font-bold">{contactMessages.length}</p>
                          </div>
                          <MessageSquare className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">New</p>
                            <p className="text-3xl font-bold">{contactMessages.filter(m => m.status === 'new').length}</p>
                          </div>
                          <Mail className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Read</p>
                            <p className="text-3xl font-bold">{contactMessages.filter(m => m.status === 'read').length}</p>
                          </div>
                          <Eye className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Archived</p>
                            <p className="text-3xl font-bold">{contactMessages.filter(m => m.status === 'archived').length}</p>
                          </div>
                          <Archive className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filters and Search */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Contact Messages
                          </CardTitle>
                          <CardDescription>Manage messages from the contact form</CardDescription>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, email, or subject..."
                            value={messageSearchQuery}
                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Status Filter Tabs */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          size="sm"
                          variant={messageStatusFilter === 'all' ? 'default' : 'outline'}
                          onClick={() => setMessageStatusFilter('all')}
                          className="gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          All ({contactMessages.length})
                        </Button>
                        <Button
                          size="sm"
                          variant={messageStatusFilter === 'new' ? 'default' : 'outline'}
                          onClick={() => setMessageStatusFilter('new')}
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          New ({contactMessages.filter(m => m.status === 'new').length})
                        </Button>
                        <Button
                          size="sm"
                          variant={messageStatusFilter === 'read' ? 'default' : 'outline'}
                          onClick={() => setMessageStatusFilter('read')}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Read ({contactMessages.filter(m => m.status === 'read').length})
                        </Button>
                        <Button
                          size="sm"
                          variant={messageStatusFilter === 'archived' ? 'default' : 'outline'}
                          onClick={() => setMessageStatusFilter('archived')}
                          className="gap-2"
                        >
                          <Archive className="h-4 w-4" />
                          Archived ({contactMessages.filter(m => m.status === 'archived').length})
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {(() => {
                        const filteredMessages = contactMessages
                          .filter(message => {
                            // Status filter
                            if (messageStatusFilter !== 'all' && message.status !== messageStatusFilter) {
                              return false;
                            }

                            // Search filter
                            if (messageSearchQuery) {
                              const query = messageSearchQuery.toLowerCase();
                              return (
                                message.name.toLowerCase().includes(query) ||
                                message.email.toLowerCase().includes(query) ||
                                message.subject.toLowerCase().includes(query) ||
                                (message.phone && message.phone.includes(query))
                              );
                            }

                            return true;
                          })
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                        if (filteredMessages.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                              <p className="text-muted-foreground">
                                {messageSearchQuery || messageStatusFilter !== 'all'
                                  ? 'No messages match your filters'
                                  : 'No contact messages yet'}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {filteredMessages.map((message) => (
                              <Card
                                key={message.id}
                                className={`transition-all hover:shadow-md ${message.status === 'new'
                                  ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10'
                                  : message.status === 'read'
                                    ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-card'
                                    : 'border-border/50 bg-card/50'
                                  }`}
                              >
                                <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className={`p-3 rounded-xl ${message.status === 'new'
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : message.status === 'read'
                                          ? 'bg-green-500/10 text-green-500'
                                          : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <Mail className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-bold text-lg truncate">{message.name}</p>
                                          <Badge
                                            variant={
                                              message.status === 'new' ? 'default' :
                                                message.status === 'read' ? 'secondary' :
                                                  'outline'
                                            }
                                            className="shrink-0"
                                          >
                                            {message.status}
                                          </Badge>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{message.email}</span>
                                          </div>
                                          {message.phone && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <Phone className="h-3.5 w-3.5 shrink-0" />
                                              <span>{message.phone}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span>📅 {new Date(message.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>🕐 {new Date(message.created_at).toLocaleTimeString()}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3 mb-4 pl-14">
                                    <div>
                                      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Subject</Label>
                                      <p className="font-semibold text-foreground">{message.subject}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Message</Label>
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{message.message}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pl-14">
                                    {message.status === 'new' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateContactMessageStatus(message.id, 'read')}
                                        className="gap-2"
                                      >
                                        <Eye className="h-4 w-4" />
                                        Mark as Read
                                      </Button>
                                    )}
                                    {message.status !== 'archived' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateContactMessageStatus(message.id, 'archived')}
                                        className="gap-2"
                                      >
                                        <Archive className="h-4 w-4" />
                                        Archive
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteContactMessage(message.id)}
                                      className="gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentView === 'services' && (
                <ServiceManager />
              )}

              {currentView === 'cities' && (
                <CitiesManager />
              )}

              {currentView === 'testimonials' && (
                <TestimonialsManager />
              )}

              {currentView === 'homepage' && (
                <HomepageSectionsManager />
              )}

              {currentView === 'settings' && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure application-wide settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="maps-toggle" className="text-base font-medium">
                          Map Tracking
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable live map tracking on Track Rescue page
                        </p>
                      </div>
                      <Switch
                        id="maps-toggle"
                        checked={mapsEnabled}
                        onCheckedChange={handleToggleMaps}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentView === 'profile' && (
                <ProfileForm onSuccess={fetchData} />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return null;
};

export default Dashboard;
