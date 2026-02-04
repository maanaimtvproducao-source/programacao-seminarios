// Service Worker para Firebase Cloud Messaging
// Este arquivo deve estar na raiz do projeto

// Importar Firebase SDKs
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHmACEdHqnicy1o9fgWc_nBXi_cX_J19z8",
  authDomain: "seminario-56c0f.firebaseapp.com",
  databaseURL: "https://seminario-56c0f-default-rtdb.firebaseio.com",
  projectId: "seminario-56c0f",
  storageBucket: "seminario-56c0f.firebasestorage.app",
  messagingSenderId: "5049500377",
  appId: "1:5049500377:web:68b74b5496fc0bc804f4c8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Messaging
const messaging = firebase.messaging();

// Lidar com mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Novo Evento!';
  const notificationOptions = {
    body: payload.notification?.body || 'Um novo evento foi adicionado à programação',
    icon: '/programacao-seminarios/logo/icone.png',
    badge: '/programacao-seminarios/logo/icone.png',
    vibrate: [200, 100, 200],
    tag: 'novo-evento',
    requireInteraction: false,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já houver uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('programacao-seminarios') && 'focus' in client) {
            return client.focus();
          }
        }
        // Senão, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow('/programacao-seminarios/');
        }
      })
  );
});

console.log('🔥 Firebase Messaging Service Worker carregado');
