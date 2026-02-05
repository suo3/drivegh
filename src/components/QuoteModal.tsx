import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Calculator, MapPin, Car, User } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface QuoteModalProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteSubmitted: () => void;
}

const QuoteForm = ({ request, amount, setAmount, description, setDescription, isSubmitting, handleSubmit, onCancel }: any) => {
  const getDistance = () => {
    if (!request?.customer_lat || !request?.customer_lng || !request?.provider_lat || !request?.provider_lng) {
      return null;
    }
    return calculateDistance(
      request.customer_lat,
      request.customer_lng,
      request.provider_lat,
      request.provider_lng
    );
  };

  if (!request) return null;

  const distance = getDistance();
  const customerName = request.profiles?.full_name || 'Guest User';

  return (
    <div className={cn("space-y-4", isSubmitting && "opacity-50 pointer-events-none")}>
      {/* Job Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <span className="font-medium capitalize">{request.service_type?.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{request.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{customerName}</span>
        </div>
        {distance !== null && (
          <div className="flex items-center gap-2 text-primary font-medium">
            <span>Distance:</span>
            <span>{formatDistance(distance)}</span>
          </div>
        )}
      </div>

      {/* Quote Amount */}
      <div className="space-y-2 w-full">
        <Label htmlFor="amount">Quote Amount (GHS) *</Label>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            GHS
          </span>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-14 text-lg font-semibold w-full"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Include all costs: travel, labor, parts, etc.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2 w-full">
        <Label htmlFor="description">Quote Breakdown (Optional)</Label>
        <Textarea
          id="description"
          placeholder="E.g., Travel cost: GHS 30, Service: GHS 70..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none"
        />
      </div>

      {/* Commission Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> A 15% platform commission will be deducted.
          You'll receive <span className="font-medium text-primary">GHS {amount ? (parseFloat(amount) * 0.85).toFixed(2) : '0.00'}</span> for this job.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || !amount}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Quote'
          )}
        </Button>
      </div>
    </div>
  );
};

const QuoteModal = ({ request, open, onOpenChange, onQuoteSubmitted }: QuoteModalProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmitQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid quote amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          quoted_amount: parseFloat(amount),
          quote_description: description || null,
          quoted_at: new Date().toISOString(),
          status: 'quoted',
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Quote submitted successfully! Waiting for customer approval.');
      onQuoteSubmitted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  const formProps = {
    request,
    amount,
    setAmount,
    description,
    setDescription,
    isSubmitting,
    handleSubmit: handleSubmitQuote,
    onCancel: () => onOpenChange(false)
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Submit Price Quote
            </DrawerTitle>
            <DrawerDescription>
              Enter your estimated cost. Customer approval required.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto max-h-[80vh]">
            <QuoteForm {...formProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Submit Price Quote
          </DialogTitle>
          <DialogDescription>
            Enter your estimated cost for this service. The customer will review and approve before payment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <QuoteForm {...formProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;
