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
import { Loader2, DollarSign, AlertCircle, Users, Briefcase, MapPin, User, Phone, Clock, CheckCircle, XCircle, FileText, Building, Mail, MessageSquare, Archive, Eye, Fuel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ServiceManager from '@/components/ServiceManager';
import LegalDocumentsManager from '@/components/LegalDocumentsManager';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerFilter, setCustomerFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [requestFilter, setRequestFilter] = useState('');
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
    const [requestsData, providersData, customersData, transactionsData, applicationsData, contactMessagesData] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_customer_id_fkey(full_name, phone_number), provider:profiles!service_requests_provider_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*, user_roles!inner(role)')
        .eq('user_roles.role', 'provider'),
      supabase
        .from('profiles')
        .select('*, user_roles!inner(role)')
        .eq('user_roles.role', 'customer')
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, service_requests(service_type, status, profiles!service_requests_customer_id_fkey(full_name))')
        .order('created_at', { ascending: false }),
      supabase
        .from('partnership_applications')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (requestsData.data) setRequests(requestsData.data);
    if (providersData.data) setProviders(providersData.data);
    if (customersData.data) setCustomers(customersData.data);
    if (transactionsData.data) setTransactions(transactionsData.data);
    if (applicationsData.data) setApplications(applicationsData.data);
    if (contactMessagesData.data) setContactMessages(contactMessagesData.data);
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

  const updateContactMessageStatus = async (id: string, status: 'new' | 'read' | 'archived') => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update message status');
    } else {
      toast.success(`Message marked as ${status}`);
      fetchData();
    }
  };

  const deleteContactMessage = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted');
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

  const totalRevenue = transactions
    .filter(t => t.transaction_type === 'customer_to_business')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerFilter.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone_number?.toLowerCase().includes(searchLower) ||
      customer.location?.toLowerCase().includes(searchLower)
    );
  });

  const filteredProviders = providers.filter(provider => {
    const searchLower = providerFilter.toLowerCase();
    return (
      provider.full_name?.toLowerCase().includes(searchLower) ||
      provider.email?.toLowerCase().includes(searchLower) ||
      provider.phone_number?.toLowerCase().includes(searchLower) ||
      provider.location?.toLowerCase().includes(searchLower)
    );
  });

  const filteredRequests = requests.filter(request => {
    const searchLower = requestFilter.toLowerCase();
    return (
      request.service_type?.toLowerCase().includes(searchLower) ||
      request.location?.toLowerCase().includes(searchLower) ||
      request.status?.toLowerCase().includes(searchLower) ||
      request.tracking_code?.toLowerCase().includes(searchLower) ||
      request.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      request.provider?.full_name?.toLowerCase().includes(searchLower) ||
      request.vehicle_make?.toLowerCase().includes(searchLower) ||
      request.vehicle_model?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm border border-primary/10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage all operations and resources</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="hover-scale">Sign Out</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="p-2 rounded-lg bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                GHS {totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Total business income</p>
            </CardContent>
          </Card>
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-orange-500/10 via-background to-background border-orange-500/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Awaiting assignment</p>
            </CardContent>
          </Card>
          <Card className="hover-lift transition-all duration-300 bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{providers.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Registered service providers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/10">
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Service Requests
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="providers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building className="h-4 w-4 mr-2" />
              Partnership Applications
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Messages
              {contactMessages.filter(m => m.status === 'new').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {contactMessages.filter(m => m.status === 'new').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="legal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Legal Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">Service Requests</CardTitle>
                    <CardDescription>Manage and assign service requests</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by service type, location, status, tracking code, customer, or provider..."
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                    className="max-w-2xl bg-background/50 border-primary/20"
                  />
                  {requestFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRequestFilter('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {requestFilter ? 'No requests match your search' : 'No service requests yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {filteredRequests.length} of {requests.length} requests
                    </div>
                    {filteredRequests.map((request) => (
                      <Card key={request.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-lg capitalize">{request.service_type.replace('_', ' ')}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {request.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Customer:</span> {request.profiles?.full_name || 'Guest User'}
                                </div>
                                {(request.profiles?.phone_number || request.phone_number) && (
                                  <div className="flex items-center gap-2 text-sm mt-1">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Phone:</span> {request.phone_number || request.profiles?.phone_number}
                                  </div>
                                )}
                                {request.provider && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Provider:</span> {request.provider.full_name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge className="capitalize">{request.status.replace('_', ' ')}</Badge>
                          </div>

                          {request.vehicle_image_url && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Vehicle Photo:</p>
                              <a href={request.vehicle_image_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={request.vehicle_image_url}
                                  alt="Vehicle"
                                  className="w-full max-w-[200px] rounded-lg border shadow-sm object-cover h-32 hover:opacity-90 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                              <Fuel className="h-4 w-4 text-amber-600 flex-shrink-0" />
                              <div className="flex gap-3 text-sm">
                                {request.fuel_type && <span className="capitalize font-medium">{request.fuel_type}</span>}
                                {request.fuel_amount && <span className="text-amber-900">{request.fuel_amount} Liters</span>}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setAssignDialog(true);
                                }}
                                className="hover-scale"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
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
                                className="hover-scale"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
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
                                className="hover-scale"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Pay Provider
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
          </TabsContent>

          <TabsContent value="applications">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Partnership Applications</CardTitle>
                    <CardDescription>Review and manage partnership requests</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{app.business_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {app.contact_person}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {app.email} | {app.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {app.city}
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            app.status === 'approved' ? 'default' :
                              app.status === 'rejected' ? 'destructive' :
                                'secondary'
                          } className="capitalize">
                            {app.status}
                          </Badge>
                        </div>
                        {app.message && (
                          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm">{app.message}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <Clock className="h-3 w-3" />
                          Applied: {new Date(app.created_at).toLocaleString()}
                        </div>
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(app.id, 'approved')}
                              className="hover-scale"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              className="hover-scale"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Transaction History</CardTitle>
                    <CardDescription>All payments and transactions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">GHS {transaction.amount}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {transaction.transaction_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm">Ref: {transaction.reference_number || 'N/A'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(transaction.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={transaction.confirmed_at ? 'default' : 'secondary'}>
                          {transaction.confirmed_at ? 'Confirmed' : 'Pending'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">Customer Management</CardTitle>
                    <CardDescription>View and manage registered customers</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by name, email, phone, or location..."
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="max-w-md bg-background/50 border-primary/20"
                  />
                  {customerFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomerFilter('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {customerFilter ? 'No customers match your search' : 'No customers registered yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {filteredCustomers.length} of {customers.length} customers
                    </div>
                    {filteredCustomers.map((customer) => (
                      <Card key={customer.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-3 rounded-full bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-lg">{customer.full_name || 'Unnamed Customer'}</p>
                                {customer.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.phone_number && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {customer.phone_number}
                                  </div>
                                )}
                                {customer.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {customer.location}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                  <Clock className="h-3 w-3" />
                                  Joined {new Date(customer.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">Provider Management</CardTitle>
                    <CardDescription>View and manage service providers</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by name, email, phone, or location..."
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="max-w-md bg-background/50 border-primary/20"
                  />
                  {providerFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProviderFilter('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredProviders.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {providerFilter ? 'No providers match your search' : 'No providers registered yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {filteredProviders.length} of {providers.length} providers
                    </div>
                    {filteredProviders.map((provider) => (
                      <Card key={provider.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-3 rounded-full bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-lg">{provider.full_name || 'Unnamed Provider'}</p>
                                  <Badge variant={provider.is_available ? 'default' : 'secondary'}>
                                    {provider.is_available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                </div>
                                {provider.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {provider.email}
                                  </div>
                                )}
                                {provider.phone_number && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {provider.phone_number}
                                  </div>
                                )}
                                {provider.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {provider.location}
                                  </div>
                                )}
                                {provider.bio && (
                                  <p className="text-sm text-muted-foreground mt-2">{provider.bio}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                  <Clock className="h-3 w-3" />
                                  Joined {new Date(provider.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManager />
          </TabsContent>

          <TabsContent value="legal">
            <LegalDocumentsManager />
          </TabsContent>

          <TabsContent value="messages">
            <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Contact Messages</CardTitle>
                    <CardDescription>Messages from the contact form</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contactMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No contact messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactMessages.map((message) => (
                      <Card key={message.id} className="hover-lift transition-all border-primary/10 bg-gradient-to-br from-card to-card/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-lg">{message.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  {message.email}
                                </div>
                                {message.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {message.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant={
                              message.status === 'new' ? 'destructive' :
                                message.status === 'read' ? 'default' :
                                  'secondary'
                            } className="capitalize">
                              {message.status}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Subject: {message.subject}
                            </p>
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(message.created_at).toLocaleString()}
                            </div>

                            <div className="flex gap-2">
                              {message.status === 'new' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateContactMessageStatus(message.id, 'read')}
                                  className="hover-scale"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </Button>
                              )}
                              {message.status === 'read' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateContactMessageStatus(message.id, 'archived')}
                                  className="hover-scale"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteContactMessage(message.id)}
                                className="hover-scale"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Assign Provider</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Select Provider
              </Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="h-12 bg-background/50 border-primary/20">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {provider.full_name} - {provider.location || 'No location'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignProvider} className="w-full h-12 hover-scale">
              <CheckCircle className="h-4 w-4 mr-2" />
              Assign Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                {paymentType === 'customer_to_business' ? 'Confirm Customer Payment' : 'Confirm Provider Payment'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Amount (GHS)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 bg-background/50 border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Reference Number
              </Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Transaction reference"
                className="h-12 bg-background/50 border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Notes
              </Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Additional notes"
                className="bg-background/50 border-primary/20 min-h-[100px]"
              />
            </div>
            <Button onClick={confirmPayment} className="w-full h-12 hover-scale">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
