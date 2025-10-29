import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, User, Phone, Loader2, CheckCircle2, AlertCircle, Car, Navigation, Filter } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TrackRescue = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
 
  // Robust phone normalization and matching across formats
  const digitsOnly = (num: string) => (num || '').replace(/\D/g, '');
  const lastN = (num: string, n: number) => digitsOnly(num).slice(-n);
  const toGhanaVariants = (num: string) => {
    const d = digitsOnly(num);
    const variants = new Set<string>();
    if (!d) return variants;
    variants.add(d);
    variants.add(lastN(d, 10));
    variants.add(lastN(d, 9));
    // Convert local Ghana 0XXXXXXXXX to E.164 233XXXXXXXXX
    if (d.startsWith('0') && d.length >= 10) {
      variants.add('233' + d.slice(1));
    }
    // Convert E.164 Ghana 233XXXXXXXXX to local 0XXXXXXXXX
    if (d.startsWith('233') && d.length >= 11) {
      variants.add('0' + d.slice(3));
    }
    return variants;
  };
  const phonesMatch = (a: string, b: string) => {
    const va = toGhanaVariants(a);
    const vb = toGhanaVariants(b);
    // Include last-10 and last-9 as generic fallbacks
    va.add(lastN(a, 10));
    va.add(lastN(a, 9));
    vb.add(lastN(b, 10));
    vb.add(lastN(b, 9));
    for (const x of va) if (x && vb.has(x)) return true;
    return false;
  };
 
   const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);

    try {
      // Normalize for logs (we use robust matcher for actual comparison)
      const normalizedInput = digitsOnly(phoneNumber);
      console.log('Searching for phone number:', normalizedInput);

      // Search for requests by phone number (for guest users) or by customer_id (for logged-in users)
      const { data: allRequests, error: requestsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          profiles!service_requests_provider_id_fkey(full_name, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        throw requestsError;
      }

      console.log('All requests fetched:', allRequests?.length || 0);

      // Filter requests that match the phone number
      const matchingRequests = allRequests?.filter(request => {
        // Check direct phone_number field (guest requests)
        if (request.phone_number) {
          const isMatch = phonesMatch(request.phone_number, phoneNumber);
          console.log('Checking request phone:', request.phone_number, 'match:', isMatch);
          if (isMatch) {
            console.log('Match found!');
            return true;
          }
        }
        return false;
      }) || [];

      console.log('Matching requests from direct phone search:', matchingRequests.length);

      // Also try to find user profile and their requests
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone_number')
        .not('phone_number', 'is', null);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      console.log('Profiles with phone numbers:', profiles?.length || 0);

      const matchingProfile = profiles?.find(profile => {
        const isMatch = phonesMatch(profile.phone_number || '', phoneNumber);
        return isMatch;
      });

      console.log('Matching profile found:', !!matchingProfile);

      if (matchingProfile) {
        const profileRequests = allRequests?.filter(r => r.customer_id === matchingProfile.id) || [];
        console.log('Additional requests from profile:', profileRequests.length);
        matchingRequests.push(...profileRequests);
      }

      console.log('Total matching requests:', matchingRequests.length);

      if (matchingRequests.length === 0) {
        toast.error('No service requests found for this phone number');
      } else {
        toast.success(`Found ${matchingRequests.length} service request(s)`);
      }
      
      setServiceRequests(matchingRequests);
      setSearched(true);
    } catch (error: any) {
      console.error('Error tracking rescue:', error);
      toast.error('Failed to track rescue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch requests for logged-in users
  useEffect(() => {
    const fetchUserRequests = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data: requests, error } = await supabase
          .from('service_requests')
          .select(`
            *,
            profiles!service_requests_provider_id_fkey(full_name, phone_number)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setServiceRequests(requests || []);
        setSearched(true);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRequests();
  }, [user]);

  // Set up real-time subscription for updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('service_requests_tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Real-time update:', payload);
          
          // Refresh the service requests data
          const { data: requests } = await supabase
            .from('service_requests')
            .select(`
              *,
              profiles!service_requests_provider_id_fkey(full_name, phone_number)
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

          if (requests) {
            setServiceRequests(requests);
            
            // Show notification for status changes
            if (payload.eventType === 'UPDATE' && payload.new) {
              const newStatus = (payload.new as any).status;
              toast.info(`Status updated to: ${getStatusLabel(newStatus)}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      accepted: 'bg-blue-600',
      denied: 'bg-red-500',
      en_route: 'bg-purple-500',
      in_progress: 'bg-indigo-500',
      completed: 'bg-green-600',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusPriority = (status: string) => {
    const priorities: Record<string, number> = {
      in_progress: 1,
      en_route: 2,
      accepted: 3,
      assigned: 4,
      pending: 5,
      completed: 6,
      denied: 7,
      cancelled: 8,
    };
    return priorities[status] || 9;
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = serviceRequests;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Sort by priority (active requests first, cancelled last)
    return [...filtered].sort((a, b) => {
      const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      // If same priority, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [serviceRequests, statusFilter]);

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-6 w-6" />;
    if (status === 'cancelled' || status === 'denied') return <AlertCircle className="h-6 w-6" />;
    if (status === 'en_route') return <Navigation className="h-6 w-6" />;
    return <Clock className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Track Your Rescue</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Enter your phone number to view all your service requests and track their status
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="w-full">
            <Card className="p-8 mb-8 max-w-2xl mx-auto">
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Search by Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g., 8142221617 or +233 814 222 1617"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    {user 
                      ? "Search for requests by phone number (including requests made without login)" 
                      : "Enter your phone number (with or without formatting)"
                    }
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Track My Requests'
                  )}
                </Button>
              </form>
            </Card>

            {user && loading && (
              <Card className="p-8 mb-8 text-center max-w-2xl mx-auto">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading your requests...</p>
              </Card>
            )}

            {searched && serviceRequests.length === 0 && (
              <Card className="p-8 text-center max-w-2xl mx-auto">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Service Requests Found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any service requests for this phone number.
                </p>
                <p className="text-sm text-muted-foreground">
                  Make sure you're using the same phone number you provided when requesting assistance.
                </p>
              </Card>
            )}

            {serviceRequests.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Your Service Requests</h2>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {filteredAndSortedRequests.length} of {serviceRequests.length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Requests</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="en_route">En Route</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    {/* Status Banner */}
                    <div className={`${getStatusColor(request.status)} text-white p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <h3 className="font-semibold text-lg">
                              {getStatusLabel(request.status)}
                            </h3>
                            <p className="text-sm opacity-90 capitalize">
                              {request.service_type.replace('_', ' ')} Service
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm opacity-90">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{request.location}</p>
                        </div>
                      </div>

                      {request.description && (
                        <div className="pl-8">
                          <p className="font-medium">Description</p>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                      )}

                      {/* Vehicle Information */}
                      {(request.vehicle_make || request.vehicle_model) && (
                        <div className="flex items-start gap-3">
                          <Car className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">Vehicle</p>
                            <p className="text-sm text-muted-foreground">
                              {request.vehicle_make} {request.vehicle_model}
                              {request.vehicle_year && ` (${request.vehicle_year})`}
                              {request.vehicle_plate && ` - ${request.vehicle_plate}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.profiles && (
                        <>
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium">Service Provider</p>
                              <p className="text-sm text-muted-foreground">{request.profiles.full_name}</p>
                            </div>
                          </div>

                          {request.profiles.phone_number && (
                            <div className="flex items-start gap-3">
                              <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">Provider Contact</p>
                                <a 
                                  href={`tel:${request.profiles.phone_number}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {request.profiles.phone_number}
                                </a>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Status Messages */}
                      {request.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-yellow-900">
                            ⏳ Your request is pending. We're finding the best provider for you.
                          </p>
                        </div>
                      )}

                      {request.status === 'assigned' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-blue-900">
                            👤 A provider has been assigned to your request!
                          </p>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-blue-900">
                            ✅ Provider has accepted your request and will contact you shortly.
                          </p>
                        </div>
                      )}

                      {request.status === 'en_route' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-purple-900">
                            🚗 <strong>Provider is on the way!</strong> Keep your phone nearby for any updates.
                          </p>
                        </div>
                      )}

                      {request.status === 'in_progress' && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-indigo-900">
                            🔧 <strong>Service in progress.</strong> The provider is working on your vehicle.
                          </p>
                        </div>
                      )}

                      {request.status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-green-900">
                            ✅ Service completed. Thank you for using our service!
                          </p>
                        </div>
                      )}

                      {request.status === 'denied' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-red-900">
                            ❌ Request was declined. Please contact support or submit a new request.
                          </p>
                        </div>
                      )}

                      {request.status === 'cancelled' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-gray-900">
                            🚫 This request has been cancelled.
                          </p>
                        </div>
                      )}
                    </div>

                      {/* Action Buttons */}
                      {['pending', 'assigned', 'accepted'].includes(request.status) && (
                        <div className="px-6 pb-4 border-t pt-4">
                          <Button 
                            variant="destructive"
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
                                  // Refresh the data
                                   const { data: requests } = await supabase
                                    .from('service_requests')
                                    .select(`
                                      *,
                                      profiles!service_requests_provider_id_fkey(full_name, phone_number)
                                    `)
                                    .eq('customer_id', user?.id)
                                    .order('created_at', { ascending: false });
                                  
                                  if (requests) setServiceRequests(requests);
                                }
                              }
                            }}
                            className="w-full"
                          >
                            Cancel Request
                          </Button>
                        </div>
                      )}

                      {/* Timestamps */}
                    <div className="px-6 pb-4 border-t pt-4 flex justify-between text-xs text-muted-foreground">
                      <span>Requested: {new Date(request.created_at).toLocaleString()}</span>
                      {request.completed_at && (
                        <span>Completed: {new Date(request.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </Card>
                ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrackRescue;
