import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Calendar, Loader2, AlertCircle, TrendingUp, Receipt, CheckCircle2, Clock } from 'lucide-react';
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
        
      {/* Compact Banner - Not logged in */}
        <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Billing & Payments</h1>
            <p className="text-white/80 text-sm">View your transaction history</p>
          </div>
        </section>

        <section className="py-12 md:py-24 bg-background pb-20 lg:pb-24">
          <div className="container mx-auto px-4">
            <Card className="p-8 md:p-16 max-w-2xl mx-auto text-center shadow-2xl border-2 hover-lift animate-scale-in bg-gradient-to-br from-white to-gray-50/50">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-16 md:w-20 h-16 md:h-20 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CreditCard className="h-8 md:h-10 w-8 md:w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Login to View Your Billing</h2>
              <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">
                Sign in to access your complete transaction history and payment information
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold px-6 md:px-8"
              >
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
      
      {/* Compact Banner - Logged in */}
      <section className="bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Transaction History</h1>
          <p className="text-white/80 text-sm">Complete overview of your payments and transactions</p>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-gradient-to-b from-background to-[hsl(var(--section-bg))] relative pb-20 lg:pb-24">
        <div className="hidden md:block absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="hidden md:block absolute bottom-10 left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <Card className="p-8 md:p-16 text-center shadow-xl animate-scale-in">
                <Loader2 className="h-12 md:h-16 w-12 md:w-16 animate-spin mx-auto mb-4 md:mb-6 text-primary" />
                <p className="text-muted-foreground text-sm md:text-lg">Loading your transactions...</p>
              </Card>
            ) : error ? (
              <Card className="p-8 md:p-16 text-center shadow-xl animate-scale-in border-destructive/20">
                <div className="bg-destructive/10 rounded-full w-16 md:w-20 h-16 md:h-20 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <AlertCircle className="h-8 md:h-10 w-8 md:w-10 text-destructive" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Error Loading Transactions</h3>
                <p className="text-muted-foreground text-sm md:text-lg">{error}</p>
              </Card>
            ) : (
              <>
                {/* Stats Cards - Enhanced with gradients */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
                  <Card className="p-4 md:p-8 hover-lift bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 hover:border-green-200 animate-scale-in">
                    <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg md:rounded-xl p-2 md:p-3">
                        <CreditCard className="h-4 md:h-6 w-4 md:w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-xs md:text-lg">Total Spent</h3>
                    </div>
                    <p className="text-xl md:text-4xl font-bold mb-1 md:mb-2">GHS {totalSpent.toFixed(2)}</p>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 md:w-4 h-3 md:h-4" />
                      All time
                    </p>
                  </Card>

                  <Card className="p-4 md:p-8 hover-lift bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 hover:border-blue-200 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg md:rounded-xl p-2 md:p-3">
                        <Calendar className="h-4 md:h-6 w-4 md:w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-xs md:text-lg">Services</h3>
                    </div>
                    <p className="text-xl md:text-4xl font-bold mb-1 md:mb-2">{servicesUsed}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Total used</p>
                  </Card>

                  <Card className="p-4 md:p-8 hover-lift bg-gradient-to-br from-purple-50 to-pink-50/50 border-2 hover:border-purple-200 animate-scale-in col-span-2 md:col-span-1" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg md:rounded-xl p-2 md:p-3">
                        <Receipt className="h-4 md:h-6 w-4 md:w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-xs md:text-lg">Transactions</h3>
                    </div>
                    <p className="text-xl md:text-4xl font-bold mb-1 md:mb-2">{transactions.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Total count</p>
                  </Card>
                </div>

                {/* Transaction History Card - Enhanced */}
                <Card className="p-4 md:p-8 shadow-xl border-2 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-3">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Transaction History</h2>
                      <p className="text-xs md:text-base text-muted-foreground">Complete record of all your payments</p>
                    </div>
                    {transactions.length > 0 && (
                      <Button variant="outline" className="gap-2 text-xs md:text-sm w-full md:w-auto">
                        <Download className="w-3 md:w-4 h-3 md:h-4" />
                        Export
                      </Button>
                    )}
                  </div>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 md:py-16 animate-scale-in">
                      <div className="bg-primary/10 rounded-full w-16 md:w-24 h-16 md:h-24 flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <CreditCard className="h-8 md:h-12 w-8 md:w-12 text-primary" />
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">No Transactions Yet</h3>
                      <p className="text-muted-foreground text-sm md:text-lg mb-4 md:mb-6 max-w-md mx-auto">
                        Your transaction history will appear here once you complete a service request.
                      </p>
                      <Button 
                        onClick={() => navigate('/request-service')} 
                        size="lg"
                        className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold"
                      >
                        Request a Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {transactions.map((txn, index) => (
                        <div 
                          key={txn.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 border-2 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all gap-3 md:gap-4 group animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start gap-3 md:gap-4 flex-1">
                            <div className="bg-primary/10 rounded-lg md:rounded-xl p-2 md:p-3 group-hover:bg-primary group-hover:text-white transition-colors">
                              <Receipt className="h-4 md:h-5 w-4 md:w-5 text-primary group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                                <p className="font-bold text-sm md:text-lg capitalize">
                                  {txn.service_requests?.service_type?.replace('_', ' ') || 'Service'}
                                </p>
                                <Badge 
                                  variant={txn.transaction_type === 'payment' ? 'default' : 'secondary'}
                                  className="capitalize text-xs"
                                >
                                  {txn.transaction_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="space-y-0.5 md:space-y-1">
                                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-2">
                                  <Clock className="w-3 h-3" />
                                  {new Date(txn.created_at).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                                  ID: {txn.id.slice(0, 12)}...
                                </p>
                                {txn.payment_method && (
                                  <p className="text-xs md:text-sm text-muted-foreground capitalize hidden md:block">
                                    Payment: {txn.payment_method.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:space-y-2">
                            <p className="font-bold text-lg md:text-2xl text-primary">GHS {Number(txn.amount).toFixed(2)}</p>
                            {txn.confirmed_at ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1 text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
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
