import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ServiceManager from '@/components/ServiceManager';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialog, setAssignDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'customer_to_business' | 'business_to_provider'>('customer_to_business');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [requestsData, providersData, transactionsData, applicationsData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_customer_id_fkey(full_name, phone_number), provider:profiles!service_requests_provider_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*, user_roles!inner(role)')
        .eq('user_roles.role', 'provider'),
      supabase
        .from('transactions')
        .select('*, service_requests(service_type, status, profiles!service_requests_customer_id_fkey(full_name))')
        .order('created_at', { ascending: false }),
      supabase
        .from('partnership_applications')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (providersData.data) setProviders(providersData.data);
    if (transactionsData.data) setTransactions(transactionsData.data);
    if (applicationsData.data) setApplications(applicationsData.data);
    setLoading(false);
  };

  const assignProvider = async () => {
    if (!selectedRequest || !selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    const { error } = await supabase
      .from('service_requests')
      .update({
        provider_id: selectedProvider,
        status: 'assigned',
        assigned_by: user?.id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast.error('Failed to assign provider');
    } else {
      toast.success('Provider assigned successfully');
      setAssignDialog(false);
      fetchData();
    }
  };

  const confirmPayment = async () => {
    if (!paymentAmount || !selectedRequest) {
      toast.error('Please enter payment amount');
      return;
    }

    const { error } = await supabase.from('transactions').insert({
      service_request_id: selectedRequest.id,
      transaction_type: paymentType,
      amount: parseFloat(paymentAmount),
      payment_method: 'mobile_money',
      reference_number: paymentRef,
      notes: paymentNotes,
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to record payment');
    } else {
      if (paymentType === 'customer_to_business') {
        await supabase
          .from('service_requests')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', selectedRequest.id);
      }
      toast.success('Payment confirmed successfully');
      setPaymentDialog(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      fetchData();
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('partnership_applications')
      .update({ 
        status, 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update application status');
    } else {
      toast.success(`Application ${status}`);
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

  const totalRevenue = transactions
    .filter(t => t.transaction_type === 'customer_to_business')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">GHS {totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{providers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="applications">Partnership Applications</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
            <CardDescription>Manage and assign service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold capitalize">{request.service_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{request.location}</p>
                      <p className="text-sm">Customer: {request.profiles?.full_name}</p>
                      {request.provider && <p className="text-sm">Provider: {request.provider.full_name}</p>}
                    </div>
                    <Badge>{request.status}</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAssignDialog(true);
                        }}
                      >
                        Assign Provider
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setPaymentType('customer_to_business');
                          setPaymentDialog(true);
                        }}
                      >
                        Confirm Payment
                      </Button>
                    )}
                    {request.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setPaymentType('business_to_provider');
                          setPaymentDialog(true);
                        }}
                      >
                        Pay Provider
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Partnership Applications</CardTitle>
                <CardDescription>Review and manage partnership requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{app.business_name}</p>
                          <p className="text-sm text-muted-foreground">{app.contact_person}</p>
                          <p className="text-sm">{app.email} | {app.phone}</p>
                          <p className="text-sm text-muted-foreground">Location: {app.city}</p>
                        </div>
                        <Badge variant={
                          app.status === 'approved' ? 'default' : 
                          app.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }>
                          {app.status}
                        </Badge>
                      </div>
                      {app.message && (
                        <p className="text-sm mb-3 p-3 bg-muted rounded">{app.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        Applied: {new Date(app.created_at).toLocaleString()}
                      </p>
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">GHS {transaction.amount}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm">Ref: {transaction.reference_number || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge>{transaction.confirmed_at ? 'Confirmed' : 'Pending'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManager />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.full_name} - {provider.location || 'No location'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignProvider} className="w-full">Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentType === 'customer_to_business' ? 'Confirm Customer Payment' : 'Confirm Provider Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (GHS)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Transaction reference"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Additional notes"
              />
            </div>
            <Button onClick={confirmPayment} className="w-full">Confirm Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
