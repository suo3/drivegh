import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Clock, MapPin } from 'lucide-react';
import { calculateDistance, calculateETA } from '@/lib/distance';

interface LiveTrackingProgressBarProps {
    request: {
        id: string;
        service_type: string;
        customer_lat: number;
        customer_lng: number;
        provider_lat: number | null;
        provider_lng: number | null;
        tracking_code: string;
        profiles?: {
            full_name: string;
        };
    };
}

export function LiveTrackingProgressBar({ request }: LiveTrackingProgressBarProps) {
    const navigate = useNavigate();
    const [distance, setDistance] = useState<number | null>(null);
    const [eta, setEta] = useState<string>('Calculating...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (request.provider_lat && request.provider_lng) {
            const dist = calculateDistance(
                request.customer_lat,
                request.customer_lng,
                request.provider_lat,
                request.provider_lng
            );
            setDistance(dist);

            const etaMinutes = calculateETA(dist);
            setEta(etaMinutes < 1 ? 'Arriving now!' : `${etaMinutes} min`);

            // Calculate progress (assuming 10km is 0% and 0km is 100%)
            const maxDistance = 10;
            const progressPercent = Math.max(0, Math.min(100, ((maxDistance - dist) / maxDistance) * 100));
            setProgress(progressPercent);
        }
    }, [request.customer_lat, request.customer_lng, request.provider_lat, request.provider_lng]);

    const handleClick = () => {
        navigate('/track-rescue');
    };

    const providerName = request.profiles?.full_name || 'Provider';
    const serviceType = request.service_type?.replace('_', ' ').toUpperCase();

    return (
        <div
            className="w-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20 backdrop-blur-sm cursor-pointer hover:bg-primary/15 transition-colors"
            onClick={handleClick}
        >
            <div className="max-w-7xl mx-auto px-4 py-3">
                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 h-3 w-3 bg-primary rounded-full animate-ping"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">
                                {providerName} En Route
                            </span>
                            <span className="text-xs text-muted-foreground">• {serviceType}</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">{eta}</span>
                        </div>
                        {distance !== null && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-medium">{distance.toFixed(1)} km</span>
                            </div>
                        )}
                        <span className="text-xs text-muted-foreground">Click for details →</span>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 h-2 w-2 bg-primary rounded-full animate-ping"></div>
                            </div>
                            <span className="font-semibold text-sm">{providerName} En Route</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-primary" />
                                <span className="font-medium">{eta}</span>
                            </div>
                            {distance !== null && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    <span className="font-medium">{distance.toFixed(1)} km</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
