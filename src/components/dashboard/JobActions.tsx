
import { Button } from "@/components/ui/button";
import {
    Calculator,
    XCircle,
    Clock,
    CreditCard,
    Navigation,
    CheckCircle,
    DollarSign
} from "lucide-react";

interface JobActionsProps {
    request: any;
    onQuote: (request: any) => void;
    onReject: (requestId: string) => void;
    onUpdateStatus: (requestId: string, status: string) => void;
    onConfirmPayment: (request: any) => void;
    onDetails: (request: any) => void;
    isMobile?: boolean;
}

export const JobActions = ({
    request,
    onQuote,
    onReject,
    onUpdateStatus,
    onConfirmPayment,
    onDetails,
    isMobile = false
}: JobActionsProps) => {
    const buttonClass = isMobile ? "w-full sm:w-auto" : "";
    const statusContainerClass = isMobile
        ? "flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200 w-full"
        : "flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded border border-indigo-200";

    return (
        <>
            {/* Assigned - Provider must submit quote first */}
            {request.status === 'assigned' && (
                <>
                    <Button
                        size="sm"
                        className={buttonClass}
                        onClick={() => onQuote(request)}
                    >
                        <Calculator className="h-4 w-4 mr-1" />
                        Submit Quote
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className={buttonClass}
                        onClick={() => onReject(request.id)}
                    >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                    </Button>
                </>
            )}

            {/* Quoted - Waiting for customer approval */}
            {request.status === 'quoted' && (
                <div className={statusContainerClass}>
                    <Clock className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-indigo-800`}>
                        Quote (GHS {Number(request.quoted_amount).toFixed(2)}) - Awaiting approval
                    </span>
                </div>
            )}

            {/* Awaiting Payment */}
            {request.status === 'awaiting_payment' && (
                <div className={statusContainerClass.replace('indigo', 'orange').replace('indigo', 'orange')}>
                    <CreditCard className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-orange-800`}>
                        Awaiting customer payment
                    </span>
                </div>
            )}

            {/* Paid - Provider can start */}
            {request.status === 'paid' && (
                <Button
                    size="sm"
                    className={buttonClass}
                    onClick={() => onUpdateStatus(request.id, 'en_route')}
                >
                    <Navigation className="h-4 w-4 mr-1" />
                    Payment Received - Start Driving
                </Button>
            )}

            {/* Legacy accepted status */}
            {request.status === 'accepted' && (
                <Button
                    size="sm"
                    className={buttonClass}
                    onClick={() => onUpdateStatus(request.id, 'en_route')}
                >
                    <Navigation className="h-4 w-4 mr-1" />
                    Start Driving (En Route)
                </Button>
            )}

            {request.status === 'en_route' && (
                <Button
                    size="sm"
                    className={buttonClass}
                    onClick={() => onUpdateStatus(request.id, 'in_progress')}
                >
                    {isMobile ? "Arrived - Start Service" : "Start Service"}
                </Button>
            )}

            {request.status === 'in_progress' && (
                <Button
                    size="sm"
                    className={buttonClass}
                    onClick={() => onUpdateStatus(request.id, 'awaiting_confirmation')}
                >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Complete
                </Button>
            )}

            {/* Awaiting customer confirmation */}
            {request.status === 'awaiting_confirmation' && !request.customer_confirmed_at && (
                <div className={statusContainerClass.replace('indigo', 'amber').replace('indigo', 'amber')}>
                    <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-amber-800`}>
                        Awaiting customer confirmation
                    </span>
                </div>
            )}

            {/* Customer confirmed - Provider can confirm payment receipt */}
            {(request.status === 'awaiting_confirmation' || request.status === 'completed' || request.status === 'paid') && request.customer_confirmed_at && !request.provider_confirmed_payment_at && (
                <Button
                    size="sm"
                    className={`${buttonClass} bg-green-600 hover:bg-green-700`}
                    onClick={() => {
                        console.log(`Clicked Confirm Payment (${isMobile ? 'Mobile' : 'Desktop'}) for:`, request);
                        onConfirmPayment(request);
                    }}
                >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Confirm Payment Received
                </Button>
            )}

            <Button
                size="sm"
                variant="outline"
                className={buttonClass}
                onClick={() => onDetails(request)}
            >
                Details
            </Button>
        </>
    );
};
