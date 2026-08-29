importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDKcdRS5H2khDGLPxjw_IHAIo1WG4bnQkU",
    authDomain: "finebear-bf157.firebaseapp.com",
    projectId: "finebear-bf157",
    storageBucket: "finebear-bf157.appspot.com",
    messagingSenderId: "296985767202",
    appId: "1:296985767202:web:d73a50e49ef218408a497b"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.svg',
        data: payload.data || payload.fcmOptions?.link ? { url: payload.fcmOptions?.link } : {}
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
