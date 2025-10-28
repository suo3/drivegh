import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, User, Phone, Loader2, CheckCircle2, AlertCircle, Car, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const TrackRescue = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);

    try {
      // First, find the user by phone number
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phoneNumber)
        .limit(1);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast.error('No service requests found for this phone number');
        setServiceRequests([]);
        setSearched(true);
        setLoading(false);
        return;
      }

      const foundUserId = profiles[0].id;
      setUserId(foundUserId);

      // Fetch service requests for this user
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          profiles!service_requests_provider_id_fkey(full_name, phone_number)
        `)
        .eq('customer_id', foundUserId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setServiceRequests(requests || []);
      setSearched(true);

      if (!requests || requests.length === 0) {
        toast.info('No service requests found');
      } else {
        toast.success(`Found ${requests.length} service request(s)`);
      }
    } catch (error: any) {
      console.error('Error tracking rescue:', error);
      toast.error('Failed to track rescue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('service_requests_tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${userId}`
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
            .eq('customer_id', userId)
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
  }, [userId]);

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

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Enter Your Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g., +233 24 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the phone number you used when requesting assistance
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

            {searched && serviceRequests.length === 0 && (
              <Card className="p-8 text-center">
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your Service Requests</h2>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {serviceRequests.length} {serviceRequests.length === 1 ? 'Request' : 'Requests'}
                  </Badge>
                </div>

                {serviceRequests.map((request) => (
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
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrackRescue;
