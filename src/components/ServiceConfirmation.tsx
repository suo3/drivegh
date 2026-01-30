import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Star, CheckCircle } from 'lucide-react';

interface ServiceConfirmationProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  userType: 'customer' | 'provider';
}

const ServiceConfirmation = ({ request, open, onOpenChange, onConfirmed, userType }: ServiceConfirmationProps) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleCustomerConfirm = async () => {
    setIsSubmitting(true);

    try {
      // Update service request
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({
          customer_confirmed_at: new Date().toISOString(),
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Submit rating if provided
      if (rating > 0 && request.provider_id && request.customer_id) {
        const { error: ratingError } = await supabase
          .from('ratings')
          .insert({
            service_request_id: request.id,
            provider_id: request.provider_id,
            customer_id: request.customer_id,
            rating,
            review: review || null,
          });

        if (ratingError) {
          console.error('Error submitting rating:', ratingError);
          // Don't fail the whole operation for rating error
        }
      }

      toast.success('Service confirmed! Thank you for using DriveGhana.');
      onConfirmed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming service:', error);
      toast.error('Failed to confirm service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderConfirmPayment = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          provider_confirmed_payment_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Payment receipt confirmed!');
      onConfirmed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payment receipt:', error);
      toast.error('Failed to confirm payment receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {userType === 'customer' ? 'Confirm Service Completion' : 'Confirm Payment Received'}
          </DialogTitle>
          <DialogDescription>
            {userType === 'customer'
              ? 'Please confirm that the service was completed to your satisfaction and rate your provider.'
              : 'Confirm that you have received your payment for this service.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Summary */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium capitalize">{request.service_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-primary">GHS {Number(request.amount || request.quoted_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          {userType === 'customer' && (
            <>
              {/* Rating */}
              <div className="space-y-2">
                <Label>Rate your provider</Label>
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review */}
              <div className="space-y-2">
                <Label htmlFor="review">Leave a review (optional)</Label>
                <Textarea
                  id="review"
                  placeholder="Share your experience with this provider..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {userType === 'provider' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                By confirming, you acknowledge that you have received your payment share 
                (85% of GHS {Number(request.amount || request.quoted_amount || 0).toFixed(2)} = 
                <span className="font-bold"> GHS {(Number(request.amount || request.quoted_amount || 0) * 0.85).toFixed(2)}</span>).
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={userType === 'customer' ? handleCustomerConfirm : handleProviderConfirmPayment} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceConfirmation;
