import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Star, DollarSign, TrendingUp, Briefcase, MapPin, User, Phone, Clock, CheckCircle, XCircle, Award, Filter, Navigation, Fuel, Wifi, WifiOff, Eye, Calculator, CreditCard } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useProviderLocation } from '@/hooks/useProviderLocation';
import { useProviderAvailability } from '@/hooks/useProviderAvailability';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import QuoteModal from '@/components/QuoteModal';
import ServiceConfirmation from '@/components/ServiceConfirmation';
import PayoutSettings from '@/components/PayoutSettings';
import { Skeleton } from '@/components/ui/skeleton';

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [updatingLocation, setUpdatingLocation] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<any | null>(null);
  const [quoteModalRequest, setQuoteModalRequest] = useState<any | null>(null);
  const [confirmPaymentRequest, setConfirmPaymentRequest] = useState<any | null>(null);

  // Provider availability management
  const { isAvailable, isUpdating, toggleAvailability } = useProviderAvailability({ userId: user?.id });

  // Track active request (en_route or in_progress)
  useEffect(() => {
    const activeRequest = requests.find(r =>
      r.status === 'en_route' || r.status === 'in_progress'
    );
    setActiveRequestId(activeRequest?.id || null);
  }, [requests]);

  // Enable live location tracking for active requests
  useProviderLocation({
    requestId: activeRequestId,
    isActive: activeRequestId !== null
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('provider_service_requests')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `provider_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Notify provider when payment is received
          if (newData?.status === 'paid' && oldData?.status !== 'paid') {
            toast.success('🎉 Payment received! You can now start heading to the customer location.', {
              duration: 10000,
            });
          }
          
          // Notify provider when customer has confirmed service & funds are being transferred
          if (newData?.customer_confirmed_at && !oldData?.customer_confirmed_at) {
            toast.success('✅ Customer confirmed service completion! Funds are being transferred to your account. Please confirm once received.', {
              duration: 10000,
            });
          }
          
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `provider_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    const [requestsData, earningsData, ratingsData, profileData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_customer_id_fkey(full_name, phone_number, email)')
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, service_requests!inner(provider_id)')
        .eq('transaction_type', 'customer_to_business')
        .eq('service_requests.provider_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ratings')
        .select('*')
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .maybeSingle(),
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (earningsData.data) setEarnings(earningsData.data);
    if (ratingsData.data) {
      setRatings(ratingsData.data);
      const avg = ratingsData.data.reduce((acc, r) => acc + r.rating, 0) / ratingsData.data.length;
      setAverageRating(avg || 0);
    }
    if (profileData.data) setProfile(profileData.data);
    setLoading(false);
  };

  const updateStatus = async (requestId: string, status: 'pending' | 'assigned' | 'accepted' | 'denied' | 'en_route' | 'in_progress' | 'completed' | 'cancelled' | 'awaiting_confirmation') => {
    const updateData: any = { status };
    
    // For "awaiting_confirmation" status, mark as waiting for customer confirmation
    if (status === 'awaiting_confirmation') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      if (status === 'awaiting_confirmation') {
        toast.success('Marked as complete! Waiting for customer confirmation.');
      } else {
        toast.success('Status updated successfully');
      }
      fetchData();
    }
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({
        status: 'pending',
        provider_id: null,
        assigned_at: null,
        assigned_by: null
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to reject request');
    } else {
      toast.success('Request rejected successfully');
      fetchData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const updateProviderLocation = async (requestId: string) => {
    setUpdatingLocation(requestId);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setUpdatingLocation(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { error } = await supabase
          .from('service_requests')
          .update({
            provider_lat: latitude,
            provider_lng: longitude
          })
          .eq('id', requestId);

        if (error) {
          toast.error('Failed to update location');
        } else {
          toast.success('Location updated successfully');
          fetchData();
        }
        setUpdatingLocation(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location. Please enable location services.');
        setUpdatingLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getDistance = (request: any) => {
    if (!request.customer_lat || !request.customer_lng || !request.provider_lat || !request.provider_lng) {
      return null;
    }
    return calculateDistance(
      request.customer_lat,
      request.customer_lng,
      request.provider_lat,
      request.provider_lng
    );
  };

  const getStatusBorderColor = (status: string) => {
    const colors: any = {
      pending: 'border-l-yellow-500',
      assigned: 'border-l-blue-500',
      quoted: 'border-l-indigo-500',
      awaiting_payment: 'border-l-orange-500',
      paid: 'border-l-teal-500',
      accepted: 'border-l-blue-600',
      en_route: 'border-l-purple-500',
      in_progress: 'border-l-purple-600',
      awaiting_confirmation: 'border-l-amber-500',
      completed: 'border-l-green-500',
      cancelled: 'border-l-red-500',
      denied: 'border-l-red-600'
    };
    return colors[status] || 'border-l-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <section className="relative overflow-hidden bg-muted/20 py-20 px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-16 w-3/4 max-w-2xl" />
            <Skeleton className="h-6 w-1/2 max-w-xl" />
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-2 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>

            <div className="border-2 rounded-xl overflow-hidden">
              <div className="border-b p-6 bg-muted/10">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const totalEarnings = earnings.reduce((acc, t) => acc + parseFloat(t.provider_amount || 0), 0);

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesServiceType = serviceTypeFilter === 'all' || request.service_type === serviceTypeFilter;
    return matchesStatus && matchesServiceType;
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setServiceTypeFilter('all');
  };

  return (
    <div className="min-h-screen pt-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-20 px-6">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col gap-6">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Provider Portal</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 💼
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                Manage your jobs, track earnings, and deliver excellent service
              </p>
            </div>
            <div className="mt-16 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className={`flex items-center justify-center gap-3 px-4 py-3 rounded-full border transition-all ${isAvailable
                ? 'bg-green-500/20 border-green-500/50 text-green-100'
                : 'bg-red-500/20 border-red-500/50 text-red-100'
                }`}>
                {isAvailable ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm font-medium">{isAvailable ? 'Online' : 'Offline'}</span>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                  disabled={isUpdating}
                />
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Payout Settings - shown prominently if not set up */}
          {user?.id && (
            <PayoutSettings userId={user.id} onComplete={fetchData} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-muted-foreground">Total Earnings</h3>
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                  GHS {totalEarnings.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Your total income
                </p>
              </div>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-warning/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-muted-foreground">Average Rating</h3>
                  <div className="p-3 rounded-xl bg-warning/10 group-hover:bg-warning/20 transition-colors">
                    <Star className="h-5 w-5 text-warning" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{averageRating.toFixed(1)}</p>
                  <Star className="h-6 w-6 fill-warning text-warning" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Based on {ratings.length} reviews</p>
              </div>
            </Card>

            <Card className="group relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-muted-foreground">Total Jobs</h3>
                  <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{requests.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Completed & active jobs</p>
              </div>
            </Card>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Assigned Jobs</CardTitle>
                    <CardDescription className="text-base mt-1">Manage your service requests</CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="en_route">En Route</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Service Type" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="towing">Towing</SelectItem>
                      <SelectItem value="tire_change">Tire Change</SelectItem>
                      <SelectItem value="fuel_delivery">Fuel Delivery</SelectItem>
                      <SelectItem value="jump_start">Jump Start</SelectItem>
                      <SelectItem value="lockout">Lockout</SelectItem>
                      <SelectItem value="minor_repair">Minor Repair</SelectItem>
                    </SelectContent>
                  </Select>

                  {(statusFilter !== 'all' || serviceTypeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {requests.length === 0 ? 'No jobs assigned yet' : 'No jobs match the selected filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className={`group hover:shadow-xl transition-all duration-300 border-2 border-l-4 ${getStatusBorderColor(request.status)} hover:border-primary/30 hover:-translate-y-1`}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 md:gap-3 mb-3">
                              <div className="hidden md:block p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg md:text-xl capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text truncate">{request.service_type.replace('_', ' ')}</p>
                                <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                  <span className="truncate">{request.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="md:ml-14 space-y-1.5 md:space-y-2">
                              <div className="flex items-center gap-2 text-xs md:text-sm">
                                <User className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">Customer:</span> <span className="truncate">{request.profiles?.full_name || 'Guest User'}</span>
                              </div>
                              {(request.profiles?.phone_number || request.phone_number) && (
                                <div className="flex items-center gap-2 text-xs md:text-sm">
                                  <Phone className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium">Phone:</span> <span className="truncate">{request.phone_number || request.profiles?.phone_number}</span>
                                </div>
                              )}
                              {getDistance(request) !== null && (
                                <div className="flex items-center gap-2 text-xs md:text-sm">
                                  <Navigation className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                                  <span className="font-medium text-primary">Distance:</span>
                                  <span className="text-primary font-semibold">{formatDistance(getDistance(request)!)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge className="capitalize shadow-sm text-xs flex-shrink-0 ml-2">{request.status.replace('_', ' ')}</Badge>
                        </div>

                        {request.description && (
                          <div className="md:ml-14 mb-4 p-3 md:p-4 rounded-xl bg-muted/50 border border-muted">
                            <p className="text-xs md:text-sm break-words">{request.description}</p>
                          </div>
                        )}

                        {request.vehicle_image_url && (
                          <div className="md:ml-14 mb-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Vehicle Photo:</p>
                            <img
                              src={request.vehicle_image_url}
                              alt="Vehicle"
                              className="w-full max-w-[200px] rounded-lg border shadow-sm object-cover h-32"
                            />
                          </div>
                        )}

                        {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                          <div className="md:ml-14 mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <Fuel className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <div className="flex gap-3 text-sm">
                              {request.fuel_type && <span className="capitalize font-medium">{request.fuel_type}</span>}
                              {request.fuel_amount && <span className="text-amber-900">{request.fuel_amount} Liters</span>}
                            </div>
                          </div>
                        )}

                        <div className="md:ml-14 flex flex-col md:flex-row flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequestForDetails(request)}
                            className="w-full md:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {/* Assigned - Provider must submit quote first */}
                          {request.status === 'assigned' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => setQuoteModalRequest(request)} 
                                className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
                              >
                                <Calculator className="h-4 w-4 mr-2" />
                                Submit Quote
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectRequest(request.id)} className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Quoted - Waiting for customer approval */}
                          {request.status === 'quoted' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                              <Clock className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm text-indigo-800">
                                Quote submitted (GHS {Number(request.quoted_amount).toFixed(2)}) - Awaiting customer approval
                              </span>
                            </div>
                          )}

                          {/* Awaiting Payment - Customer approved, waiting for payment */}
                          {request.status === 'awaiting_payment' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                              <CreditCard className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-800">
                                Quote approved - Awaiting customer payment
                              </span>
                            </div>
                          )}

                          {/* Paid - Customer paid, provider can start */}
                          {request.status === 'paid' && (
                            <>
                              <Button size="sm" onClick={() => updateStatus(request.id, 'en_route')} className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg transition-all">
                                <Navigation className="h-4 w-4 mr-2" />
                                Payment Received - Start Driving
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProviderLocation(request.id)}
                                disabled={updatingLocation === request.id}
                                className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
                              >
                                {updatingLocation === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Navigation className="h-4 w-4 mr-2" />
                                )}
                                Update Location
                              </Button>
                            </>
                          )}

                          {/* Legacy accepted status - for backward compatibility */}
                          {request.status === 'accepted' && (
                            <>
                              <Button size="sm" onClick={() => updateStatus(request.id, 'en_route')} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-md hover:shadow-lg transition-all">
                                <Navigation className="h-4 w-4 mr-2" />
                                Start Driving (En Route)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProviderLocation(request.id)}
                                disabled={updatingLocation === request.id}
                                className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
                              >
                                {updatingLocation === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Navigation className="h-4 w-4 mr-2" />
                                )}
                                Update Location
                              </Button>
                            </>
                          )}

                          {request.status === 'en_route' && (
                            <>
                              <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Arrived - Start Service
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProviderLocation(request.id)}
                                disabled={updatingLocation === request.id}
                                className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
                              >
                                {updatingLocation === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Navigation className="h-4 w-4 mr-2" />
                                )}
                                Update Location
                              </Button>
                            </>
                          )}

                          {request.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus(request.id, 'awaiting_confirmation')} 
                              className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </Button>
                          )}

                          {/* Awaiting customer confirmation */}
                          {request.status === 'awaiting_confirmation' && !request.customer_confirmed_at && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-amber-800">
                                Awaiting customer confirmation
                              </span>
                            </div>
                          )}

                          {/* Customer confirmed - Provider can now confirm payment receipt */}
                          {request.status === 'awaiting_confirmation' && request.customer_confirmed_at && !request.provider_confirmed_payment_at && (
                            <Button 
                              size="sm" 
                              onClick={() => setConfirmPaymentRequest(request)} 
                              className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Confirm Payment Received
                            </Button>
                          )}

                          {/* Fully completed */}
                          {request.status === 'completed' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800">
                                Completed & Payment Confirmed
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Payment History</CardTitle>
                  <CardDescription className="text-base mt-1">Your earnings and transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {earnings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earnings.map((transaction) => (
                    <div key={transaction.id} className="group border-2 rounded-xl p-5 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              GHS {Number(transaction.provider_amount || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">
                              {transaction.provider_percentage}% of GHS {Number(transaction.amount).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(transaction.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={transaction.confirmed_at ? 'default' : 'secondary'} className="shadow-sm">
                          {transaction.confirmed_at ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <RequestDetailsModal
        request={selectedRequestForDetails}
        open={!!selectedRequestForDetails}
        onOpenChange={(open) => !open && setSelectedRequestForDetails(null)}
      />

      <QuoteModal
        request={quoteModalRequest}
        open={!!quoteModalRequest}
        onOpenChange={(open) => !open && setQuoteModalRequest(null)}
        onQuoteSubmitted={fetchData}
      />

      <ServiceConfirmation
        request={confirmPaymentRequest}
        open={!!confirmPaymentRequest}
        onOpenChange={(open) => !open && setConfirmPaymentRequest(null)}
        onConfirmed={fetchData}
        userType="provider"
      />
    </div>
  );
};

export default ProviderDashboard;
