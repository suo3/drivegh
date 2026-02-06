import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { BellRing } from 'lucide-react';

const NotificationPermissionRequest = () => {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Check permission status after a short delay to ensure OneSignal is loaded
        const checkPermission = async () => {
            // Small delay to ensure OneSignal is initialized
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                // Safe check for OneSignal existence
                if (OneSignal && OneSignal.Notifications) {
                    const permission = OneSignal.Notifications.permission;
                    console.log("Current Notification Permission:", permission);

                    // Show if permission is 'default' (not yet asked) or 'denied' (need to guide to settings)
                    // We mainly want to prompt them if they haven't made a choice yet.
                    // Note: OneSignal types might mock permission as boolean or string. We check loosely.
                    if (String(permission) !== 'granted') {
                        setIsOpen(true);
                        setShouldRender(true);
                    }
                }
            } catch (e) {
                console.error("Error checking notification permission:", e);
            }
        };

        checkPermission();
    }, []);

    const handleEnableNotifications = async () => {
        try {
            console.log("Requesting permission...");

            // Check current permission first
            const currentPermission = OneSignal.Notifications.permission;

            if (String(currentPermission) === 'denied' || String(currentPermission) === 'blocked') {
                toast.error("Notifications are blocked", {
                    description: "Please enable notifications in your browser settings to receive updates."
                });
                return;
            }

            const accepted = await OneSignal.Notifications.requestPermission();

            if (accepted) {
                toast.success("Notifications Enabled!", {
                    description: "You'll now receive updates about your service request."
                });
                setIsOpen(false);
            } else {
                console.log("Permission request denied or dismissed");
                // If they just dismissed it, we might want to keep the drawer open or close it.
                // If denied, the next click will hit the 'blocked' check above.
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
            toast.error("Something went wrong", {
                description: "We couldn't enable notifications. Please try again."
            });
        }
    };

    if (!shouldRender) return null;

    const content = (
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="p-3 bg-blue-100 rounded-full">
                <BellRing className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Don't Miss Your Quote!</h3>
                <p className="text-muted-foreground text-sm max-w-[300px]">
                    Enable notifications to get instant alerts when providers respond to your request.
                </p>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerContent>
                    <DrawerHeader className="text-left hidden">
                        <DrawerTitle>Enable Notifications</DrawerTitle>
                        <DrawerDescription>
                            Get notified when a provider sends you a quote.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-8">
                        {content}
                        <DrawerFooter className="pt-6 px-0">
                            <Button onClick={handleEnableNotifications} className="w-full" size="lg">
                                Enable Notifications
                            </Button>
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">
                                Maybe Later
                            </Button>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="hidden">
                    <DialogTitle>Enable Notifications</DialogTitle>
                    <DialogDescription>Get real-time updates.</DialogDescription>
                </DialogHeader>
                {content}
                <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                    <Button onClick={handleEnableNotifications} className="w-full">
                        Enable Notifications
                    </Button>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationPermissionRequest;
