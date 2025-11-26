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
      const result = await Notification.requestPermission();
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
