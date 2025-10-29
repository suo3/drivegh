import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  created_at: string;
  confirmed_at: string | null;
  reference_number: string | null;
  notes: string | null;
  service_request_id: string;
  provider_amount: number | null;
  platform_amount: number | null;
  service_requests: {
    service_type: string;
    status: string;
  } | null;
}

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user's service requests first
        const { data: userRequests, error: requestsError } = await supabase
          .from('service_requests')
          .select('id')
          .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`);

        if (requestsError) throw requestsError;

        const requestIds = userRequests?.map(r => r.id) || [];

        if (requestIds.length === 0) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        // Fetch transactions for those service requests
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select(`
            *,
            service_requests (
              service_type,
              status
            )
          `)
          .in('service_request_id', requestIds)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setTransactions(data || []);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to load transactions');
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const totalSpent = transactions
    .filter(t => t.transaction_type === 'customer_to_business')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const servicesUsed = new Set(transactions.map(t => t.service_request_id)).size;

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <section className="bg-primary text-white pt-32 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">Billing & Payments</h1>
            <p className="text-xl text-gray-200 max-w-3xl">
              View your transaction history and manage payments
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="p-12 max-w-2xl mx-auto text-center">
              <CreditCard className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Login to View Your Billing</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to access your transaction history and payment information
              </p>
              <Button onClick={() => navigate('/auth')} size="lg">
                Login to Continue
              </Button>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="bg-primary text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Billing & Transaction History</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            View and manage all your payments and transactions
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading your transactions...</p>
              </Card>
            ) : error ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error Loading Transactions</h3>
                <p className="text-muted-foreground">{error}</p>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Total Spent</h3>
                    </div>
                    <p className="text-3xl font-bold">GHS {totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">All time</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Services Used</h3>
                    </div>
                    <p className="text-3xl font-bold">{servicesUsed}</p>
                    <p className="text-sm text-muted-foreground">Total requests</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Download className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Transactions</h3>
                    </div>
                    <p className="text-3xl font-bold">{transactions.length}</p>
                    <p className="text-sm text-muted-foreground">Total count</p>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Your transaction history will appear here once you complete a service request.
                      </p>
                      <Button onClick={() => navigate('/request-service')} variant="outline">
                        Request a Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((txn) => (
                        <div key={txn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold capitalize">
                                {txn.service_requests?.service_type?.replace('_', ' ') || 'Service'}
                              </p>
                              <Badge variant={txn.transaction_type === 'payment' ? 'default' : 'secondary'}>
                                {txn.transaction_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Transaction ID: {txn.id.slice(0, 8)}...
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(txn.created_at).toLocaleString()}
                            </p>
                            {txn.payment_method && (
                              <p className="text-sm text-muted-foreground capitalize">
                                Payment: {txn.payment_method.replace('_', ' ')}
                              </p>
                            )}
                            {txn.reference_number && (
                              <p className="text-sm text-muted-foreground">
                                Ref: {txn.reference_number}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">GHS {Number(txn.amount).toFixed(2)}</p>
                            {txn.confirmed_at ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Confirmed
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Billing;
