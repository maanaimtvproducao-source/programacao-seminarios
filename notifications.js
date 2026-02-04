// ========================================
// Sistema de Notificações com Firebase Cloud Messaging
// ========================================

let messaging = null;
let notificationsEnabled = false;

// Inicializar FCM
async function initNotifications() {
    try {
        // Verificar se o navegador suporta notificações
        if (!('Notification' in window)) {
            console.warn('❌ Este navegador não suporta notificações');
            return;
        }

        // Verificar se Firebase Messaging está disponível
        if (!firebase.messaging.isSupported()) {
            console.warn('❌ Firebase Messaging não é suportado neste navegador');
            // Fallback: usar sistema de notificações simples
            setupSimpleNotifications();
            return;
        }

        // Inicializar Messaging
        messaging = firebase.messaging();
        
        // Verificar permissão atual
        if (Notification.permission === 'granted') {
            await setupFCM();
        }
        
        updateNotificationButton();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
        // Fallback: usar sistema simples
        setupSimpleNotifications();
    }
}

// Configurar FCM (Firebase Cloud Messaging)
async function setupFCM() {
    try {
        // Registrar Service Worker do Firebase
        const registration = await navigator.serviceWorker.register('/programacao-seminarios/firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado:', registration);
        
        // Obter token FCM
        const token = await messaging.getToken({
            vapidKey: 'BKxKH-qVvWqQqYZ5mKJZ5qZX5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZXQ', // Você precisa gerar isso no Firebase Console
            serviceWorkerRegistration: registration
        });
        
        console.log('🔑 Token FCM obtido:', token);
        
        // Salvar token no localStorage (para enviar notificações via servidor)
        localStorage.setItem('fcmToken', token);
        
        // Escutar mensagens em foreground
        messaging.onMessage((payload) => {
            console.log('📬 Mensagem recebida em foreground:', payload);
            showNotification(payload.notification?.title, payload.notification?.body);
        });
        
        // Escutar eventos do Firebase Database
        setupEventListener();
        
        notificationsEnabled = true;
        
    } catch (error) {
        console.error('❌ Erro ao configurar FCM:', error);
        // Se FCM falhar, usar sistema simples
        setupSimpleNotifications();
    }
}

// Sistema de notificações simples (fallback)
function setupSimpleNotifications() {
    console.log('📱 Usando sistema de notificações simples');
    
    if (Notification.permission === 'granted') {
        setupEventListener();
        notificationsEnabled = true;
    }
    
    updateNotificationButton();
}

// Escutar novos eventos no Firebase
function setupEventListener() {
    const eventsRef = firebase.database().ref('events');
    const lastEventTime = Date.now();
    
    // Escutar apenas eventos NOVOS (adicionados após ativar notificações)
    eventsRef.on('child_added', (snapshot) => {
        const event = snapshot.val();
        
        // Verificar se é realmente um evento novo
        const eventId = parseInt(event.id);
        if (eventId > lastEventTime) {
            // Evento foi adicionado AGORA
            const maanaimName = event.maanaim === 'terra-vermelha' ? 'Terra Vermelha' : 'Domingos Martins';
            showNotification(
                '🎉 Novo Evento Disponível!',
                `${event.name} - ${maanaimName}\n📅 ${formatDate(event.startDate)}`
            );
        }
    });
    
    console.log('✅ Listener de eventos configurado');
}

// Mostrar notificação
function showNotification(title, body) {
    if (!notificationsEnabled || Notification.permission !== 'granted') {
        return;
    }
    
    try {
        // Se tiver Service Worker, usar ele
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/programacao-seminarios/logo/icone.png',
                    badge: '/programacao-seminarios/logo/icone.png',
                    vibrate: [200, 100, 200],
                    tag: 'novo-evento',
                    requireInteraction: false
                });
            });
        } else {
            // Fallback: notificação normal
            new Notification(title, {
                body: body,
                icon: '/programacao-seminarios/logo/icone.png',
                vibrate: [200, 100, 200]
            });
        }
        
        console.log('✅ Notificação enviada:', title);
    } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
    }
}

// Solicitar permissão para notificações
async function requestNotificationPermission() {
    try {
        console.log('📱 Solicitando permissão para notificações...');
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            
            // Tentar usar FCM primeiro
            if (messaging) {
                await setupFCM();
            } else {
                // Fallback: sistema simples
                setupSimpleNotifications();
            }
            
            updateNotificationButton();
            
            // Mostrar notificação de teste
            showNotification(
                '🔔 Alertas Ativados!',
                'Você será notificado quando novos eventos forem adicionados'
            );
        } else {
            console.log('❌ Permissão negada');
            alert('Por favor, permita notificações para receber alertas de novos eventos.');
        }
    } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        alert('Erro ao ativar notificações. Tente novamente.');
    }
}

// Atualizar botão de notificações
function updateNotificationButton() {
    const button = document.getElementById('notificationBtn');
    if (!button) return;
    
    if (Notification.permission === 'granted' && notificationsEnabled) {
        button.textContent = '🔔 Alertas Ativos';
        button.classList.add('active');
        button.style.background = '#10b981';
        button.disabled = true;
    } else {
        button.textContent = '🔔 Ativar Alertas';
        button.classList.remove('active');
        button.style.background = '';
        button.disabled = false;
    }
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initNotifications, 1000);
    });
} else {
    setTimeout(initNotifications, 1000);
}

// Expor função globalmente para o botão
window.requestNotificationPermission = requestNotificationPermission;

console.log('📱 Sistema de notificações carregado');
