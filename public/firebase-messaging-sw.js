// firebase-messaging-sw.js
// This file must live in /public so it's served from the root of the domain.
// Firebase Cloud Messaging requires the service worker at this exact path.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These values are safe to expose — they identify your Firebase project publicly.
// They are NOT secret keys.
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: self.FIREBASE_AUTH_DOMAIN || 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
  projectId: self.FIREBASE_PROJECT_ID || 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || 'REPLACE_WITH_YOUR_SENDER_ID',
  appId: self.FIREBASE_APP_ID || 'REPLACE_WITH_YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon, data } = payload.notification || {};

  self.registration.showNotification(title || 'Skillette', {
    body: body || 'You have a new notification',
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    data: data || {},
    vibrate: [200, 100, 200],
    tag: 'skillette-notification', // replaces previous notification instead of stacking
  });
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
