import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import PaymentSection from '@/components/PaymentSection';
import { MapPin, User, Phone, FileText } from 'lucide-react';

interface QuoteReviewProps {
    request: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerEmail?: string;
    onPaymentComplete?: () => void;
}

const QuoteReviewContent = ({ request, customerEmail, onPaymentComplete }: Omit<QuoteReviewProps, 'open' | 'onOpenChange'>) => {
    if (!request) return null;

    return (
        <div className="space-y-4 py-4 px-1">
            {/* Request Summary */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium truncate">{request.location}</p>
                    </div>
                </div>

                {request.profiles && (
                    <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Provider</p>
                            <p className="text-sm font-medium">{request.profiles.full_name}</p>
                            {request.profiles.phone_number && (
                                <p className="text-xs text-muted-foreground">{request.profiles.phone_number}</p>
                            )}
                        </div>
                    </div>
                )}

                {request.description && (
                    <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Request Details</p>
                            <p className="text-sm">{request.description}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Section */}
            <PaymentSection
                request={request}
                customerEmail={customerEmail}
                onPaymentComplete={onPaymentComplete}
            />
        </div>
    );
};

const QuoteReview = (props: QuoteReviewProps) => {
    const isMobile = useIsMobile();

    if (!props.request) return null;

    const title = 'Review Quote';
    const description = `${props.request.profiles?.full_name || 'Your provider'} has provided a quote for your ${props.request.service_type?.replace('_', ' ')} service`;

    if (isMobile) {
        return (
            <Drawer open={props.open} onOpenChange={props.onOpenChange}>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 overflow-y-auto max-h-[80vh]">
                        <QuoteReviewContent {...props} />
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
                <QuoteReviewContent {...props} />
            </DialogContent>
        </Dialog>
    );
};

export default QuoteReview;
