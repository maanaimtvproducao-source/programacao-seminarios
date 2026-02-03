// ========================================
// Sistema de Notificações Push Simplificado
// ========================================

// Verificar se notificações estão suportadas
function isNotificationSupported() {
    return 'Notification' in window;
}

// Verificar se notificações estão ativadas
function isNotificationEnabled() {
    return Notification.permission === 'granted' && 
           localStorage.getItem('notificationsEnabled') === 'true';
}

// Solicitar permissão e ativar notificações
async function requestNotificationPermission() {
    try {
        if (!isNotificationSupported()) {
            alert('❌ Seu navegador não suporta notificações.');
            return false;
        }

        console.log('📱 Solicitando permissão para notificações...');
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            
            // Marcar como ativado
            localStorage.setItem('notificationsEnabled', 'true');
            localStorage.setItem('notificationsStartTime', Date.now().toString());
            
            // Configurar listener para novos eventos
            setupEventListener();
            
            // Atualizar botão
            updateNotificationButton();
            
            // Mostrar notificação de teste
            showNotification('🔔 Notificações Ativadas!', {
                body: 'Você receberá alertas quando novos eventos forem adicionados.',
                icon: '/logo/icone.png'
            });
            
            return true;
            
        } else if (permission === 'denied') {
            console.warn('❌ Permissão negada');
            alert('❌ Você bloqueou as notificações.\n\nPara ativar:\n1. Clique no ícone de cadeado 🔒 na barra de endereço\n2. Em "Notificações", selecione "Permitir"');
            return false;
            
        } else {
            console.warn('⚠️ Permissão não concedida');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        alert('❌ Erro ao ativar notificações. Tente novamente.');
        return false;
    }
}

// Configurar listener para detectar novos eventos no Firebase
function setupEventListener() {
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('⚠️ Firebase não está disponível');
        return;
    }
    
    const db = firebase.database();
    const startTime = parseInt(localStorage.getItem('notificationsStartTime') || '0');
    
    // Listener para novos eventos
    db.ref('events').on('child_added', (snapshot) => {
        const event = snapshot.val();
        const now = Date.now();
        
        // Só notificar eventos adicionados DEPOIS de ativar notificações
        // (ignorar primeiros 10 segundos para não notificar eventos já existentes)
        if (now - startTime > 10000) {
            console.log('🆕 Novo evento detectado:', event.name);
            
            const eventDate = new Date(event.startDate);
            const formattedDate = eventDate.toLocaleDateString('pt-BR');
            
            showNotification('🎉 Novo Evento Adicionado!', {
                body: `${event.name}\n📅 ${formattedDate} às ${event.startTime}\n📍 ${event.area || 'Local não informado'}`,
                icon: '/logo/icone.png',
                badge: '/logo/icone.png',
                tag: 'evento-' + snapshot.key,
                requireInteraction: false
            });
        }
    });
    
    console.log('👂 Ouvindo novos eventos no Firebase...');
}

// Mostrar notificação
function showNotification(title, options) {
    if (!isNotificationSupported()) {
        console.warn('Notificações não suportadas');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.warn('Permissão de notificação não concedida');
        return;
    }
    
    try {
        const notification = new Notification(title, {
            icon: '/logo/icone.png',
            badge: '/logo/icone.png',
            ...options
        });
        
        // Ao clicar na notificação, focar na janela
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto-fechar após 10 segundos
        setTimeout(() => {
            notification.close();
        }, 10000);
        
        console.log('✅ Notificação exibida:', title);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
    }
}

// Atualizar botão de notificações
function updateNotificationButton() {
    const alertBtn = document.querySelector('.alert-btn');
    if (!alertBtn) return;
    
    if (isNotificationEnabled()) {
        // Notificações ativadas
        alertBtn.textContent = '✅ Alertas ativados';
        alertBtn.style.backgroundColor = '#4CAF50';
        alertBtn.style.color = 'white';
        alertBtn.style.cursor = 'default';
        alertBtn.disabled = false;
        
        alertBtn.onclick = () => {
            alert('✅ Notificações já estão ativadas!\n\nVocê receberá alertas sempre que um novo evento for adicionado.\n\nPara desativar, bloqueie as notificações nas configurações do navegador.');
        };
        
    } else if (Notification.permission === 'denied') {
        // Permissão negada
        alertBtn.textContent = '🔒 Notificações bloqueadas';
        alertBtn.style.backgroundColor = '#f44336';
        alertBtn.style.color = 'white';
        alertBtn.style.cursor = 'pointer';
        alertBtn.disabled = false;
        
        alertBtn.onclick = () => {
            alert('❌ As notificações estão bloqueadas.\n\nPara ativar:\n1. Clique no ícone de cadeado 🔒 na barra de endereço\n2. Em "Notificações", selecione "Permitir"\n3. Recarregue a página');
        };
        
    } else {
        // Não ativado ainda
        alertBtn.textContent = '🔔 Ativar alertas';
        alertBtn.style.backgroundColor = '';
        alertBtn.style.color = '';
        alertBtn.style.cursor = 'pointer';
        alertBtn.disabled = false;
        
        alertBtn.onclick = requestNotificationPermission;
    }
}

// Desativar notificações
function disableNotifications() {
    localStorage.removeItem('notificationsEnabled');
    localStorage.removeItem('notificationsStartTime');
    
    // Remover listeners
    if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('events').off('child_added');
    }
    
    updateNotificationButton();
    console.log('🔕 Notificações desativadas');
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔔 Sistema de notificações carregado');
    
    // Aguardar Firebase carregar
    setTimeout(() => {
        // Atualizar botão
        updateNotificationButton();
        
        // Se já estiver ativado, configurar listener
        if (isNotificationEnabled()) {
            console.log('✅ Notificações já estavam ativadas, reativando listener...');
            setupEventListener();
        }
    }, 1500);
});

console.log('📱 notifications.js carregado');
