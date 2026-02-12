import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ServiceConfirmationProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  userType: 'customer' | 'provider';
}

const ServiceConfirmationContent = ({ request, onConfirmed, userType, onOpenChange }: ServiceConfirmationProps) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [transferError, setTransferError] = useState<string | null>(null);

  const handleCustomerConfirm = async () => {
    setIsSubmitting(true);
    setTransferError(null);

    try {
      // Step 1: Update service request with customer confirmation
      // Status changes to 'awaiting_confirmation' - waiting for provider to confirm funds receipt
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({
          customer_confirmed_at: new Date().toISOString(),
          status: 'awaiting_confirmation', // Provider needs to confirm fund receipt
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Step 2: Submit rating if provided
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

      // Step 3: Trigger transfer to provider
      console.log('Initiating transfer to provider...');
      const { data: transferData, error: transferError } = await supabase.functions.invoke(
        'paystack-transfer-to-provider',
        {
          body: { serviceRequestId: request.id },
        }
      );

      if (transferError) {
        console.error('Transfer initiation failed:', transferError);
        setTransferError('Service confirmed, but transfer initiation failed. The admin will process your provider\'s payment manually.');
        // Still show success for customer - admin can handle transfer manually
      } else if (transferData?.success) {
        console.log('Transfer initiated successfully:', transferData);
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
    console.log('Provider confirming payment for request:', request.id);
    setIsSubmitting(true);

    try {
      // Mark service as fully completed only after provider confirms fund receipt
      const { error } = await supabase
        .from('service_requests')
        .update({
          provider_confirmed_payment_at: new Date().toISOString(),
          status: 'completed', // NOW we mark as completed
          completed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Payment receipt confirmed! Job is now complete.');
      onConfirmed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payment receipt:', error);
      toast.error('Failed to confirm payment receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerAmount = (Number(request.amount || request.quoted_amount || 0) * 0.85).toFixed(2);

  return (
    <div className="space-y-6 py-4 px-1">
      {/* Service Summary */}
      <div className="bg-muted/30 rounded-lg p-4 text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium capitalize">{request.service_type?.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="font-bold text-primary">GHS {Number(request.amount || request.quoted_amount || 0).toFixed(2)}</span>
        </div>
      </div>

      {userType === 'customer' && (
        <>
          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📤 Payment Release:</strong> Confirming will release the provider's payment (GHS {providerAmount}) to their registered account.
            </p>
          </div>

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
                    className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
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
              className="resize-none"
            />
          </div>

          {/* Transfer Error Alert */}
          {transferError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{transferError}</p>
            </div>
          )}
        </>
      )}

      {userType === 'provider' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            By confirming, you acknowledge that you have received your payment share of{' '}
            <span className="font-bold">GHS {providerAmount}</span> (85% of total after platform fee).
          </p>
          <p className="text-xs text-green-600 mt-2">
            This will finalize the job and mark it as completed.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={userType === 'customer' ? handleCustomerConfirm : handleProviderConfirmPayment}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {userType === 'customer' ? 'Confirming...' : 'Confirming...'}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {userType === 'customer' ? 'Confirm & Release Payment' : 'Confirm Receipt'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const ServiceConfirmation = (props: ServiceConfirmationProps) => {
  const isMobile = useIsMobile();

  if (!props.request) return null;

  const { userType } = props;

  const title = (
    <div className="flex items-center gap-2">
      <CheckCircle className="h-5 w-5 text-green-500" />
      {userType === 'customer' ? 'Confirm Service' : 'Payment Received?'}
    </div>
  );

  const description = userType === 'customer'
    ? 'Please confirm service completion and rate your provider to release payment.'
    : 'Confirm that you have received your payment to finalize this job.';

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto max-h-[80vh]">
            <ServiceConfirmationContent {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ServiceConfirmationContent {...props} />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceConfirmation;
