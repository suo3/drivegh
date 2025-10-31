import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, DollarSign, TrendingUp, Briefcase, MapPin, User, Phone, Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
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
    const [requestsData, earningsData, ratingsData, profileData] = await Promise.all([
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalEarnings = earnings.reduce((acc, t) => acc + parseFloat(t.provider_amount || 0), 0);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-20 px-6">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Provider Portal</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 💼
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Manage your jobs, track earnings, and deliver excellent service
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

      <section className="py-12 px-6 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto space-y-8">

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
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Assigned Jobs</CardTitle>
                  <CardDescription className="text-base mt-1">Manage your service requests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No jobs assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-xl capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{request.service_type.replace('_', ' ')}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {request.location}
                                </div>
                              </div>
                            </div>
                            {request.profiles && (
                              <div className="ml-14 space-y-2">
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
                          <Badge className="capitalize shadow-sm">{request.status.replace('_', ' ')}</Badge>
                        </div>
                        
                        {request.description && (
                          <div className="ml-14 mb-4 p-4 rounded-xl bg-muted/50 border border-muted">
                            <p className="text-sm">{request.description}</p>
                          </div>
                        )}

                        <div className="ml-14 flex flex-wrap gap-2">
                          {request.status === 'assigned' && (
                            <>
                              <Button size="sm" onClick={() => updateStatus(request.id, 'accepted')} className="shadow-md hover:shadow-lg transition-shadow">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectRequest(request.id)} className="shadow-md hover:shadow-lg transition-shadow">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <Button size="sm" onClick={() => updateStatus(request.id, 'en_route')} className="shadow-md hover:shadow-lg transition-shadow">
                              Mark En Route
                            </Button>
                          )}
                          {request.status === 'en_route' && (
                            <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')} className="shadow-md hover:shadow-lg transition-shadow">
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
    </div>
  );
};

export default ProviderDashboard;
