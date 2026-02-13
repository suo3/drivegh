import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Try OneSignal first if available
      let result: NotificationPermission = 'default';

      try {
        // @ts-ignore - OneSignal types might fail checks but the global object exists
        if (window.OneSignalDeferred || window.OneSignal) {
          // We can't easily import OneSignal here without cyclic deps or issues, 
          // but we can trust the global request via the standard API or assume 
          // the Native prompt will catch it. 
          // Better approach: Use the standard API, OneSignal usually hooks into this.
          // However, explicitly calling OneSignal's request is better for their state tracking.
        }
      } catch (e) {
        // quiet fail
      }

      // Standard request - OneSignal intercepts this if initialized correctly
      result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive updates about your service request.",
        });
        return true;
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Enable notifications in your browser settings to receive updates.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
};
