import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, User, Phone, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [requestsData, transactionsData] = await Promise.all([
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
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (transactionsData.data) setTransactions(transactionsData.data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      en_route: 'bg-purple-500',
      completed: 'bg-green-600',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
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

      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-4">My Dashboard</h1>
              <p className="text-xl text-gray-200">
                Manage your service requests and track your rescue team
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-muted-foreground">Total Requests</h3>
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <p className="text-4xl font-bold">{requests.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-muted-foreground">Pending</h3>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-4xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-muted-foreground">Completed</h3>
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Service Requests</CardTitle>
                    <CardDescription>Track your roadside assistance requests</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button onClick={() => navigate('/request-service')} size="sm">
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
                    <Button onClick={() => navigate('/request-service')}>
                      Request Service Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg capitalize">
                                  {request.service_type.replace('_', ' ')}
                                </h3>
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{request.location}</span>
                                </div>
                                {request.description && (
                                  <p className="text-muted-foreground">{request.description}</p>
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
                          <div className="flex justify-between items-center pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                            {request.status === 'completed' && !request.rating && (
                              <Button size="sm" variant="outline">
                                Rate Service
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

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">GHS {transaction.amount}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {transaction.service_requests?.service_type?.replace('_', ' ')}
                            </p>
                            {transaction.reference_number && (
                              <p className="text-sm text-muted-foreground">
                                Ref: {transaction.reference_number}
                              </p>
                            )}
                          </div>
                          <Badge variant={transaction.confirmed_at ? 'default' : 'secondary'}>
                            {transaction.confirmed_at ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
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

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
