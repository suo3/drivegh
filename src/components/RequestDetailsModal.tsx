import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  Car, 
  Fuel, 
  FileText, 
  Hash, 
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

interface RequestDetailsModalProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestDetailsModal = ({ request, open, onOpenChange }: RequestDetailsModalProps) => {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/90 text-warning-foreground',
      assigned: 'bg-blue-500/90 text-white',
      accepted: 'bg-blue-600/90 text-white',
      en_route: 'bg-purple-500/90 text-white',
      in_progress: 'bg-purple-600/90 text-white',
      completed: 'bg-success/90 text-success-foreground',
      cancelled: 'bg-muted text-muted-foreground',
      denied: 'bg-destructive/90 text-destructive-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  // Get customer phone: prioritize request.phone_number (for guests), then profiles.phone_number
  // Handle different query structures (profiles from different dashboard queries)
  const customerPhone = request.phone_number || request.profiles?.phone_number || request.customer?.phone_number;
  const customerName = request.profiles?.full_name || request.customer?.full_name || 'Guest User';
  const customerEmail = request.profiles?.email || request.customer?.email;

  // Vehicle info - these fields should be on the request object directly
  const hasVehicleInfo = request.vehicle_make || request.vehicle_model || request.vehicle_year || request.vehicle_plate;
  const hasVehiclePhoto = !!request.vehicle_image_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="capitalize text-xl">
              {request.service_type?.replace('_', ' ')}
            </span>
            <Badge className={`${getStatusColor(request.status)} capitalize`}>
              {request.status?.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tracking Code */}
          {request.tracking_code && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tracking Code</p>
                <p className="font-mono font-bold text-primary">{request.tracking_code}</p>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{customerName}</p>
                </div>
              </div>
              {customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <a 
                      href={`tel:${customerPhone}`} 
                      className="font-medium text-primary hover:underline"
                    >
                      {customerPhone}
                    </a>
                  </div>
                </div>
              )}
              {customerEmail && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${customerEmail}`} 
                      className="font-medium text-primary hover:underline"
                    >
                      {customerEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium">{request.location}</p>
              {request.customer_lat && request.customer_lng && (
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {request.customer_lat.toFixed(6)}, {request.customer_lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {(request.vehicle_make || request.vehicle_model || request.vehicle_year || request.vehicle_plate) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                {(request.vehicle_make || request.vehicle_model) && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {[request.vehicle_make, request.vehicle_model].filter(Boolean).join(' ')}
                    </span>
                    {request.vehicle_year && (
                      <span className="text-muted-foreground">({request.vehicle_year})</span>
                    )}
                  </div>
                )}
                {request.vehicle_plate && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plate:</span>
                    <span className="font-mono font-semibold bg-muted px-2 py-1 rounded">
                      {request.vehicle_plate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Photo */}
          {request.vehicle_image_url && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Vehicle Photo
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <a 
                  href={request.vehicle_image_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={request.vehicle_image_url}
                    alt="Vehicle"
                    className="w-full max-h-64 rounded-lg border shadow-sm object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click to view full size
                </p>
              </div>
            </div>
          )}

          {/* Fuel Delivery Details */}
          {request.service_type === 'fuel_delivery' && (request.fuel_type || request.fuel_amount) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Fuel Details
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
                <Fuel className="h-6 w-6 text-amber-600" />
                <div className="flex flex-col sm:flex-row sm:gap-4">
                  {request.fuel_type && (
                    <div>
                      <p className="text-xs text-amber-700">Fuel Type</p>
                      <p className="font-semibold capitalize text-amber-900">{request.fuel_type}</p>
                    </div>
                  )}
                  {request.fuel_amount && (
                    <div>
                      <p className="text-xs text-amber-700">Amount</p>
                      <p className="font-semibold text-amber-900">{request.fuel_amount} Liters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description / Notes
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{request.description}</p>
              </div>
            </div>
          )}

          {/* Provider Information (if assigned) */}
          {(request.provider_id || request.provider?.full_name || request.provider_profile?.full_name) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned Provider
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {(request.provider?.full_name || request.provider_profile?.full_name) ? (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Provider Name</p>
                        <p className="font-medium">
                          {request.provider?.full_name || request.provider_profile?.full_name}
                        </p>
                      </div>
                    </div>
                    {(request.provider?.phone_number || request.provider_profile?.phone_number) && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Provider Phone</p>
                          <a 
                            href={`tel:${request.provider?.phone_number || request.provider_profile?.phone_number}`} 
                            className="font-medium text-primary hover:underline"
                          >
                            {request.provider?.phone_number || request.provider_profile?.phone_number}
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Provider ID: {request.provider_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Amount */}
          {request.amount && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Service Amount
              </h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-primary">GHS {request.amount}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(request.created_at).toLocaleString()}</span>
              </div>
              {request.assigned_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned:</span>
                  <span>{new Date(request.assigned_at).toLocaleString()}</span>
                </div>
              )}
              {request.completed_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{new Date(request.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsModal;
