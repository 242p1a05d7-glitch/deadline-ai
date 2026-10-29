// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "jaunty-premise-vn56p",
  appId: "1:190010964153:web:25305050fcf66897190368",
  apiKey: "AIzaSyDliEQsI4VTCsdMQ8GzoDrdY6OAfHBvA4w",
  authDomain: "jaunty-premise-vn56p.firebaseapp.com",
  storageBucket: "jaunty-premise-vn56p.firebasestorage.app",
  messagingSenderId: "190010964153"
};

// Initialize the Firebase app in the service worker synchronously
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Register background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Deadline Hero AI Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'A critical task has exceeded the 80% risk score threshold!',
    icon: '/assets/logo.png', // Fallback or custom icon
    badge: '/assets/logo.png',
    data: payload.data,
    tag: 'deadline-risk-alert'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
