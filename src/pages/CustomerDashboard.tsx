import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, User, Phone, RefreshCw, TrendingUp, CheckCircle2, Fuel, Eye, CreditCard, Calculator, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LiveTrackingMap } from '@/components/LiveTrackingMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import ServiceConfirmation from '@/components/ServiceConfirmation';

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequestForTracking, setSelectedRequestForTracking] = useState<any | null>(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<any | null>(null);
  const [confirmationRequest, setConfirmationRequest] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('customer_service_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${user.id}`
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

  // Auto-open tracking for active requests
  useEffect(() => {
    const activeRequest = requests.find(r => 
      (r.status === 'en_route' || r.status === 'in_progress') && 
      r.provider_lat && 
      r.provider_lng
    );
    if (activeRequest && !selectedRequestForTracking) {
      setSelectedRequestForTracking(activeRequest);
    }
  }, [requests]);

  const fetchData = async () => {
    setLoading(true);
    const [requestsData, transactionsData, profileData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_provider_id_fkey(full_name, phone_number)')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, service_requests!inner(service_type, status, customer_id)')
        .eq('service_requests.customer_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single(),
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (transactionsData.data) setTransactions(transactionsData.data);
    if (profileData.data) setProfile(profileData.data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/90 text-warning-foreground',
      assigned: 'bg-blue-500/90 text-white',
      quoted: 'bg-indigo-500/90 text-white',
      awaiting_payment: 'bg-orange-500/90 text-white',
      paid: 'bg-teal-500/90 text-white',
      en_route: 'bg-purple-500/90 text-white',
      accepted: 'bg-blue-600/90 text-white',
      in_progress: 'bg-purple-600/90 text-white',
      awaiting_confirmation: 'bg-amber-500/90 text-white',
      completed: 'bg-success/90 text-success-foreground',
      cancelled: 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white pt-32 pb-20">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Customer Portal</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Manage your service requests and track your rescue team in real-time
              </p>
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
      </section>

      <section className="py-20 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-muted-foreground">Total Requests</h3>
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{requests.length}</p>
                  <p className="text-sm text-muted-foreground mt-2">All time</p>
                </div>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-warning/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-muted-foreground">Pending</h3>
                    <div className="p-3 rounded-xl bg-warning/10 group-hover:bg-warning/20 transition-colors">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Awaiting assignment</p>
                </div>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-success/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-muted-foreground">Completed</h3>
                    <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Successfully resolved</p>
                </div>
              </Card>
            </div>

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-primary" />
                      My Service Requests
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Track your roadside assistance requests</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm" className="hover:bg-primary/10">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button onClick={() => navigate('/')} size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                      New Request
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No service requests yet</p>
                    <Button onClick={() => navigate('/')}>
                      Request Service Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <Card key={request.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-bold text-xl capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                  {request.service_type.replace('_', ' ')}
                                </h3>
                                 <Badge className={`${getStatusColor(request.status)} shadow-sm`}>
                                   {getStatusLabel(request.status)}
                                 </Badge>
                                 {(request.status === 'en_route' || request.status === 'in_progress') && 
                                  request.customer_lat && request.customer_lng && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => setSelectedRequestForTracking(request)}
                                     className="ml-2"
                                   >
                                     <MapPin className="h-4 w-4 mr-1" />
                                     Track Live
                                   </Button>
                                 )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{request.location}</span>
                                </div>
                                 {request.description && (
                                  <p className="text-muted-foreground">{request.description}</p>
                                )}
                                {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                                  <div className="flex items-center gap-4 text-muted-foreground bg-amber-50 p-2 rounded">
                                    <Fuel className="h-4 w-4 text-amber-600" />
                                    {request.fuel_type && <span className="capitalize">{request.fuel_type}</span>}
                                    {request.fuel_amount && <span>{request.fuel_amount} Liters</span>}
                                  </div>
                                )}
                                {request.profiles && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>Provider: {request.profiles.full_name}</span>
                                    {request.profiles.phone_number && (
                                      <>
                                        <Phone className="h-4 w-4 ml-2" />
                                        <span>{request.profiles.phone_number}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Payment Status Indicators */}
                          {request.quoted_amount && (
                            <div className="mb-4 p-3 rounded-lg bg-muted/30 border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">Quote: GHS {Number(request.quoted_amount).toFixed(2)}</span>
                                </div>
                                {request.payment_status === 'paid' && (
                                  <Badge className="bg-green-500/90 text-white">Paid</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action buttons based on status */}
                          {(request.status === 'quoted' || request.status === 'awaiting_payment') && (
                            <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-primary" />
                                  <span className="text-sm">
                                    {request.status === 'quoted' 
                                      ? 'Review and approve quote to proceed' 
                                      : 'Complete payment to start service'}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/track/${request.tracking_code}`)}
                                >
                                  {request.status === 'quoted' ? 'Review Quote' : 'Pay Now'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Customer confirmation prompt */}
                          {request.status === 'awaiting_confirmation' && !request.customer_confirmed_at && (
                            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm text-amber-800">
                                    Service marked complete - please confirm
                                  </span>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => setConfirmationRequest(request)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirm & Release Payment
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedRequestForDetails(request)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {request.status === 'completed' && !request.rating && (
                                <Button size="sm" variant="outline">
                                  Rate Service
                                </Button>
                              )}
                            </div>
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
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription className="text-base mt-1">Your payment history</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="group border-2 rounded-xl p-5 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              GHS {transaction.amount}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize font-medium">
                              {transaction.service_requests?.service_type?.replace('_', ' ')}
                            </p>
                            {transaction.reference_number && (
                              <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                                Ref: {transaction.reference_number}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={transaction.confirmed_at ? 'default' : 'secondary'}
                            className="shadow-sm"
                          >
                            {transaction.confirmed_at ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Tracking Dialog */}
      <Dialog open={!!selectedRequestForTracking} onOpenChange={(open) => !open && setSelectedRequestForTracking(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Live Tracking - {selectedRequestForTracking?.service_type?.replace('_', ' ').toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selectedRequestForTracking && selectedRequestForTracking.customer_lat && selectedRequestForTracking.customer_lng && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Provider</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequestForTracking.profiles?.full_name || 'Assigned Provider'}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedRequestForTracking.status)}>
                  {getStatusLabel(selectedRequestForTracking.status)}
                </Badge>
              </div>
              <LiveTrackingMap
                customerLat={selectedRequestForTracking.customer_lat}
                customerLng={selectedRequestForTracking.customer_lng}
                providerLat={selectedRequestForTracking.provider_lat}
                providerLng={selectedRequestForTracking.provider_lng}
                customerName={profile?.full_name || 'You'}
                providerName={selectedRequestForTracking.profiles?.full_name || 'Provider'}
                showETA={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RequestDetailsModal
        request={selectedRequestForDetails}
        open={!!selectedRequestForDetails}
        onOpenChange={(open) => !open && setSelectedRequestForDetails(null)}
      />

      <ServiceConfirmation
        request={confirmationRequest}
        open={!!confirmationRequest}
        onOpenChange={(open) => !open && setConfirmationRequest(null)}
        onConfirmed={() => {
          fetchData();
          setConfirmationRequest(null);
        }}
        userType="customer"
      />

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
