// Service Worker para Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHmACEdHqnicy1o9fgWc_nBXi_cX_J19z8",
  authDomain: "seminario-56c0f.firebaseapp.com",
  databaseURL: "https://seminario-56c0f-default-rtdb.firebaseio.com",
  projectId: "seminario-56c0f",
  storageBucket: "seminario-56c0f.firebasestorage.app",
  messagingSenderId: "5049500377",
  appId: "1:5049500377:web:68b74b5496fc0bc804f4c8",
  measurementId: "G-K2KTCVGE48"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Messaging
const messaging = firebase.messaging();

// Lidar com mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification.title || 'Novo Evento!';
  const notificationOptions = {
    body: payload.notification.body || 'Um novo evento foi adicionado',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'novo-evento',
    requireInteraction: false,
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Verificar se já existe uma janela aberta
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não houver janela aberta, abrir uma nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
