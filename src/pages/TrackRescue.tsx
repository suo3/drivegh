import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, User, Phone, Loader2, CheckCircle2, AlertCircle, Car, Navigation, Filter, Star } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

const TrackRescue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
 
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
      // Normalize input
      const normalizedDigits = digitsOnly(phoneNumber);
      const inputLast10 = lastN(phoneNumber, 10);
      const inputLast9 = lastN(phoneNumber, 9);
      console.log('Searching for phone:', { normalizedDigits, inputLast10, inputLast9 });

      // 1) Load profiles and find any user IDs whose phone matches the input (so logged-in-created requests are discoverable when logged out)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone_number')
        .not('phone_number', 'is', null);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        throw profileError;
      }

      const matchingProfileIds = new Set<string>();
      profiles?.forEach((p) => {
        if (phonesMatch(p.phone_number || '', phoneNumber)) matchingProfileIds.add(p.id);
      });
      console.log('Matching profile IDs:', Array.from(matchingProfileIds));

      // 2) Fetch candidate requests and ratings in parallel
      const [guestReqRes, profileReqRes, ratingsRes] = await Promise.all([
        // Guest requests (created without login): they have a phone_number saved
        supabase
          .from('service_requests')
          .select(`
            *,
            profiles!service_requests_provider_id_fkey(full_name, phone_number)
          `)
          .not('phone_number', 'is', null)
          .order('created_at', { ascending: false }),
        // Requests created while logged in: match by customer_id derived from profile phone
        matchingProfileIds.size
          ? supabase
              .from('service_requests')
              .select(`
                *,
                profiles!service_requests_provider_id_fkey(full_name, phone_number)
              `)
              .in('customer_id', Array.from(matchingProfileIds))
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        // Fetch ratings
        supabase.from('ratings').select('*')
      ]);

      if (guestReqRes.error) throw guestReqRes.error;
      if ((profileReqRes as any).error) throw (profileReqRes as any).error;

      // Store ratings
      setRatings(ratingsRes.data || []);

      // 3) Filter guest requests by robust phone matcher
      const guestMatches = (guestReqRes.data || []).filter((r: any) =>
        r.phone_number ? phonesMatch(r.phone_number, phoneNumber) : false
      );

      const profileMatches = (profileReqRes as any).data || [];

      // 4) Merge and dedupe
      const byId = new Map<string, any>();
      [...guestMatches, ...profileMatches].forEach((r: any) => byId.set(r.id, r));
      const results = Array.from(byId.values());

      console.log('Found matches:', {
        guestMatches: guestMatches.length,
        profileMatches: profileMatches.length,
        total: results.length,
      });

      if (results.length === 0) {
        toast.error('No service requests found for this phone number');
      } else {
        toast.success(`Found ${results.length} service request(s)`);
      }

      setServiceRequests(results);
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
        const [requestsRes, ratingsRes] = await Promise.all([
          supabase
            .from('service_requests')
            .select(`
              *,
              profiles!service_requests_provider_id_fkey(full_name, phone_number)
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false }),
          supabase.from('ratings').select('*')
        ]);

        if (requestsRes.error) throw requestsRes.error;

        setServiceRequests(requestsRes.data || []);
        setRatings(ratingsRes.data || []);
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
          const [requestsRes, ratingsRes] = await Promise.all([
            supabase
              .from('service_requests')
              .select(`
                *,
                profiles!service_requests_provider_id_fkey(full_name, phone_number)
              `)
              .eq('customer_id', user.id)
              .order('created_at', { ascending: false }),
            supabase.from('ratings').select('*')
          ]);

          if (requestsRes.data) {
            setServiceRequests(requestsRes.data);
            setRatings(ratingsRes.data || []);
            
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

  const getProviderRating = (providerId: string) => {
    const providerRatings = ratings.filter(r => r.provider_id === providerId);
    if (providerRatings.length === 0) return null;
    const avgRating = providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length;
    return { avgRating: avgRating.toFixed(1), count: providerRatings.length };
  };

  const getRequestRating = (requestId: string) => {
    return ratings.find(r => r.service_request_id === requestId);
  };

  const handleSubmitRating = async (requestId: string, providerId: string, customerId: string) => {
    if (currentRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const existingRating = getRequestRating(requestId);
      
      if (existingRating) {
        const { error } = await supabase
          .from('ratings')
          .update({
            rating: currentRating,
            review: reviewText,
          })
          .eq('id', existingRating.id);

        if (error) throw error;
        toast.success('Rating updated successfully');
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert({
            service_request_id: requestId,
            provider_id: providerId,
            customer_id: customerId,
            rating: currentRating,
            review: reviewText,
          });

        if (error) throw error;
        toast.success('Rating submitted successfully');
      }

      // Refresh ratings
      const { data: newRatings } = await supabase.from('ratings').select('*');
      setRatings(newRatings || []);
      
      setRatingDialogOpen(null);
      setCurrentRating(0);
      setReviewText('');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      
      {/* Compact Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Track Your Rescue</h1>
          <p className="text-white/80 text-sm">Real-time updates on your service requests</p>
        </div>
      </section>

      <section className="py-12 lg:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative">
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 lg:px-6 relative">
          <div className="w-full">
            {serviceRequests.length === 0 && (
              <Card className="p-6 lg:p-12 mb-8 lg:mb-12 max-w-2xl mx-auto shadow-2xl border-2 hover-lift animate-scale-in bg-gradient-to-br from-white to-gray-50/50">
                <div className="text-center mb-6 lg:mb-8">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-4 lg:mb-6">
                    <Navigation className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 lg:mb-3">Find Your Requests</h2>
                  <p className="text-muted-foreground text-sm lg:text-lg">
                    {user 
                      ? "Search for requests by phone number" 
                      : "Enter your phone number to track all your service requests"
                    }
                  </p>
                </div>
                
                <form onSubmit={handleTrack} className="space-y-4 lg:space-y-6">
                  <div className="space-y-2 lg:space-y-3">
                    <Label htmlFor="phoneNumber" className="text-sm lg:text-base font-semibold">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g., 024 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 lg:h-14 text-base lg:text-lg"
                    />
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      Enter your phone number with or without formatting
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold text-base lg:text-lg h-12 lg:h-14" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 lg:h-6 lg:w-6 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                        Track My Requests
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            )}

            {user && loading && (
              <Card className="p-8 lg:p-16 mb-8 lg:mb-12 text-center max-w-2xl mx-auto shadow-xl animate-scale-in">
                <Loader2 className="h-12 w-12 lg:h-16 lg:w-16 animate-spin mx-auto mb-4 lg:mb-6 text-primary" />
                <p className="text-muted-foreground text-sm lg:text-lg">Loading your requests...</p>
              </Card>
            )}

            {searched && serviceRequests.length === 0 && (
              <Card className="p-8 lg:p-16 text-center max-w-2xl mx-auto shadow-xl border-2 animate-scale-in">
                <div className="bg-muted rounded-full w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <AlertCircle className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3">No Service Requests Found</h3>
                <p className="text-muted-foreground text-sm lg:text-lg mb-3 lg:mb-4">
                  We couldn't find any service requests for this phone number.
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground mb-4 lg:mb-6">
                  Make sure you're using the same phone number you provided when requesting assistance.
                </p>
                <Button 
                  onClick={() => navigate('/get-help')}
                  className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold"
                >
                  Request New Service
                </Button>
              </Card>
            )}

            {serviceRequests.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-10 animate-fade-in">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="bg-primary/10 rounded-xl lg:rounded-2xl p-2.5 lg:p-4">
                      <Car className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-3xl font-bold">Your Service Requests</h2>
                      <p className="text-xs lg:text-base text-muted-foreground">
                        Showing {filteredAndSortedRequests.length} of {serviceRequests.length} requests
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 lg:gap-3 glass-dark p-2 lg:p-3 rounded-xl w-full sm:w-auto">
                    <Filter className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] border-0 bg-transparent focus:ring-0 text-sm lg:text-base">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredAndSortedRequests.map((request, index) => (
                  <Card 
                    key={request.id} 
                    className="overflow-hidden cursor-pointer hover-lift transition-all border-2 hover:border-primary/30 animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/track/${request.tracking_code || request.id}`)}
                  >
                    {/* Status Banner - Enhanced gradient */}
                    <div className={`${getStatusColor(request.status)} text-white p-4 lg:p-6 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3">
                            {getStatusIcon(request.status)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg lg:text-xl">
                              {getStatusLabel(request.status)}
                            </h3>
                            <p className="text-xs lg:text-sm opacity-90 capitalize mt-0.5 lg:mt-1">
                              {request.service_type.replace('_', ' ')} Service
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs lg:text-sm opacity-90 mt-2 lg:mt-3 text-right">
                        {new Date(request.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Request Details - Enhanced spacing and icons */}
                    <div className="p-4 lg:p-6 space-y-3 lg:space-y-5">
                      <div className="flex items-start gap-3 lg:gap-4">
                        <div className="bg-primary/10 rounded-lg lg:rounded-xl p-2 lg:p-2.5 mt-0.5 flex-shrink-0">
                          <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold mb-0.5 lg:mb-1 text-sm lg:text-base">Location</p>
                          <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{request.location}</p>
                        </div>
                      </div>

                      {request.description && (
                        <div className="flex items-start gap-3 lg:gap-4">
                          <div className="bg-primary/10 rounded-lg lg:rounded-xl p-2 lg:p-2.5 mt-0.5 flex-shrink-0">
                            <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold mb-0.5 lg:mb-1 text-sm lg:text-base">Description</p>
                            <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{request.description}</p>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Information - Hidden on mobile */}
                      {(request.vehicle_make || request.vehicle_model) && (
                        <div className="hidden lg:flex items-start gap-4">
                          <div className="bg-primary/10 rounded-xl p-2.5 mt-0.5 flex-shrink-0">
                            <Car className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold mb-1">Vehicle</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {request.vehicle_make} {request.vehicle_model}
                              {request.vehicle_year && ` (${request.vehicle_year})`}
                              {request.vehicle_plate && ` - ${request.vehicle_plate}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.profiles && (
                        <>
                          <div className="flex items-start gap-3 lg:gap-4">
                            <div className="bg-primary/10 rounded-lg lg:rounded-xl p-2 lg:p-2.5 mt-0.5 flex-shrink-0">
                              <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-0.5 lg:mb-1 text-sm lg:text-base">Service Provider</p>
                              <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                <p className="text-xs lg:text-sm text-muted-foreground">{request.profiles.full_name}</p>
                                {request.provider_id && getProviderRating(request.provider_id) && (
                                  <div className="flex items-center gap-0.5 lg:gap-1 bg-yellow-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md">
                                    <Star className="h-3 w-3 lg:h-3.5 lg:w-3.5 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-bold text-yellow-900">
                                      {getProviderRating(request.provider_id)?.avgRating}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({getProviderRating(request.provider_id)?.count})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {request.profiles.phone_number && (
                            <div className="flex items-start gap-3 lg:gap-4">
                              <div className="bg-primary/10 rounded-lg lg:rounded-xl p-2 lg:p-2.5 mt-0.5 flex-shrink-0">
                                <Phone className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-0.5 lg:mb-1 text-sm lg:text-base">Provider Contact</p>
                                <a 
                                  href={`tel:${request.profiles.phone_number}`}
                                  className="text-xs lg:text-sm text-primary hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-yellow-900">
                            ⏳ Your request is pending. We're finding the best provider for you.
                          </p>
                        </div>
                      )}

                      {request.status === 'assigned' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-blue-900">
                            👤 A provider has been assigned to your request!
                          </p>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-blue-900">
                            ✅ Provider has accepted your request and will contact you shortly.
                          </p>
                        </div>
                      )}

                      {request.status === 'en_route' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-purple-900">
                            🚗 <strong>Provider is on the way!</strong> Keep your phone nearby for any updates.
                          </p>
                        </div>
                      )}

                      {request.status === 'in_progress' && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-indigo-900">
                            🔧 <strong>Service in progress.</strong> The provider is working on your vehicle.
                          </p>
                        </div>
                      )}

                      {request.status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-green-900">
                            ✅ Service completed. Thank you for using our service!
                          </p>
                          {getRequestRating(request.id) && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <p className="text-xs font-medium text-green-900 mb-1">Your Rating:</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${
                                      star <= getRequestRating(request.id)!.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                {getRequestRating(request.id)!.review && (
                                  <span className="text-xs text-green-700 ml-2 line-clamp-1">
                                    "{getRequestRating(request.id)!.review}"
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {request.status === 'denied' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-red-900">
                            ❌ Request was declined. Please contact support or submit a new request.
                          </p>
                        </div>
                      )}

                      {request.status === 'cancelled' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                          <p className="text-xs lg:text-sm text-gray-900">
                            🚫 This request has been cancelled.
                          </p>
                        </div>
                      )}
                    </div>

                      {/* Action Buttons - Enhanced */}
                      {['pending', 'assigned', 'accepted'].includes(request.status) && (
                        <div className="px-6 pb-6 border-t pt-6">
                          <Button 
                            variant="destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
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
                            className="w-full font-semibold"
                          >
                            Cancel Request
                          </Button>
                        </div>
                      )}

                      {/* Rate Service Button - Enhanced */}
                      {request.status === 'completed' && user && request.customer_id === user.id && (
                        <div className="px-6 pb-6 border-t pt-6">
                          <Button
                            variant={getRequestRating(request.id) ? "outline" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              const existingRating = getRequestRating(request.id);
                              if (existingRating) {
                                setCurrentRating(existingRating.rating);
                                setReviewText(existingRating.review || '');
                              }
                              setRatingDialogOpen(request.id);
                            }}
                            className="w-full font-semibold gap-2"
                          >
                            <Star className="h-4 w-4" />
                            {getRequestRating(request.id) ? 'Update Rating' : 'Rate Service'}
                          </Button>
                        </div>
                      )}

                      {/* Timestamps - Enhanced - Hidden on mobile */}
                    <div className="hidden lg:flex px-6 pb-4 border-t pt-4 flex-col gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Requested: {new Date(request.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      {request.completed_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed: {new Date(request.completed_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
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

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen !== null} onOpenChange={(open) => {
        if (!open) {
          setRatingDialogOpen(null);
          setCurrentRating(0);
          setHoverRating(0);
          setReviewText('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Service</DialogTitle>
            <DialogDescription>
              How was your experience with the service provider?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCurrentRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || currentRating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="review">Review (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={() => {
                const request = serviceRequests.find(r => r.id === ratingDialogOpen);
                if (request && user) {
                  handleSubmitRating(request.id, request.provider_id, user.id);
                }
              }}
              className="w-full"
              disabled={currentRating === 0}
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackRescue;
