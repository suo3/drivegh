import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Check, Clock, User, MapPin, Car, FileText } from 'lucide-react';

interface PaymentSectionProps {
  request: any;
  customerEmail?: string;
  onPaymentComplete?: () => void;
}

const PaymentSection = ({ request, customerEmail, onPaymentComplete }: PaymentSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleApproveQuote = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          quote_approved_at: new Date().toISOString(),
          status: 'awaiting_payment',
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success('Quote approved! You can now proceed to payment.');
      onPaymentComplete?.();
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    } finally {
      setIsApproving(false);
    }
  };

  const handlePayNow = async () => {
    if (!customerEmail) {
      toast.error('Email is required for payment');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          serviceRequestId: request.id,
          email: customerEmail,
          callbackUrl: `${window.location.origin}/track/${request.tracking_code}`,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show different UI based on status
  const isQuoted = request.status === 'quoted';
  const isAwaitingPayment = request.status === 'awaiting_payment';
  const isPaid = request.status === 'paid' || request.payment_status === 'paid';

  if (!request.quoted_amount) {
    return null;
  }

  const providerName = request.provider?.full_name || request.provider_profile?.full_name || 'Your provider';

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Service Quote</CardTitle>
          </div>
          {isPaid && (
            <Badge className="bg-green-500/90 text-white">
              <Check className="h-3 w-3 mr-1" />
              Paid
            </Badge>
          )}
          {isAwaitingPayment && (
            <Badge className="bg-amber-500/90 text-white">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting Payment
            </Badge>
          )}
          {isQuoted && (
            <Badge className="bg-blue-500/90 text-white">
              Review Quote
            </Badge>
          )}
        </div>
        <CardDescription>
          {isQuoted && `${providerName} has provided a quote for your service`}
          {isAwaitingPayment && 'Complete payment to start your service'}
          {isPaid && 'Payment completed - service in progress'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quote Details */}
        <div className="bg-background rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium capitalize">{request.service_type?.replace('_', ' ')}</span>
          </div>
          {request.quote_description && (
            <div className="mb-3 text-sm text-muted-foreground border-t pt-2 mt-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{request.quote_description}</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              GHS {Number(request.quoted_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isQuoted && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Review the quote above. Once approved, you'll be prompted to make payment.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleApproveQuote}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Approve Quote
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {isAwaitingPayment && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your quote has been approved. Complete payment to notify the provider to start traveling to your location.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayNow}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay GHS {Number(request.quoted_amount).toFixed(2)}
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Paystack
            </p>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-600">
              Your provider has been notified and will start heading to your location.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
