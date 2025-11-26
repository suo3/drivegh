import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, User, Phone, Loader2, CheckCircle2, AlertCircle, Car, Navigation, Star, ArrowLeft, Share2, Route, Fuel, Bell, BellOff } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LiveTrackingMap } from '@/components/LiveTrackingMap';
import { useNotifications } from '@/hooks/useNotifications';
import { useSoundAlert } from '@/hooks/useSoundAlert';

const RequestDetails = () => {
  const { id, code } = useParams<{ id?: string; code?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string | null>(null);
  const [lastNotifiedDistance, setLastNotifiedDistance] = useState<number | null>(null);
  const [soundAlertPlayed, setSoundAlertPlayed] = useState(false);
  const { permission, requestPermission, sendNotification, isSupported } = useNotifications();
  const { playProximityAlert, playArrivalAlert } = useSoundAlert();

  const distance = useMemo(() => {
    if (!request?.customer_lat || !request?.customer_lng || !request?.provider_lat || !request?.provider_lng) {
      return null;
    }
    return calculateDistance(
      request.customer_lat,
      request.customer_lng,
      request.provider_lat,
      request.provider_lng
    );
  }, [request?.customer_lat, request?.customer_lng, request?.provider_lat, request?.provider_lng]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      const identifier = code || id;
      if (!identifier) return;
      
      setLoading(true);
      try {
        // Try to fetch by tracking code first, then by ID
        const query = supabase
          .from('service_requests')
          .select(`
            *,
            profiles!service_requests_provider_id_fkey(full_name, phone_number)
          `);
        
        // If identifier looks like a UUID, search by ID, otherwise by tracking code
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        const requestRes = isUUID 
          ? await query.eq('id', identifier).maybeSingle()
          : await query.eq('tracking_code', identifier.toUpperCase()).maybeSingle();
        
        const ratingsRes = await supabase.from('ratings').select('*');

        if (requestRes.error) throw requestRes.error;
        
        if (!requestRes.data) {
          toast.error('Service request not found');
          navigate('/track-rescue');
          return;
        }

        setRequest(requestRes.data);
        setRatings(ratingsRes.data || []);

        // Auto-open rating dialog for completed requests without rating
        const hasRating = ratingsRes.data?.some(r => r.service_request_id === requestRes.data.id);
        if (requestRes.data.status === 'completed' && 
            user && 
            requestRes.data.customer_id === user.id && 
            !hasRating) {
          setTimeout(() => setRatingDialogOpen(true), 500);
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, code, navigate, user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!request?.id) return;

    const channel = supabase
      .channel(`service_request_${request.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${request.id}`
        },
        async (payload) => {
          console.log('Real-time update:', payload);
          
          // Refresh the request data
          const { data } = await supabase
            .from('service_requests')
            .select(`
              *,
              profiles!service_requests_provider_id_fkey(full_name, phone_number)
            `)
            .eq('id', request.id)
            .maybeSingle();

          if (data) {
            setRequest(data);
            
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
  }, [request?.id]);

  // Send status change notifications
  useEffect(() => {
    if (!request || permission !== 'granted') return;
    
    if (lastNotifiedStatus && lastNotifiedStatus !== request.status) {
      const statusMessages: Record<string, { title: string; body: string }> = {
        assigned: {
          title: 'Provider Assigned! 👨‍🔧',
          body: 'A provider has been assigned to your request.',
        },
        accepted: {
          title: 'Request Accepted! ✅',
          body: 'The provider has accepted your service request.',
        },
        en_route: {
          title: 'Provider On The Way! 🚗',
          body: 'Your provider is now heading to your location.',
        },
        in_progress: {
          title: 'Service Started! 🔧',
          body: 'The provider has started working on your vehicle.',
        },
        completed: {
          title: 'Service Completed! ✨',
          body: 'Your service has been completed successfully.',
        },
        cancelled: {
          title: 'Request Cancelled ❌',
          body: 'Your service request has been cancelled.',
        },
      };

      const message = statusMessages[request.status];
      if (message) {
        sendNotification(message.title, {
          body: message.body,
          tag: 'status-update',
          requireInteraction: request.status === 'completed' || request.status === 'cancelled',
        });
      }
    }
    
    setLastNotifiedStatus(request.status);
  }, [request?.status, permission, sendNotification, lastNotifiedStatus]);

  // Send proximity notifications and sound alerts based on distance changes
  useEffect(() => {
    if (!distance) return;
    
    // Play sound alert when provider is within 500m (0.5km)
    if (distance <= 0.5 && !soundAlertPlayed && request?.status === 'en_route') {
      playProximityAlert();
      setSoundAlertPlayed(true);
      
      if (permission === 'granted') {
        sendNotification('Provider Very Close! 📍', {
          body: `Your provider is only ${formatDistance(distance)} away!`,
          tag: 'proximity-alert-close',
          requireInteraction: true,
        });
      }
    }
    
    // Regular notification when provider is within 2km and getting closer
    if (
      permission === 'granted' &&
      distance <= 2 &&
      (lastNotifiedDistance === null || distance < lastNotifiedDistance - 0.5)
    ) {
      const distanceText = formatDistance(distance);
      sendNotification('Provider Approaching! 🚗', {
        body: `Your provider is now ${distanceText} away and approaching your location.`,
        tag: 'proximity-alert',
        requireInteraction: false,
      });
      setLastNotifiedDistance(distance);
    }
  }, [distance, permission, sendNotification, lastNotifiedDistance, soundAlertPlayed, playProximityAlert, request?.status]);

  // Reset sound alert flag when provider moves away or status changes
  useEffect(() => {
    if (!distance || distance > 0.5 || request?.status === 'in_progress') {
      setSoundAlertPlayed(false);
    }
  }, [distance, request?.status]);

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

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-8 w-8" />;
    if (status === 'cancelled' || status === 'denied') return <AlertCircle className="h-8 w-8" />;
    if (status === 'en_route') return <Navigation className="h-8 w-8" />;
    return <Clock className="h-8 w-8" />;
  };

  const getProviderRating = (providerId: string) => {
    const providerRatings = ratings.filter(r => r.provider_id === providerId);
    if (providerRatings.length === 0) return null;
    const avgRating = providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length;
    return { avgRating: avgRating.toFixed(1), count: providerRatings.length };
  };

  const getRequestRating = () => {
    return ratings.find(r => r.service_request_id === request?.id);
  };

  const handleSubmitRating = async () => {
    if (!request || currentRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const existingRating = getRequestRating();
      
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
            service_request_id: request.id,
            provider_id: request.provider_id,
            customer_id: user?.id || request.customer_id,
            rating: currentRating,
            review: reviewText,
          });

        if (error) throw error;
        toast.success('Rating submitted successfully');
      }

      // Refresh ratings
      const { data: newRatings } = await supabase.from('ratings').select('*');
      setRatings(newRatings || []);
      
      setRatingDialogOpen(false);
      setCurrentRating(0);
      setReviewText('');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const handleCancelRequest = async () => {
    if (!request) return;
    
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
        const { data } = await supabase
          .from('service_requests')
          .select(`
            *,
            profiles!service_requests_provider_id_fkey(full_name, phone_number)
          `)
          .eq('id', request.id)
          .maybeSingle();
        
        if (data) setRequest(data);
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Service Request Details',
          text: `Track my ${request?.service_type} service request`,
          url: url,
        });
        toast.success('Link shared successfully');
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading request details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The service request you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/track-rescue">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracking
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/track-rescue')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-4xl font-bold">Service Request Details</h1>
          </div>
          <p className="text-xl text-gray-200 ml-14">
            Tracking Code: <span className="font-mono font-bold">{request.tracking_code}</span>
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="overflow-hidden">
            {/* Status Banner */}
            <div className={`${getStatusColor(request.status)} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <h2 className="font-bold text-2xl">
                      {getStatusLabel(request.status)}
                    </h2>
                    <p className="text-lg opacity-90 capitalize mt-1">
                      {request.service_type.replace('_', ' ')} Service
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isSupported && (
                    <Button
                      onClick={requestPermission}
                      variant={permission === 'granted' ? 'secondary' : 'secondary'}
                      disabled={permission === 'granted'}
                      size="sm"
                      className="gap-2"
                    >
                      {permission === 'granted' ? (
                        <>
                          <Bell className="h-4 w-4" />
                          Notifications On
                        </>
                      ) : (
                        <>
                          <BellOff className="h-4 w-4" />
                          Enable Alerts
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-lg">Location</p>
                  <p className="text-muted-foreground">{request.location}</p>
                </div>
              </div>


              {request.description && (
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Description</p>
                    <p className="text-muted-foreground">{request.description}</p>
                  </div>
                </div>
              )}

              {/* Vehicle Information */}
              {(request.vehicle_make || request.vehicle_model) && (
                <div className="flex items-start gap-4">
                  <Car className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Vehicle Information</p>
                    <p className="text-muted-foreground">
                      {request.vehicle_make} {request.vehicle_model}
                      {request.vehicle_year && ` (${request.vehicle_year})`}
                    </p>
                    {request.vehicle_plate && (
                      <p className="text-muted-foreground mt-1">
                        Plate: {request.vehicle_plate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Fuel Details - Only for fuel_delivery */}
              {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                <div className="flex items-start gap-4">
                  <Fuel className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Fuel Details</p>
                    <div className="flex gap-3 mt-1">
                      {request.fuel_type && (
                        <span className="capitalize text-muted-foreground text-lg">{request.fuel_type}</span>
                      )}
                      {request.fuel_amount && (
                        <span className="text-muted-foreground text-lg">{request.fuel_amount} Liters</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.profiles && (
                <>
                  <div className="flex items-start gap-4">
                    <User className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-lg">Service Provider</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-lg">{request.profiles.full_name}</p>
                        {request.provider_id && getProviderRating(request.provider_id) && (
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-semibold">
                              {getProviderRating(request.provider_id)?.avgRating}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({getProviderRating(request.provider_id)?.count} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      {distance !== null && (request.status === 'accepted' || request.status === 'en_route') && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                          <Route className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {formatDistance(distance)} away
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {request.profiles.phone_number && (
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Provider Contact</p>
                        <a 
                          href={`tel:${request.profiles.phone_number}`}
                          className="text-primary hover:underline text-lg"
                        >
                          {request.profiles.phone_number}
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Status Timeline */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">Status Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Requested:</span>
                    <span className="text-muted-foreground">{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                  {request.assigned_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Assigned:</span>
                      <span className="text-muted-foreground">{new Date(request.assigned_at).toLocaleString()}</span>
                    </div>
                  )}
                  {request.completed_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Completed:</span>
                      <span className="text-muted-foreground">{new Date(request.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {request.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    ⏳ Your request is pending. We're finding the best provider for you.
                  </p>
                </div>
              )}

              {request.status === 'assigned' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    👤 A provider has been assigned to your request!
                  </p>
                </div>
              )}

              {request.status === 'accepted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ✅ Provider has accepted your request and will contact you shortly.
                  </p>
                </div>
              )}

              {request.status === 'en_route' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-900">
                    🚗 <strong>Provider is on the way!</strong> Keep your phone nearby for any updates.
                  </p>
                </div>
              )}

              {request.status === 'in_progress' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-900">
                    🔧 <strong>Service in progress.</strong> The provider is working on your vehicle.
                  </p>
                </div>
              )}

              {request.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    ✅ Service completed. Thank you for using our service!
                  </p>
                  {getRequestRating() && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-2">Your Rating:</p>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= getRequestRating()!.rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {getRequestRating()!.review && (
                        <p className="text-sm text-green-700 italic">
                          "{getRequestRating()!.review}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Distance Indicator */}
              {(request.status === 'en_route' || request.status === 'in_progress') && 
               distance !== null && request.provider_lat && request.provider_lng && (
                <div className="border-t pt-6">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/20 p-4 rounded-full">
                          <Route className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Distance to You</p>
                          <p className="text-3xl font-bold text-primary">{formatDistance(distance)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium">Provider Status</p>
                        <Badge variant="secondary" className="text-lg mt-1 capitalize">
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Location updating in real-time</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Tracking Map */}
              {(request.status === 'en_route' || request.status === 'in_progress') && 
               request.customer_lat && request.customer_lng && (
                <div className={distance === null || !request.provider_lat || !request.provider_lng ? "border-t pt-6" : ""}>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Live Tracking
                  </h3>
                  <div className="rounded-lg overflow-hidden border-2 border-primary/20">
                    <LiveTrackingMap
                      customerLat={request.customer_lat}
                      customerLng={request.customer_lng}
                      providerLat={request.provider_lat}
                      providerLng={request.provider_lng}
                      customerName="You"
                      providerName={request.profiles?.full_name || 'Provider'}
                      showETA={true}
                    />
                  </div>
                </div>
              )}

              {request.status === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900">
                    ❌ Request was declined. Please contact support or submit a new request.
                  </p>
                </div>
              )}

              {request.status === 'cancelled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900">
                    🚫 This request has been cancelled.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {['pending', 'assigned', 'accepted'].includes(request.status) && (
                  <Button 
                    variant="destructive"
                    onClick={handleCancelRequest}
                    className="flex-1"
                  >
                    Cancel Request
                  </Button>
                )}

                {request.status === 'completed' && user && request.customer_id === user.id && (
                  <Button
                    variant={getRequestRating() ? "outline" : "default"}
                    onClick={() => {
                      const existingRating = getRequestRating();
                      if (existingRating) {
                        setCurrentRating(existingRating.rating);
                        setReviewText(existingRating.review || '');
                      }
                      setRatingDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {getRequestRating() ? 'Update Rating' : 'Rate Service'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRatingDialogOpen(false);
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
              onClick={handleSubmitRating}
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

export default RequestDetails;
