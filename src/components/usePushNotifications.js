import { useEffect, useState } from 'react';
import { requestPushPermission, onForegroundMessage } from '../firebase';

// Shown as an in-app toast when a push arrives while the app is open
function useInAppToast() {
  const [toast, setToast] = useState(null);

  const showToast = (title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 4000);
  };

  return { toast, setToast, showToast };
}

export function usePushNotifications(userId) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const { toast, setToast } = useInAppToast();

  // Register service worker and request permission once user is logged in
  useEffect(() => {
    if (!userId) return;
    if (!('serviceWorker' in navigator)) return;
    if (!('Notification' in window)) return;

    const register = async () => {
      try {
        // Register the service worker
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Only prompt if not already granted or denied
        if (Notification.permission === 'default') {
          const token = await requestPushPermission(userId);
          if (token) setPushEnabled(true);
        } else if (Notification.permission === 'granted') {
          const token = await requestPushPermission(userId);
          if (token) setPushEnabled(true);
        }
      } catch (err) {
        console.error('SW registration error:', err);
      }
    };

    register();
  }, [userId]);

  // Listen for foreground messages (app is open) and show in-app toast
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) setToast({ title, body });
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pushEnabled, toast };
}

export default usePushNotifications;
