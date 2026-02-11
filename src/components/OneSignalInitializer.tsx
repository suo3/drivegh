import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const OneSignalInitializer = () => {
    const { user } = useAuth();
    const [initialized, setInitialized] = useState(false);
    const [initFailed, setInitFailed] = useState(false);

    useEffect(() => {
        // Initialize OneSignal
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

        if (!appId || appId === 'YOUR_ONESIGNAL_APP_ID') {
            console.warn("OneSignal App ID not found. Notifications disabled.");
            return;
        }

        const runInit = async () => {
            try {
                // Check if OneSignal script is blocked
                if (typeof window.OneSignalDeferred === 'undefined') {
                    console.warn('OneSignal SDK may be blocked by browser extension or CSP');
                    setInitFailed(true);
                    return;
                }

                await OneSignal.init({
                    appId: appId,
                    allowLocalhostAsSecureOrigin: true,
                    // Use the merged service worker
                    serviceWorkerPath: 'sw.js',
                    serviceWorkerParam: { scope: '/' },
                    promptOptions: {
                        slidedown: {
                            prompts: [
                                {
                                    type: 'push',
                                    autoPrompt: true,
                                    text: {
                                        actionMessage: "Don't miss your quote! Get instant alerts when providers respond to your request.",
                                        acceptButton: "Allow",
                                        cancelButton: "No Thanks",
                                    },
                                    delay: {
                                        timeDelay: 3
                                    }
                                }
                            ]
                        }
                    }
                });
                console.log('OneSignal initialized successfully');
                setInitialized(true);
            } catch (error) {
                console.error('Error initializing OneSignal:', error);
                setInitFailed(true);

                // Show user-friendly message
                if (error instanceof Error && error.message.includes('script failed to load')) {
                    console.warn('OneSignal blocked - likely by ad blocker or browser extension');
                    toast.info('Push notifications unavailable', {
                        description: 'Please disable your ad blocker to enable notifications.',
                        duration: 5000,
                    });
                }
            }
        };

        runInit();
    }, []);

    // Update User ID when user logs in - only after initialization
    useEffect(() => {
        if (!initialized || initFailed) return;

        if (user) {
            try {
                // Associate the OneSignal user with the Supabase Auth ID
                OneSignal.login(user.id);
                console.log('OneSignal user logged in:', user.id);
            } catch (error) {
                console.error('Error logging in to OneSignal:', error);
            }
        } else {
            try {
                OneSignal.logout();
                console.log('OneSignal user logged out');
            } catch (error) {
                console.error('Error logging out of OneSignal:', error);
            }
        }
    }, [user, initialized, initFailed]);

    return null;
};

export default OneSignalInitializer;
