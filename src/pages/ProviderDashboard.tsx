import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">GHS {totalEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
                <Star className="fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{requests.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Jobs</CardTitle>
            <CardDescription>Manage your service requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-muted-foreground">No jobs assigned yet</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold capitalize">{request.service_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{request.location}</p>
                        {request.profiles && (
                          <>
                            <p className="text-sm">Customer: {request.profiles.full_name}</p>
                            <p className="text-sm">Phone: {request.profiles.phone_number}</p>
                          </>
                        )}
                      </div>
                      <Badge>{request.status}</Badge>
                    </div>
                    <p className="text-sm mb-3">{request.description}</p>
                    {request.status === 'assigned' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(request.id, 'accepted')}>
                          Accept
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(request.id, 'denied')}>
                          Deny
                        </Button>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <Button size="sm" onClick={() => updateStatus(request.id, 'en_route')}>
                        Mark En Route
                      </Button>
                    )}
                    {request.status === 'en_route' && (
                      <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')}>
                        Start Service
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <p className="text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-4">
                {earnings.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">GHS {Number(transaction.provider_amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.provider_percentage}% of GHS {Number(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={transaction.confirmed_at ? 'default' : 'secondary'}>
                      {transaction.confirmed_at ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
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
