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
    const [requestsRes, providersRes, customersRes, transactionsRes, appsRes] = await Promise.all([
      supabase.from('service_requests').select('*, profiles!service_requests_customer_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, user_roles!inner(role)').eq('user_roles.role', 'provider'),
      supabase.from('profiles').select('*, user_roles!inner(role)').eq('user_roles.role', 'customer'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('partnership_applications').select('*').order('created_at', { ascending: false })
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

  const handleCompletePayment = async (requestId: string, amount: number) => {
    const { error: txError } = await supabase.from('transactions').insert([{
      service_request_id: requestId,
      transaction_type: 'customer_to_business',
      amount,
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
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.service_type}</TableCell>
                        <TableCell>{request.profiles?.full_name}</TableCell>
                        <TableCell>{request.provider_id ? 'Assigned' : 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">Assign Provider</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Provider</DialogTitle>
                                </DialogHeader>
                                <Select onValueChange={(value) => handleAssignProvider(request.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {providers.map((provider) => (
                                      <SelectItem key={provider.id} value={provider.id}>
                                        {provider.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </DialogContent>
                            </Dialog>
                          )}
                          {request.status === 'completed' && !allTransactions.find(t => t.service_request_id === request.id) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">Record Payment</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Record Mobile Money Payment</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  handleCompletePayment(request.id, Number(formData.get('amount')));
                                }}>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Amount Received</Label>
                                      <Input name="amount" type="number" step="0.01" required />
                                    </div>
                                    <Button type="submit" className="w-full">Confirm Payment</Button>
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

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Provider Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>{provider.full_name}</TableCell>
                        <TableCell>{provider.phone_number}</TableCell>
                        <TableCell>{provider.location}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.full_name}</TableCell>
                        <TableCell>{customer.phone_number}</TableCell>
                        <TableCell>{customer.location}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Edit</Button>
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
                <CardTitle>Payment Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                        <TableCell>{tx.transaction_type}</TableCell>
                        <TableCell>{tx.payment_method}</TableCell>
                        <TableCell>
                          <Badge variant={tx.confirmed_at ? 'default' : 'secondary'}>
                            {tx.confirmed_at ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
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

  return null;
};

export default Dashboard;
