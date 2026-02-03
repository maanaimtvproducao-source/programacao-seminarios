// ========================================
// Sistema de Notificações Push
// ========================================

let messaging = null;

// Inicializar notificações
async function initNotifications() {
    try {
        // Verificar se o navegador suporta notificações
        if (!('Notification' in window)) {
            console.warn('Este navegador não suporta notificações');
            return false;
        }

        // Verificar se o Firebase Messaging está disponível
        if (!firebase.messaging.isSupported()) {
            console.warn('Firebase Messaging não é suportado neste navegador');
            return false;
        }

        messaging = firebase.messaging();
        console.log('✅ Sistema de notificações inicializado');
        
        // Verificar status das notificações
        updateNotificationButton();
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
        return false;
    }
}

// Solicitar permissão e ativar notificações
async function requestNotificationPermission() {
    try {
        console.log('📱 Solicitando permissão para notificações...');
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            
            // Obter token de registro
            const token = await messaging.getToken({
                vapidKey: 'VAPID_KEY_AQUI' // Será configurado depois
            });
            
            if (token) {
                console.log('🔑 Token FCM:', token);
                
                // Salvar token no localStorage
                localStorage.setItem('fcmToken', token);
                
                // Salvar token no Firebase Database
                await saveTokenToDatabase(token);
                
                // Atualizar botão
                updateNotificationButton();
                
                alert('✅ Notificações ativadas! Você será avisado quando novos eventos forem adicionados.');
                return true;
            }
        } else if (permission === 'denied') {
            console.warn('❌ Permissão negada pelo usuário');
            alert('❌ Você negou as notificações. Para ativar, vá nas configurações do navegador.');
            return false;
        } else {
            console.warn('⚠️ Permissão não concedida');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        
        // Se o erro for sobre VAPID key, usar método simplificado
        if (error.code === 'messaging/invalid-vapid-key' || error.code === 'messaging/token-subscribe-failed') {
            console.log('⚠️ Usando método simplificado de notificações');
            return await enableSimpleNotifications();
        }
        
        alert('❌ Erro ao ativar notificações. Tente novamente.');
        return false;
    }
}

// Método simplificado usando apenas Web Notifications API
async function enableSimpleNotifications() {
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Notificações simples ativadas');
            localStorage.setItem('simpleNotificationsEnabled', 'true');
            
            // Configurar listener no Firebase para detectar novos eventos
            setupEventListener();
            
            updateNotificationButton();
            alert('✅ Notificações ativadas! Você será avisado quando novos eventos forem adicionados.');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

// Configurar listener para novos eventos
function setupEventListener() {
    if (!database) return;
    
    // Salvar timestamp atual
    const now = Date.now();
    localStorage.setItem('notificationsStartTime', now.toString());
    
    // Listener para novos eventos
    database.ref('events').on('child_added', (snapshot) => {
        const startTime = parseInt(localStorage.getItem('notificationsStartTime') || '0');
        const event = snapshot.val();
        
        // Verificar se o evento foi adicionado depois de ativar notificações
        const eventTime = new Date(event.startDate).getTime();
        
        if (Date.now() - startTime > 5000) { // Ignorar eventos dos primeiros 5 segundos
            showNotification('🎉 Novo Evento Adicionado!', {
                body: `${event.name} - ${event.class}\n📅 ${formatDate(event.startDate)} às ${event.startTime}`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'novo-evento-' + snapshot.key,
                requireInteraction: false
            });
        }
    });
    
    console.log('👂 Ouvindo novos eventos...');
}

// Mostrar notificação
function showNotification(title, options) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto-fechar após 10 segundos
        setTimeout(() => notification.close(), 10000);
    }
}

// Salvar token no database
async function saveTokenToDatabase(token) {
    try {
        await database.ref('fcmTokens').push({
            token: token,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent
        });
        console.log('✅ Token salvo no database');
    } catch (error) {
        console.error('❌ Erro ao salvar token:', error);
    }
}

// Atualizar botão de notificações
function updateNotificationButton() {
    const alertBtn = document.querySelector('.alert-btn');
    if (!alertBtn) return;
    
    const isEnabled = Notification.permission === 'granted' || 
                      localStorage.getItem('simpleNotificationsEnabled') === 'true';
    
    if (isEnabled) {
        alertBtn.textContent = '🔔 Alertas ativados';
        alertBtn.classList.add('active');
        alertBtn.style.backgroundColor = '#4CAF50';
        alertBtn.style.cursor = 'default';
        alertBtn.onclick = () => {
            alert('✅ Notificações já estão ativadas! Você receberá alertas de novos eventos.');
        };
    } else {
        alertBtn.textContent = '🔔 Ativar alertas';
        alertBtn.classList.remove('active');
        alertBtn.style.backgroundColor = '';
        alertBtn.style.cursor = 'pointer';
        alertBtn.onclick = requestNotificationPermission;
    }
}

// Formatar data
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Receber mensagens em foreground
if (messaging) {
    messaging.onMessage((payload) => {
        console.log('📨 Mensagem recebida:', payload);
        
        showNotification(
            payload.notification?.title || 'Novo Evento!',
            {
                body: payload.notification?.body || 'Um novo evento foi adicionado',
                icon: '/logo.png',
                badge: '/logo.png'
            }
        );
    });
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Firebase carregar
    setTimeout(() => {
        initNotifications();
        
        // Configurar botão
        const alertBtn = document.querySelector('.alert-btn');
        if (alertBtn) {
            alertBtn.onclick = requestNotificationPermission;
        }
    }, 1000);
});

console.log('📱 Sistema de notificações carregado');
