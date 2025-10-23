import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Star, DollarSign, ClipboardList, Users, UserCheck, UserX } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Customer state
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  
  // Provider state
  const [earnings, setEarnings] = useState(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Admin state
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    console.log('Dashboard useEffect - authLoading:', authLoading, 'user:', !!user, 'userRole:', userRole);
    
    if (authLoading) {
      return;
    }
    
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    if (userRole) {
      console.log('User role found, fetching data');
      fetchData();
    } else {
      console.log('No user role yet, setting loading to false');
      // If userRole is not available after auth is done, stop loading
      setLoading(false);
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchData = async () => {
    console.log('fetchData called with userRole:', userRole);
    setLoading(true);
    try {
      if (userRole === 'customer') {
        console.log('Fetching customer data');
        await fetchCustomerData();
      } else if (userRole === 'provider') {
        console.log('Fetching provider data');
        await fetchProviderData();
      } else if (userRole === 'admin') {
        console.log('Fetching admin data');
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      console.log('fetchData complete, setting loading to false');
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    const [requestsRes, transactionsRes, profileRes] = await Promise.all([
      supabase.from('service_requests').select('*, profiles!service_requests_provider_id_fkey(full_name)').eq('customer_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*, service_requests(service_type)').eq('service_requests.customer_id', user?.id),
      supabase.from('profiles').select('*').eq('id', user?.id).single()
    ]);

    if (requestsRes.data) setRequests(requestsRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (profileRes.data) setProfile(profileRes.data);
  };

  const fetchProviderData = async () => {
    const [requestsRes, transactionsRes, ratingsRes] = await Promise.all([
      supabase.from('service_requests').select('*, profiles!service_requests_customer_id_fkey(full_name, phone_number)').eq('provider_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').eq('service_requests.provider_id', user?.id),
      supabase.from('ratings').select('*').eq('provider_id', user?.id)
    ]);

    if (requestsRes.data) setRequests(requestsRes.data);
    if (transactionsRes.data) {
      const total = transactionsRes.data.reduce((sum, t) => sum + Number(t.amount), 0);
      setEarnings(total);
    }
    if (ratingsRes.data) {
      setRatings(ratingsRes.data);
      if (ratingsRes.data.length > 0) {
        const avg = ratingsRes.data.reduce((sum, r) => sum + r.rating, 0) / ratingsRes.data.length;
        setAvgRating(avg);
      }
    }
  };

  const fetchAdminData = async () => {
    // Fetch IDs by role first to avoid relying on PostgREST relationship inference
    const [requestsRes, providerIdsRes, customerIdsRes, transactionsRes, appsRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, profiles!service_requests_customer_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'provider'),
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('partnership_applications').select('*').order('created_at', { ascending: false }),
    ]);

    const providerIds = providerIdsRes.data?.map((r: any) => r.user_id) || [];
    const customerIds = customerIdsRes.data?.map((r: any) => r.user_id) || [];

    const [providersRes, customersRes] = await Promise.all([
      providerIds.length
        ? supabase.from('profiles').select('*').in('id', providerIds)
        : Promise.resolve({ data: [], error: null }),
      customerIds.length
        ? supabase.from('profiles').select('*').in('id', customerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (requestsRes.data) setAllRequests(requestsRes.data);
    if (providersRes.data) setProviders(providersRes.data);
    if (customersRes.data) setCustomers(customersRes.data);
    if (transactionsRes.data) setAllTransactions(transactionsRes.data);
    if (appsRes.data) setApplications(appsRes.data);
  };

  const handleUpdateProfile = async (updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', user?.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      fetchData();
    }
  };

  const handleCreateRequest = async (data: any) => {
    const { error } = await supabase.from('service_requests').insert([{
      customer_id: user?.id,
      service_type: data.service_type,
      location: data.location,
      description: data.description
    }]);
    if (error) {
      toast.error('Failed to create request');
    } else {
      toast.success('Service request created successfully');
      fetchData();
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    const { error } = await supabase.from('service_requests').update({ status: status as any }).eq('id', requestId);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated successfully');
      fetchData();
    }
  };

  const handleAssignProvider = async (requestId: string, providerId: string) => {
    const { error } = await supabase.from('service_requests').update({
      provider_id: providerId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      assigned_by: user?.id
    }).eq('id', requestId);
    if (error) {
      toast.error('Failed to assign provider');
    } else {
      toast.success('Provider assigned successfully');
      fetchData();
    }
  };

  const handleCompletePayment = async (requestId: string, amount: number, providerPercentage: number) => {
    const { error: txError } = await supabase.from('transactions').insert([{
      service_request_id: requestId,
      transaction_type: 'customer_to_business',
      amount,
      provider_percentage: providerPercentage,
      payment_method: 'mobile_money',
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString()
    }]);

    if (txError) {
      toast.error('Failed to record payment');
      return;
    }

    const { error: reqError } = await supabase.from('service_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', requestId);

    if (reqError) {
      toast.error('Failed to complete request');
    } else {
      toast.success('Payment recorded and request completed');
      fetchData();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Role Assigned</CardTitle>
            <CardDescription>Your account doesn't have a role assigned yet. Please contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Customer Dashboard
  if (userRole === 'customer') {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 space-y-6 mt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>New Service Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Service Request</DialogTitle>
                <DialogDescription>Fill out the form to request a service</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateRequest({
                  service_type: formData.get('service_type') as string,
                  location: formData.get('location') as string,
                  description: formData.get('description') as string
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <Label>Service Type</Label>
                    <Select name="service_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="towing">Towing</SelectItem>
                        <SelectItem value="flat_tire">Flat Tire</SelectItem>
                        <SelectItem value="battery_jump">Battery Jump</SelectItem>
                        <SelectItem value="fuel_delivery">Fuel Delivery</SelectItem>
                        <SelectItem value="lockout">Lockout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input name="location" required placeholder="Enter your location" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Additional details" />
                  </div>
                  <Button type="submit" className="w-full">Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{requests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{requests.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{requests.filter(r => r.status === 'completed').length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.service_type}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{request.profiles?.full_name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {request.status === 'completed' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Rate</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Service</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                   const { error } = await supabase.from('ratings').insert([{
                                    service_request_id: request.id,
                                    provider_id: request.provider_id,
                                    customer_id: user?.id,
                                    rating: Number(formData.get('rating')),
                                    review: formData.get('review') as string
                                  }]);
                                  if (error) toast.error('Failed to submit rating');
                                  else toast.success('Rating submitted successfully');
                                }}>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Rating (1-5)</Label>
                                      <Input name="rating" type="number" min="1" max="5" required />
                                    </div>
                                    <div>
                                      <Label>Review</Label>
                                      <Textarea name="review" />
                                    </div>
                                    <Button type="submit" className="w-full">Submit</Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.service_requests?.service_type}</TableCell>
                        <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                        <TableCell>{tx.payment_method}</TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={tx.confirmed_at ? 'default' : 'secondary'}>
                            {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateProfile({
                    full_name: formData.get('full_name'),
                    phone_number: formData.get('phone_number'),
                    location: formData.get('location'),
                    bio: formData.get('bio')
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input name="full_name" defaultValue={profile?.full_name} />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input name="phone_number" defaultValue={profile?.phone_number} />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input name="location" defaultValue={profile?.location} />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea name="bio" defaultValue={profile?.bio} />
                    </div>
                    <Button type="submit">Update Profile</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </>
    );
  }

  // Provider Dashboard
  if (userRole === 'provider') {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 space-y-6 mt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <div className="flex items-center gap-2">
            <Label>Available</Label>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Total Earnings</CardTitle>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${earnings.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Average Rating</CardTitle>
              <Star className="h-6 w-6 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgRating.toFixed(1)}/5</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Total Jobs</CardTitle>
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{requests.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assigned">
          <TabsList>
            <TabsTrigger value="assigned">Assigned Jobs</TabsTrigger>
            <TabsTrigger value="completed">Completed Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.service_type}</TableCell>
                        <TableCell>
                          <div>{request.profiles?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{request.profiles?.phone_number}</div>
                        </TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'assigned' && (
                              <>
                                <Button size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleUpdateRequestStatus(request.id, 'cancelled')}>
                                  Deny
                                </Button>
                              </>
                            )}
                            {request.status === 'in_progress' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm">Complete</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Complete Service</DialogTitle>
                                    <DialogDescription>
                                      Ask customer to send payment to business mobile money number
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm">Business Mobile Money: <strong>+256-XXX-XXXXXX</strong></p>
                                    <p className="text-sm text-muted-foreground">
                                      Once you receive payment confirmation, the admin will complete the transaction.
                                    </p>
                                    <Button onClick={() => {
                                      toast.success('Customer notified to send payment');
                                      handleUpdateRequestStatus(request.id, 'completed');
                                    }}>
                                      Mark as Awaiting Payment
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status === 'completed').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.service_type}</TableCell>
                        <TableCell>{request.profiles?.full_name}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{new Date(request.completed_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </>
    );
  }

  // Admin Dashboard
  if (userRole === 'admin') {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 space-y-6 mt-20">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${allTransactions.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allRequests.filter(r => r.status === 'pending').length}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{customers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>All Service Requests</CardTitle>
                <CardDescription>Manage all service requests across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRequests.map((request) => {
                      const provider = providers.find(p => p.id === request.provider_id);
                      
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.service_type}</TableCell>
                          <TableCell>{request.profiles?.full_name || 'Unknown'}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.location}</TableCell>
                          <TableCell>
                            {provider ? (
                              <div>
                                <p className="font-medium">{provider.full_name}</p>
                                <p className="text-xs text-muted-foreground">{provider.phone_number}</p>
                              </div>
                            ) : (
                              <Badge variant="secondary">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{new Date(request.created_at).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Details</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Request Details</DialogTitle>
                                    <DialogDescription>Service Request #{request.id.slice(0, 8)}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Service Type</Label>
                                        <p className="font-medium">{request.service_type}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Customer</Label>
                                        <p className="font-medium">{request.profiles?.full_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Provider</Label>
                                        <p className="font-medium">{provider?.full_name || 'Not assigned'}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-muted-foreground">Location</Label>
                                        <p className="font-medium">{request.location}</p>
                                      </div>
                                      {request.description && (
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Description</Label>
                                          <p className="font-medium">{request.description}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-muted-foreground">Created</Label>
                                        <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
                                      </div>
                                      {request.completed_at && (
                                        <div>
                                          <Label className="text-muted-foreground">Completed</Label>
                                          <p className="text-sm">{new Date(request.completed_at).toLocaleString()}</p>
                                        </div>
                                      )}
                                      {request.status === 'completed' && (() => {
                                        const transaction = allTransactions.find(t => t.service_request_id === request.id);
                                        return transaction ? (
                                          <div>
                                            <Label className="text-muted-foreground">Amount Paid</Label>
                                            <p className="font-medium text-lg">${Number(transaction.amount).toFixed(2)}</p>
                                          </div>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {request.status === 'pending' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm">Assign</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Assign Provider</DialogTitle>
                                      <DialogDescription>Select a provider for this service request</DialogDescription>
                                    </DialogHeader>
                                    <Select onValueChange={(value) => handleAssignProvider(request.id, value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select provider" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {providers.map((provider) => (
                                          <SelectItem key={provider.id} value={provider.id}>
                                            {provider.full_name} - {provider.phone_number}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </DialogContent>
                                </Dialog>
                              )}
                              
                              {request.status !== 'completed' && request.status !== 'cancelled' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleUpdateRequestStatus(request.id, 'completed')}
                                >
                                  Mark Complete
                                </Button>
                              )}
                              
                              {request.status === 'completed' && !allTransactions.find(t => t.service_request_id === request.id) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">Payment</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Record Payment</DialogTitle>
                                      <DialogDescription>Record mobile money payment for this service</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.currentTarget);
                                      handleCompletePayment(
                                        request.id, 
                                        Number(formData.get('amount')),
                                        Number(formData.get('provider_percentage'))
                                      );
                                    }}>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Amount Received (GHS)</Label>
                                          <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                                        </div>
                                        <div>
                                          <Label>Provider Percentage (%)</Label>
                                          <Input 
                                            name="provider_percentage" 
                                            type="number" 
                                            step="1" 
                                            min="0" 
                                            max="100" 
                                            required 
                                            defaultValue="70"
                                            placeholder="70" 
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Percentage of payment that goes to the provider
                                          </p>
                                        </div>
                                        <Button type="submit" className="w-full">Confirm Payment</Button>
                                      </div>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {allRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No service requests yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Provider Management</CardTitle>
                <CardDescription>Manage service providers and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Jobs Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => {
                      const completedJobs = allRequests.filter(r => r.provider_id === provider.id && r.status === 'completed').length;
                      const activeJobs = allRequests.filter(r => r.provider_id === provider.id && ['assigned', 'in_progress'].includes(r.status)).length;
                      
                      return (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.full_name}</TableCell>
                          <TableCell>{provider.id}</TableCell>
                          <TableCell>{provider.phone_number || 'N/A'}</TableCell>
                          <TableCell>{provider.location || 'N/A'}</TableCell>
                          <TableCell>{completedJobs}</TableCell>
                          <TableCell>
                            <Badge variant={activeJobs > 0 ? 'default' : 'secondary'}>
                              {activeJobs > 0 ? `${activeJobs} Active` : 'Available'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">View Details</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Provider Details</DialogTitle>
                                  <DialogDescription>View and manage provider information</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Full Name</Label>
                                      <p className="font-medium">{provider.full_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Phone Number</Label>
                                      <p className="font-medium">{provider.phone_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Location</Label>
                                      <p className="font-medium">{provider.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Bio</Label>
                                      <p className="font-medium">{provider.bio || 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Statistics</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">{completedJobs}</p>
                                          <p className="text-sm text-muted-foreground">Completed Jobs</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">{activeJobs}</p>
                                          <p className="text-sm text-muted-foreground">Active Jobs</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">
                                            ${allTransactions
                                              .filter(t => allRequests.find(r => r.id === t.service_request_id && r.provider_id === provider.id))
                                              .reduce((sum, t) => sum + Number(t.amount), 0)
                                              .toFixed(2)}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Total Earnings</p>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>

                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Recent Jobs</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {allRequests
                                        .filter(r => r.provider_id === provider.id)
                                        .slice(0, 5)
                                        .map((job) => (
                                          <div key={job.id} className="flex justify-between items-center p-2 border rounded">
                                            <div>
                                              <p className="font-medium">{job.service_type}</p>
                                              <p className="text-sm text-muted-foreground">{job.location}</p>
                                            </div>
                                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                                          </div>
                                        ))}
                                      {allRequests.filter(r => r.provider_id === provider.id).length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No jobs assigned yet</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {providers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No providers registered yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>Manage customers and their service history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const totalRequests = allRequests.filter(r => r.customer_id === customer.id).length;
                      const activeRequests = allRequests.filter(r => r.customer_id === customer.id && ['pending', 'assigned', 'in_progress'].includes(r.status)).length;
                      const completedRequests = allRequests.filter(r => r.customer_id === customer.id && r.status === 'completed').length;
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.full_name}</TableCell>
                          <TableCell>{customer.id}</TableCell>
                          <TableCell>{customer.phone_number || 'N/A'}</TableCell>
                          <TableCell>{customer.location || 'N/A'}</TableCell>
                          <TableCell>{totalRequests}</TableCell>
                          <TableCell>
                            <Badge variant={activeRequests > 0 ? 'default' : 'secondary'}>
                              {activeRequests > 0 ? `${activeRequests} Active` : 'No Active Requests'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">View Details</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Customer Details</DialogTitle>
                                  <DialogDescription>View customer information and service history</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Full Name</Label>
                                      <p className="font-medium">{customer.full_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Phone Number</Label>
                                      <p className="font-medium">{customer.phone_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Location</Label>
                                      <p className="font-medium">{customer.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Bio</Label>
                                      <p className="font-medium">{customer.bio || 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Statistics</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">{totalRequests}</p>
                                          <p className="text-sm text-muted-foreground">Total Requests</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">{completedRequests}</p>
                                          <p className="text-sm text-muted-foreground">Completed</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="pt-6">
                                          <p className="text-2xl font-bold">
                                            ${allTransactions
                                              .filter(t => allRequests.find(r => r.id === t.service_request_id && r.customer_id === customer.id))
                                              .reduce((sum, t) => sum + Number(t.amount), 0)
                                              .toFixed(2)}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Total Spent</p>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>

                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Service History</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {allRequests
                                        .filter(r => r.customer_id === customer.id)
                                        .slice(0, 5)
                                        .map((request) => (
                                          <div key={request.id} className="flex justify-between items-center p-2 border rounded">
                                            <div>
                                              <p className="font-medium">{request.service_type}</p>
                                              <p className="text-sm text-muted-foreground">{request.location}</p>
                                              <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                          </div>
                                        ))}
                                      {allRequests.filter(r => r.customer_id === customer.id).length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No service requests yet</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {customers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No customers registered yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>View and manage all payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTransactions.map((tx) => {
                      const request = allRequests.find(r => r.id === tx.service_request_id);
                      const customer = customers.find(c => c.id === request?.customer_id);
                      
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm">{tx.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-bold">GHS {Number(tx.amount).toFixed(2)}</TableCell>
                          <TableCell>{request?.service_type || 'N/A'}</TableCell>
                          <TableCell>{customer?.full_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.transaction_type}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{tx.payment_method.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant={tx.confirmed_at ? 'default' : 'secondary'}>
                              {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">Details</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Transaction Details</DialogTitle>
                                  <DialogDescription>Transaction #{tx.id.slice(0, 8)}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Amount</Label>
                                      <p className="text-2xl font-bold">GHS {Number(tx.amount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Status</Label>
                                      <Badge variant={tx.confirmed_at ? 'default' : 'secondary'} className="mt-2">
                                        {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Transaction Type</Label>
                                      <p className="font-medium">{tx.transaction_type}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Payment Method</Label>
                                      <p className="font-medium capitalize">{tx.payment_method.replace('_', ' ')}</p>
                                    </div>
                                    {tx.reference_number && (
                                      <div className="col-span-2">
                                        <Label className="text-muted-foreground">Reference Number</Label>
                                        <p className="font-mono font-medium">{tx.reference_number}</p>
                                      </div>
                                    )}
                                    <div className="col-span-2 border-t pt-4">
                                      <Label className="text-muted-foreground">Service Details</Label>
                                      <div className="mt-2 space-y-1">
                                        <p><span className="font-medium">Type:</span> {request?.service_type}</p>
                                        <p><span className="font-medium">Customer:</span> {customer?.full_name}</p>
                                        <p><span className="font-medium">Location:</span> {request?.location}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Created</Label>
                                      <p className="text-sm">{new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                    {tx.confirmed_at && (
                                      <div>
                                        <Label className="text-muted-foreground">Confirmed</Label>
                                        <p className="text-sm">{new Date(tx.confirmed_at).toLocaleString()}</p>
                                      </div>
                                    )}
                                    {tx.notes && (
                                      <div className="col-span-2">
                                        <Label className="text-muted-foreground">Notes</Label>
                                        <p className="text-sm">{tx.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {allTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </>
    );
  }

  return null;
};

export default Dashboard;
