import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/hooks/useAuth';

const OneSignalInitializer = () => {
    const { user } = useAuth();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize OneSignal
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

        if (!appId || appId === 'YOUR_ONESIGNAL_APP_ID') {
            console.warn("OneSignal App ID not found. Notifications disabled.");
            return;
        }

        const runInit = async () => {
            try {
                await OneSignal.init({
                    appId: appId,
                    serviceWorkerPath: '/sw.js',
                });
                console.log('OneSignal initialized');
                setInitialized(true);
            } catch (error) {
                console.error('Error initializing OneSignal:', error);
            }
        };

        runInit();
    }, []);

    // Update User ID when user logs in - only after initialization
    useEffect(() => {
        if (!initialized) return;

        if (user) {
            try {
                // Associate the OneSignal user with the Supabase Auth ID
                OneSignal.login(user.id);
            } catch (error) {
                console.error('Error logging in to OneSignal:', error);
            }
        } else {
            try {
                OneSignal.logout();
            } catch (error) {
                console.error('Error logging out of OneSignal:', error);
            }
        }
    }, [user, initialized]);

    return null;
};

export default OneSignalInitializer;
