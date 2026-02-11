import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ServiceRequest {
    id: string;
    status: string;
    service_type: string;
    customer_lat: number | null;
    customer_lng: number | null;
    provider_lat: number | null;
    provider_lng: number | null;
    tracking_code: string;
    profiles?: {
        full_name: string;
    };
}

interface TrackingContextValue {
    activeRequest: ServiceRequest | null;
    isTrackingModalOpen: boolean;
    openTrackingModal: () => void;
    closeTrackingModal: () => void;
}

const TrackingContext = createContext<TrackingContextValue | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setActiveRequest(null);
            return;
        }

        // Fetch active request
        const fetchActiveRequest = async () => {
            const { data, error } = await supabase
                .from('service_requests')
                .select(`
          *,
          profiles!service_requests_provider_id_fkey(full_name)
        `)
                .eq('customer_id', user.id)
                .in('status', ['en_route', 'in_progress'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setActiveRequest(data as ServiceRequest);
            } else {
                setActiveRequest(null);
            }
        };

        fetchActiveRequest();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('active_tracking')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_requests',
                    filter: `customer_id=eq.${user.id}`,
                },
                (payload) => {
                    const newRequest = payload.new as ServiceRequest;

                    // Update if this is an active request
                    if (newRequest && (newRequest.status === 'en_route' || newRequest.status === 'in_progress')) {
                        fetchActiveRequest();
                    } else if (payload.eventType === 'UPDATE' && activeRequest?.id === newRequest.id) {
                        // Request is no longer active
                        if (newRequest.status !== 'en_route' && newRequest.status !== 'in_progress') {
                            setActiveRequest(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user, activeRequest?.id]);

    const openTrackingModal = () => setIsTrackingModalOpen(true);
    const closeTrackingModal = () => setIsTrackingModalOpen(false);

    return (
        <TrackingContext.Provider
            value={{
                activeRequest,
                isTrackingModalOpen,
                openTrackingModal,
                closeTrackingModal,
            }}
        >
            {children}
        </TrackingContext.Provider>
    );
}

export function useTracking() {
    const context = useContext(TrackingContext);
    if (context === undefined) {
        throw new Error('useTracking must be used within a TrackingProvider');
    }
    return context;
}
