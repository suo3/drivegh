import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, DollarSign, TrendingUp, Briefcase, MapPin, User, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

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
          event: '*',
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
    const [requestsData, earningsData, ratingsData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_customer_id_fkey(full_name, phone_number)')
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
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (earningsData.data) setEarnings(earningsData.data);
    if (ratingsData.data) {
      setRatings(ratingsData.data);
      const avg = ratingsData.data.reduce((acc, r) => acc + r.rating, 0) / ratingsData.data.length;
      setAverageRating(avg || 0);
    }
    setLoading(false);
  };

  const updateStatus = async (requestId: string, status: 'pending' | 'assigned' | 'accepted' | 'denied' | 'en_route' | 'in_progress' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated successfully');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary animate-scale-in" />
      </div>
    );
  }

  const totalEarnings = earnings.reduce((acc, t) => acc + parseFloat(t.provider_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm border border-primary/10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Provider Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your jobs and earnings</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="hover-scale">Sign Out</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
                <div className="p-2 rounded-lg bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                GHS {totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Your total income
              </p>
            </CardContent>
          </Card>
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-yellow-500/10 via-background to-background border-yellow-500/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Based on {ratings.length} reviews</p>
            </CardContent>
          </Card>
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{requests.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Completed & active jobs</p>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-sm bg-card/50 border-primary/10 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Assigned Jobs</CardTitle>
                <CardDescription>Manage your service requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No jobs assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-lg capitalize">{request.service_type.replace('_', ' ')}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {request.location}
                              </div>
                            </div>
                          </div>
                          {request.profiles && (
                            <div className="ml-12 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Customer:</span> {request.profiles.full_name}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Phone:</span> {request.profiles.phone_number}
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge className="capitalize">{request.status.replace('_', ' ')}</Badge>
                      </div>
                      
                      <div className="ml-12 mb-4 p-3 rounded-lg bg-muted/30">
                        <p className="text-sm">{request.description}</p>
                      </div>

                      <div className="ml-12 flex gap-2">
                        {request.status === 'assigned' && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(request.id, 'accepted')} className="hover-scale">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectRequest(request.id)} className="hover-scale">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <Button size="sm" onClick={() => updateStatus(request.id, 'en_route')} className="hover-scale">
                            Mark En Route
                          </Button>
                        )}
                        {request.status === 'en_route' && (
                          <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')} className="hover-scale">
                            Start Service
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/50 border-primary/10 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Payment History</CardTitle>
                <CardDescription>Your earnings and transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No payments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.map((transaction) => (
                  <Card key={transaction.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">GHS {Number(transaction.provider_amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.provider_percentage}% of GHS {Number(transaction.amount).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(transaction.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={transaction.confirmed_at ? 'default' : 'secondary'} className="capitalize">
                        {transaction.confirmed_at ? 'Paid' : 'Pending'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderDashboard;
