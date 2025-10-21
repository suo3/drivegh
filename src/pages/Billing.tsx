import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock transaction data
  const transactions = [
    { id: 'TXN-001', date: '2025-01-15', service: 'Battery Jump Start', amount: 'GHS 80', status: 'Paid' },
    { id: 'TXN-002', date: '2025-01-10', service: 'Flat Tire Change', amount: 'GHS 120', status: 'Paid' },
    { id: 'TXN-003', date: '2024-12-28', service: 'Towing Service', amount: 'GHS 250', status: 'Paid' },
  ];

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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Total Spent</h3>
                </div>
                <p className="text-3xl font-bold">GHS 450</p>
                <p className="text-sm text-muted-foreground">This year</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Services Used</h3>
                </div>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Total requests</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Export Data</h3>
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Download PDF
                </Button>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
              <div className="space-y-4">
                {transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{txn.service}</p>
                      <p className="text-sm text-muted-foreground">Transaction ID: {txn.id}</p>
                      <p className="text-sm text-muted-foreground">{txn.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{txn.amount}</p>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Billing;
