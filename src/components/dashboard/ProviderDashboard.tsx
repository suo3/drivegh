
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Wallet, Star, Briefcase } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ProfileForm } from '@/components/ProfileForm';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import QuoteModal from '@/components/QuoteModal';
import ServiceConfirmation from '@/components/ServiceConfirmation';
import { JobActions } from './JobActions';

export const ProviderDashboard = () => {
    const { user } = useAuth();
    const { view } = useParams();
    const currentView = view || 'assigned';

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [earnings, setEarnings] = useState(0);
    const [ratings, setRatings] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [isAvailable, setIsAvailable] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    // Modal States
    const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<any | null>(null);
    const [quoteModalRequest, setQuoteModalRequest] = useState<any | null>(null);
    const [confirmPaymentRequest, setConfirmPaymentRequest] = useState<any | null>(null);

    // Helper functions
    const getStatusColor = (status: string) => {
        const colors: any = {
            pending: 'bg-yellow-500',
            assigned: 'bg-blue-500',
            quoted: 'bg-indigo-500',
            awaiting_payment: 'bg-amber-500',
            paid: 'bg-teal-500',
            en_route: 'bg-purple-500',
            in_progress: 'bg-purple-600',
            awaiting_confirmation: 'bg-orange-500',
            completed: 'bg-green-500',
            cancelled: 'bg-red-500',
            denied: 'bg-red-600'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusBorderColor = (status: string) => {
        const colors: any = {
            pending: 'border-l-yellow-500',
            assigned: 'border-l-blue-500',
            quoted: 'border-l-indigo-500',
            awaiting_payment: 'border-l-amber-500',
            paid: 'border-l-teal-500',
            accepted: 'border-l-blue-600',
            en_route: 'border-l-purple-500',
            in_progress: 'border-l-purple-600',
            awaiting_confirmation: 'border-l-orange-500',
            completed: 'border-l-green-500',
            cancelled: 'border-l-red-500',
            denied: 'border-l-red-600'
        };
        return colors[status] || 'border-l-gray-500';
    };

    const fetchProviderData = async () => {
        try {
            const [requestsRes, transactionsRes, ratingsRes, profileRes] = await Promise.all([
                supabase
                    .from('service_requests')
                    .select(`
            *, 
            profiles!service_requests_customer_id_fkey(full_name, phone_number, email),
            transactions(amount, provider_amount)
          `)
                    .eq('provider_id', user?.id)
                    .order('created_at', { ascending: false }),
                supabase.from('transactions').select('provider_amount, service_requests!inner(provider_id)').eq('service_requests.provider_id', user?.id),
                supabase.from('ratings').select('*').eq('provider_id', user?.id),
                supabase.from('profiles').select('*').eq('id', user?.id).single()
            ]);

            if (requestsRes.data) setRequests(requestsRes.data);
            if (transactionsRes.data) {
                const total = transactionsRes.data.reduce((sum, t) => sum + Number(t.provider_amount || 0), 0);
                setEarnings(total);
            }
            if (ratingsRes.data) {
                setRatings(ratingsRes.data);
                if (ratingsRes.data.length > 0) {
                    const avg = ratingsRes.data.reduce((sum, r) => sum + r.rating, 0) / ratingsRes.data.length;
                    setAvgRating(avg);
                }
            }
            if (profileRes.data) {
                setProfile(profileRes.data);
                setIsAvailable(profileRes.data.is_available);
            }
        } catch (error) {
            console.error('Error fetching provider data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProviderData();
        }
    }, [user]);

    const handleToggleAvailability = async (available: boolean) => {
        setIsAvailable(available);
        const { error } = await supabase
            .from('profiles')
            .update({ is_available: available })
            .eq('id', user?.id);

        if (error) {
            toast.error('Failed to update availability');
            setIsAvailable(!available);
        } else {
            toast.success(`You are now ${available ? 'available' : 'unavailable'} for new requests`);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('service_requests')
            .update({
                status: 'pending',
                provider_id: null,
                assigned_at: null,
                assigned_by: null
            })
            .eq('id', requestId);

        if (error) {
            toast.error('Failed to reject request');
        } else {
            toast.success('Request rejected successfully');
            fetchProviderData();
        }
    };

    const handleUpdateRequestStatus = async (requestId: string, status: string) => {
        const { error } = await supabase.from('service_requests').update({ status: status as any }).eq('id', requestId);
        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success('Status updated successfully');
            fetchProviderData();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen w-full flex flex-col lg:flex-row">
                <DashboardSidebar role="provider" currentView={currentView} />

                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />

                    <header className="sticky top-16 z-10 border-b bg-gradient-to-r from-primary/10 via-background to-accent/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm lg:block hidden">
                        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-6 lg:py-5">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <SidebarTrigger className="-ml-2 hover:bg-primary/10 transition-colors" />
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                                        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 💼
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Manage your service assignments</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 glass-dark px-4 py-2 rounded-xl">
                                <Label className="text-sm font-semibold">Available</Label>
                                <Switch checked={isAvailable} onCheckedChange={handleToggleAvailability} />
                            </div>
                        </div>
                    </header>

                    {/* Mobile Header Greeting & Availability */}
                    <div className="lg:hidden sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                                Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground">Available</span>
                            <Switch checked={isAvailable} onCheckedChange={handleToggleAvailability} className="scale-75 origin-right" />
                        </div>
                    </div>


                    <main className="flex-1 pb-32 p-4 mt-16 lg:p-6 overflow-y-auto w-full max-w-[100vw]">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                                <CardContent className="p-2 md:p-4 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-1 md:mb-2">
                                        <p className="text-[10px] md:text-xs font-medium text-green-600 uppercase tracking-wider truncate">Earnings</p>
                                        <div className="bg-green-100 p-1 md:p-1.5 rounded-full shrink-0">
                                            <Wallet className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-2xl font-bold text-green-700 truncate">GHS {earnings.toFixed(2)}</h3>
                                        <p className="text-[10px] md:text-xs text-green-600/80 mt-1 truncate">Payout ready</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                                <CardContent className="p-2 md:p-4 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-1 md:mb-2">
                                        <p className="text-[10px] md:text-xs font-medium text-amber-600 uppercase tracking-wider">Rating</p>
                                        <div className="bg-amber-100 p-1 md:p-1.5 rounded-full shrink-0">
                                            <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-2xl font-bold text-amber-700 flex items-center gap-1">
                                            {avgRating.toFixed(1)} <span className="hidden md:inline text-sm font-normal text-amber-600/80">/ 5.0</span>
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-amber-600/80 mt-1 truncate">{ratings.length} reviews</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                                <CardContent className="p-2 md:p-4 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-1 md:mb-2">
                                        <p className="text-[10px] md:text-xs font-medium text-blue-600 uppercase tracking-wider truncate">Jobs</p>
                                        <div className="bg-blue-100 p-1 md:p-1.5 rounded-full shrink-0">
                                            <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-2xl font-bold text-blue-700">
                                            {requests.filter(r => r.status === 'completed').length}
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-blue-600/80 mt-1 truncate">
                                            {requests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length} active
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Assigned Jobs View */}
                        {currentView === 'assigned' && (
                            <Card>
                                <CardHeader><CardTitle>Assigned Jobs</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Service</TableHead>
                                                    <TableHead>Customer Name</TableHead>
                                                    <TableHead>Customer Phone</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {requests
                                                    .filter(r => (r.status !== 'completed' || (r.status === 'completed' && !r.provider_confirmed_payment_at)) && r.status !== 'cancelled')
                                                    .map((request) => (
                                                        <TableRow key={request.id}>
                                                            <TableCell>{request.service_type}</TableCell>
                                                            <TableCell>{request.profiles?.full_name || 'Guest'}</TableCell>
                                                            <TableCell>{request.phone_number || request.profiles?.phone_number || 'N/A'}</TableCell>
                                                            <TableCell>{request.location}</TableCell>
                                                            <TableCell>
                                                                <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <JobActions
                                                                    request={request}
                                                                    onQuote={setQuoteModalRequest}
                                                                    onReject={handleRejectRequest}
                                                                    onUpdateStatus={handleUpdateRequestStatus}
                                                                    onConfirmPayment={setConfirmPaymentRequest}
                                                                    onDetails={setSelectedRequestForDetails}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                {requests.filter(r => (r.status !== 'completed' || (r.status === 'completed' && !r.provider_confirmed_payment_at)) && r.status !== 'cancelled').length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No active jobs assigned.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="md:hidden space-y-4">
                                        {requests
                                            .filter(r => (r.status !== 'completed' || (r.status === 'completed' && !r.provider_confirmed_payment_at)) && r.status !== 'cancelled')
                                            .map((request) => (
                                                <Card key={request.id} className={`border-2 border-l-4 ${getStatusBorderColor(request.status)}`}>
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-semibold">{request.service_type}</h3>
                                                                <p className="text-sm text-muted-foreground">{request.location}</p>
                                                            </div>
                                                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                                                        </div>
                                                        <div className="pt-2 border-t mt-2">
                                                            <JobActions
                                                                request={request}
                                                                onQuote={setQuoteModalRequest}
                                                                onReject={handleRejectRequest}
                                                                onUpdateStatus={handleUpdateRequestStatus}
                                                                onConfirmPayment={setConfirmPaymentRequest}
                                                                onDetails={setSelectedRequestForDetails}
                                                                isMobile={true}
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Completed Jobs View */}
                        {currentView === 'completed' && (
                            <Card>
                                <CardHeader><CardTitle>Completed Jobs History</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Service</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Amount Earned</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {requests
                                                    .filter(r => r.status === 'completed' && r.provider_confirmed_payment_at)
                                                    .map((request) => (
                                                        <TableRow key={request.id}>
                                                            <TableCell>{request.service_type}</TableCell>
                                                            <TableCell>{request.profiles?.full_name || 'Guest'}</TableCell>
                                                            <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                {request.transactions && request.transactions[0]?.provider_amount
                                                                    ? `GHS ${Number(request.transactions[0].provider_amount).toFixed(2)}`
                                                                    : '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="outline" size="sm" onClick={() => setSelectedRequestForDetails(request)}>
                                                                    Details
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                {requests.filter(r => r.status === 'completed' && r.provider_confirmed_payment_at).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No completed jobs yet.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="md:hidden space-y-4">
                                        {requests
                                            .filter(r => r.status === 'completed' && r.provider_confirmed_payment_at)
                                            .map((request) => (
                                                <Card key={request.id} className="border-l-4 border-l-green-500">
                                                    <CardContent className="p-4 space-y-2">
                                                        <div className="flex justify-between">
                                                            <h3 className="font-semibold">{request.service_type}</h3>
                                                            <span className="text-green-600 font-bold">
                                                                {request.transactions && request.transactions[0]?.provider_amount
                                                                    ? `GHS ${Number(request.transactions[0].provider_amount).toFixed(2)}`
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                                                        <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedRequestForDetails(request)}>
                                                            View Details
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Profile View */}
                        {currentView === 'profile' && (
                            <ProfileForm onSuccess={fetchProviderData} />
                        )}
                    </main>

                    {/* Shared Modals */}
                    <RequestDetailsModal
                        request={selectedRequestForDetails}
                        open={!!selectedRequestForDetails}
                        onOpenChange={(open) => !open && setSelectedRequestForDetails(null)}
                    />
                    <QuoteModal
                        request={quoteModalRequest}
                        open={!!quoteModalRequest}
                        onOpenChange={(open) => !open && setQuoteModalRequest(null)}
                        onQuoteSubmitted={fetchProviderData}
                    />
                    <ServiceConfirmation
                        request={confirmPaymentRequest}
                        open={!!confirmPaymentRequest}
                        onOpenChange={(open) => !open && setConfirmPaymentRequest(null)}
                        onConfirmed={fetchProviderData}
                        userType="provider"
                    />
                </div>
            </div>
        </SidebarProvider>
    );
};
