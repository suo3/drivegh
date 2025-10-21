import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    const [requestsData, transactionsData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_provider_id_fkey(full_name)')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, service_requests(service_type, status)')
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
      accepted: 'bg-green-500',
      denied: 'bg-red-500',
      en_route: 'bg-purple-500',
      in_progress: 'bg-orange-500',
      completed: 'bg-green-600',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <div className="space-x-2">
            <Button onClick={() => navigate('/request-service')}>Request Service</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Service Requests</CardTitle>
            <CardDescription>Track your roadside assistance requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-muted-foreground">No service requests yet</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold capitalize">{request.service_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{request.location}</p>
                        {request.profiles && (
                          <p className="text-sm">Provider: {request.profiles.full_name}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                    <p className="text-sm">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
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
              <p className="text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">GHS {transaction.amount}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {transaction.service_requests?.service_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm">Ref: {transaction.reference_number || 'N/A'}</p>
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
  );
};

export default CustomerDashboard;
