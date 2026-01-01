import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Award, CheckCircle2 } from 'lucide-react';

interface ProviderCardProps {
  provider: {
    provider_id: string;
    full_name: string;
    avatar_url: string | null;
    years_experience: number;
    distance_km: number;
    avg_rating: number;
    total_reviews: number;
  };
  isSelected: boolean;
  onSelect: (providerId: string) => void;
  estimatedEta?: number; // in minutes
}

export function ProviderCard({
  provider,
  isSelected,
  onSelect,
  estimatedEta,
}: ProviderCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const calculateEta = (distanceKm: number) => {
    // Assume average speed of 30 km/h in urban areas
    const etaMinutes = (distanceKm / 30) * 60;
    if (etaMinutes < 1) return '< 1 min';
    if (etaMinutes < 60) return `${Math.round(etaMinutes)} min`;
    return `${Math.floor(etaMinutes / 60)}h ${Math.round(etaMinutes % 60)}min`;
  };

  return (
    <Card
      className={`p-3 cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border hover:border-primary/40 hover:shadow-md'
      }`}
      onClick={() => onSelect(provider.provider_id)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={provider.avatar_url || undefined} alt={provider.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(provider.full_name)}
            </AvatarFallback>
          </Avatar>
          {isSelected && (
            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
              <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm truncate">{provider.full_name}</h4>
            {provider.avg_rating > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-medium">{provider.avg_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {/* Distance */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{formatDistance(provider.distance_km)}</span>
            </div>

            {/* ETA */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{estimatedEta ? `${estimatedEta} min` : calculateEta(provider.distance_km)}</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {provider.years_experience > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Award className="h-2.5 w-2.5 mr-0.5" />
                {provider.years_experience}+ yrs
              </Badge>
            )}
            {provider.total_reviews > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {provider.total_reviews} reviews
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
