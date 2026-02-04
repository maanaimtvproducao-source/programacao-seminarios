// Sistema de Programação de Seminários - Página Pública
// Gerenciamento de Estado
const state = {
    events: [],
    maanaims: [],
    favorites: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null,
    selectedMaanaim: 'todos',
    selectedFilter: 'todos'
};

// Inicialização
async function init() {
    await loadFromLocalStorage();
    cleanOldEvents();
    setupEventListeners();
    setupRealtimeListeners(); // Adicionar listeners em tempo real
    renderMaanaimGrid();
    renderCalendar();
    renderEvents();
    loadFavorites();
}

// ========================================
// ATUALIZAÇÃO EM TEMPO REAL
// ========================================

function setupRealtimeListeners() {
    console.log('🔄 Configurando listeners em tempo real...');
    
    // Usar 'value' para escutar mudanças em toda a estrutura
    const eventsRef = firebase.database().ref('events');
    
    // Flag para ignorar primeira carga
    let isFirstLoad = true;
    
    eventsRef.on('value', (snapshot) => {
        if (isFirstLoad) {
            // Primeira vez, apenas marcar como carregado
            isFirstLoad = false;
            console.log('✅ Listener de eventos ativo');
            return;
        }
        
        // Atualizar todos os eventos
        const newEvents = [];
        snapshot.forEach((child) => {
            newEvents.push(child.val());
        });
        
        // Verificar se houve mudança real
        if (JSON.stringify(newEvents) !== JSON.stringify(state.events)) {
            console.log('🔄 Eventos atualizados pelo Firebase!');
            console.log(`   Antes: ${state.events.length} eventos`);
            console.log(`   Depois: ${newEvents.length} eventos`);
            
            state.events = newEvents;
            
            // Atualizar interface
            renderCalendar();
            renderEvents();
            
            // Mostrar notificação visual (opcional)
            showUpdateNotification();
        }
    });
    
    // Listener para maanaims
    const maanaimsRef = firebase.database().ref('maanaims');
    let isFirstMaanaimLoad = true;
    
    maanaimsRef.on('value', (snapshot) => {
        if (isFirstMaanaimLoad) {
            isFirstMaanaimLoad = false;
            console.log('✅ Listener de maanaims ativo');
            return;
        }
        
        const maanaims = [];
        snapshot.forEach((child) => {
            maanaims.push(child.val());
        });
        
        // Verificar se houve mudança
        if (JSON.stringify(maanaims) !== JSON.stringify(state.maanaims)) {
            console.log('🏛️ Maanaims atualizados pelo Firebase!');
            state.maanaims = maanaims;
            renderMaanaimGrid();
        }
    });
    
    console.log('✅ Listeners em tempo real configurados e ativos');
}

// Mostrar notificação de atualização (feedback visual)
function showUpdateNotification() {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '✅ Eventos atualizados!';
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// LocalStorage com JSONBin
async function loadFromLocalStorage() {
    // Tentar carregar do JSONBin primeiro
    const data = await loadDataWithFallback();
    
    if (data) {
        state.events = data.events || [];
        state.maanaims = data.maanaims || [];
    }
    
    // Favoritos são específicos do usuário (localStorage local)
    const savedFavorites = localStorage.getItem('seminarioFavorites');
    state.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
}

function saveToLocalStorage() {
    localStorage.setItem('seminarioFavorites', JSON.stringify(state.favorites));
}

function saveFavorites() {
    saveToLocalStorage();
}

// Limpeza automática de eventos passados
function cleanOldEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Filtrar eventos que já passaram (dia anterior)
    const eventsBeforeClean = state.events.length;
    state.events = state.events.filter(event => {
        // Evento fica até o dia que acontece, é removido no dia seguinte
        return event.endDate >= yesterdayStr;
    });
    
    // Se removeu eventos, atualizar localStorage
    if (state.events.length < eventsBeforeClean) {
        localStorage.setItem('seminarioEvents', JSON.stringify(state.events));
        console.log(`${eventsBeforeClean - state.events.length} evento(s) antigo(s) removido(s)`);
    }
}

// Event Listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar();
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        const today = new Date();
        state.currentMonth = today.getMonth();
        state.currentYear = today.getFullYear();
        renderCalendar();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedFilter = btn.dataset.filter;
            renderEvents();
        });
    });

    // Modals
    document.querySelectorAll('.close, .close-round').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

// Renderizar Maanaims dinamicamente
function renderMaanaimGrid() {
    const grid = document.getElementById('maanaimGrid');
    if (!grid) return;

    // Limpar grid
    grid.innerHTML = '';
    
    // Adicionar botão "Todos"
    const allBtn = document.createElement('button');
    allBtn.className = 'maanaim-card active';
    allBtn.dataset.maanaim = 'todos';
    allBtn.innerHTML = `
        <span class="icon">🎯</span>
        <span>Todos os Maanaim</span>
    `;
    grid.appendChild(allBtn);

    // Adicionar apenas Maanaims que existem no sistema
    state.maanaims.forEach(maanaim => {
        const card = document.createElement('button');
        card.className = 'maanaim-card';
        card.dataset.maanaim = maanaim.slug;
        card.innerHTML = `
            <span class="icon">🏛️</span>
            <span>${maanaim.name}</span>
        `;
        grid.appendChild(card);
    });

    // Adicionar event listeners
    grid.querySelectorAll('.maanaim-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.maanaim-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedMaanaim = card.dataset.maanaim;
            renderEvents();
        });
    });
}

// Calendário
function renderCalendar() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    document.getElementById('monthName').textContent = months[state.currentMonth];
    document.getElementById('yearName').textContent = state.currentYear;

    const firstDay = new Date(state.currentYear, state.currentMonth, 1);
    const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
    const prevLastDay = new Date(state.currentYear, state.currentMonth, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    let calendarHTML = '';

    // Headers
    daysOfWeek.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Previous month days
    for (let x = firstDayIndex; x > 0; x--) {
        calendarHTML += `<div class="calendar-day other-month">${prevLastDayDate - x + 1}</div>`;
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= lastDayDate; day++) {
        const dateStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = state.events.some(event => 
            event.startDate <= dateStr && dateStr <= event.endDate
        );
        
        let classes = 'calendar-day';
        if (today.getDate() === day && 
            today.getMonth() === state.currentMonth && 
            today.getFullYear() === state.currentYear) {
            classes += ' today';
        }
        if (state.selectedDate === dateStr) {
            classes += ' selected';
        }
        if (hasEvent) {
            classes += ' has-event';
        }

        calendarHTML += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    // Next month days
    const totalCells = firstDayIndex + lastDayDate;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        calendarHTML += `<div class="calendar-day other-month">${day}</div>`;
    }

    document.getElementById('calendarGrid').innerHTML = calendarHTML;

    // Add click events to days
    document.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
        day.addEventListener('click', () => {
            state.selectedDate = day.dataset.date;
            renderCalendar();
            showEventsForDate(day.dataset.date);
        });
    });
}

function showEventsForDate(date) {
    const placeholder = document.getElementById('eventsPlaceholder');
    const eventsOnDate = state.events.filter(event => 
        event.startDate <= date && date <= event.endDate
    );

    if (eventsOnDate.length > 0) {
        placeholder.innerHTML = '<div class="events-grid" style="padding: 20px;"></div>';
        const grid = placeholder.querySelector('.events-grid');
        eventsOnDate.forEach(event => {
            grid.appendChild(createEventCard(event));
        });
    } else {
        placeholder.innerHTML = `
            <span class="calendar-icon">📅</span>
            <p>Nenhum evento nesta data</p>
        `;
    }
}

// Eventos
function renderEvents() {
    const grid = document.getElementById('eventsGrid');
    let filteredEvents = state.events;

    // Filter by Maanaim
    if (state.selectedMaanaim !== 'todos') {
        filteredEvents = filteredEvents.filter(e => e.maanaim === state.selectedMaanaim);
    }

    // Filter by class
    if (state.selectedFilter !== 'todos' && state.selectedFilter !== 'favoritos') {
        filteredEvents = filteredEvents.filter(e => {
            // REGRA: Ao filtrar por classe, Terra Vermelha NUNCA aparece
            // (a menos que esteja filtrado especificamente por Terra Vermelha no maanaim)
            if (e.maanaim === 'terra-vermelha' && state.selectedMaanaim !== 'terra-vermelha') {
                return false; // Oculta Terra Vermelha
            }
            
            // Para outros maanaims (Domingos Martins), filtra normalmente por classe
            return e.class === state.selectedFilter;
        });
    }

    if (state.selectedFilter === 'favoritos') {
        filteredEvents = filteredEvents.filter(e => state.favorites.includes(e.id));
    }

    grid.innerHTML = '';
    filteredEvents.forEach(event => {
        grid.appendChild(createEventCard(event));
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const classColors = {
        'unidos': 'bg-purple',
        'principiantes': 'bg-orange',
        'geral': 'bg-blue',
        '1periodo': 'bg-blue',
        '2periodo': 'bg-green',
        '3periodo': 'bg-purple',
        '4periodo': 'bg-blue',
        '5periodo': 'bg-teal',
        '6periodo': 'bg-green'
    };

    const classNames = {
        'unidos': 'UNIDOS EM FAMÍLIA',
        'principiantes': 'PRINCIPIANTES',
        'geral': 'GERAL',
        '1periodo': '1º PERÍODO',
        '2periodo': '2º PERÍODO',
        '3periodo': '3º PERÍODO',
        '4periodo': '4º PERÍODO',
        '5periodo': '5º PERÍODO',
        '6periodo': '6º PERÍODO'
    };

    const startDate = new Date(event.startDate + 'T00:00:00');
    const endDate = new Date(event.endDate + 'T00:00:00');
    const isFavorite = state.favorites.includes(event.id);

    card.innerHTML = `
        <div class="event-card-header ${classColors[event.class] || 'bg-blue'}">
            <span>${classNames[event.class] || event.class.toUpperCase()}</span>
            <span>🔔</span>
        </div>
        <div class="event-card-body">
            <h3 class="event-card-title">${event.name}</h3>
            <div class="event-info">
                <div class="event-info-item">
                    <span class="icon">📅</span>
                    <span>${formatDate(startDate)} ${startDate.getTime() !== endDate.getTime() ? '- ' + formatDate(endDate) : ''}</span>
                </div>
                <div class="event-info-item">
                    <span class="icon">🏛️</span>
                    <span>${event.area}</span>
                </div>
            </div>
            <div class="event-price">R$ ${event.price.toFixed(2).replace('.', ',')}</div>
            <div class="event-price-label">A partir de</div>
            <div class="event-actions">
                <button class="btn-icon favorite ${isFavorite ? 'active' : ''}" data-event-id="${event.id}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
                <button class="btn-icon share" data-event-id="${event.id}">📤</button>
                <button class="btn-arrow" data-event-id="${event.id}">→</button>
            </div>
        </div>
    `;

    // Event listeners
    // Card inteiro abre o modal
    card.addEventListener('click', () => openEventModal(event));
    
    // Botões de ação não propagam o clique para o card
    card.querySelector('.favorite').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(event.id);
    });
    card.querySelector('.share').addEventListener('click', (e) => {
        e.stopPropagation();
        shareEvent(event);
    });
    card.querySelector('.btn-arrow').addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(event);
    });

    return card;
}

function formatDate(date) {
    const day = date.getDate();
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                   'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${day.toString().padStart(2, '0')} ${months[date.getMonth()]}`;
}

// Modal de Evento
function openEventModal(event) {
    const modal = document.getElementById('eventModal');
    const header = document.getElementById('eventModalHeader');
    const body = document.getElementById('eventModalBody');

    const classColors = {
        'unidos': 'bg-purple',
        'principiantes': 'bg-orange',
        'geral': 'bg-blue',
        '1periodo': 'bg-blue',
        '2periodo': 'bg-green',
        '3periodo': 'bg-purple',
        '4periodo': 'bg-blue',
        '5periodo': 'bg-teal',
        '6periodo': 'bg-green'
    };

    const classNames = {
        'unidos': 'UNIDOS EM FAMÍLIA',
        'principiantes': 'PRINCIPIANTES',
        'geral': 'GERAL',
        '1periodo': '1º PERÍODO',
        '2periodo': '2º PERÍODO',
        '3periodo': '3º PERÍODO',
        '4periodo': '4º PERÍODO',
        '5periodo': '5º PERÍODO',
        '6periodo': '6º PERÍODO'
    };

    const startDate = new Date(event.startDate + 'T00:00:00');
    const endDate = new Date(event.endDate + 'T00:00:00');
    const deadline = new Date(event.deadline + 'T00:00:00');

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const maanaimName = getMaanaimName(event.maanaim);

    header.className = `event-modal-header ${classColors[event.class] || 'bg-blue'}`;
    header.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
            ${classNames[event.class] || event.class.toUpperCase()}
        </div>
        <div class="event-modal-title">${event.name}</div>
        <div class="event-dates">
            <div class="event-date">
                <div class="event-date-label">INÍCIO</div>
                <div class="event-date-day">${startDate.getDate()}</div>
                <div class="event-date-month">${months[startDate.getMonth()]}</div>
                <div class="event-date-time">${event.startTime}</div>
            </div>
            <div class="event-date">
                <div class="event-date-label">FIM</div>
                <div class="event-date-day">${endDate.getDate()}</div>
                <div class="event-date-month">${months[endDate.getMonth()]}</div>
                <div class="event-date-time">${event.endTime}</div>
            </div>
        </div>
    `;

    body.innerHTML = `
        <div class="event-detail-item">
            <div class="event-detail-icon">🏛️</div>
            <div class="event-detail-content">
                <div class="event-detail-label">Área</div>
                <div class="event-detail-value">${event.area}</div>
            </div>
        </div>
        <div class="event-detail-item">
            <div class="event-detail-icon">📍</div>
            <div class="event-detail-content">
                <div class="event-detail-label">Local</div>
                <div class="event-detail-value">${maanaimName}</div>
            </div>
        </div>
        <div class="event-detail-item">
            <div class="event-detail-icon">💰</div>
            <div class="event-detail-content">
                <div class="event-detail-label">Valores</div>
                <div class="event-detail-value">R$ ${event.price.toFixed(2).replace('.', ',')} adulto 0</div>
            </div>
        </div>
        <div class="event-deadline">
            <div class="event-deadline-label">
                <span>⏰</span>
                <span>Inscrições até</span>
            </div>
            <div class="event-deadline-date">${deadline.getDate()} de ${months[deadline.getMonth()].toLowerCase()}</div>
        </div>
        <div class="event-share-label">Compartilhe com o responsável de inscrições:</div>
    `;

    modal.classList.add('show');

    // Set up share buttons
    document.getElementById('shareWhatsApp').onclick = () => shareEventWhatsApp(event);
    document.getElementById('copyText').onclick = () => copyEventText(event);
}

function shareEvent(event) {
    shareEventWhatsApp(event);
}

function shareEventWhatsApp(event) {
    const text = generateEventText(event);
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function copyEventText(event) {
    const text = generateEventText(event);
    navigator.clipboard.writeText(text).then(() => {
        alert('Texto copiado para a área de transferência!');
    });
}

function generateEventText(event) {
    const classNames = {
        'unidos': 'UNIDOS EM FAMÍLIA',
        'principiantes': 'PRINCIPIANTES',
        'geral': 'GERAL',
        '1periodo': '1º PERÍODO',
        '2periodo': '2º PERÍODO',
        '3periodo': '3º PERÍODO',
        '4periodo': '4º PERÍODO',
        '5periodo': '5º PERÍODO',
        '6periodo': '6º PERÍODO'
    };

    const maanaimName = getMaanaimName(event.maanaim);

    return `A paz do Senhor,\n` +
           `Por favor, me inscreva no evento:\n\n` +
           `🔶 *${classNames[event.class] || event.class.toUpperCase()}*\n` +
           `🏢 *Área:* ${event.area}\n` +
           `📅 *Data de início:* ${event.startDate.split('-').reverse().join('/')}\n` +
           `📍 *Local:* ${maanaimName}`;
}

function getMaanaimName(maanaimSlug) {
    const maanaim = state.maanaims.find(m => m.slug === maanaimSlug);
    return maanaim ? maanaim.name : maanaimSlug;
}

// Favoritos
function toggleFavorite(eventId) {
    const index = state.favorites.indexOf(eventId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(eventId);
    }
    saveFavorites();
    renderEvents();
}

function loadFavorites() {
    const saved = localStorage.getItem('seminarioFavorites');
    if (saved) {
        state.favorites = JSON.parse(saved);
    }
}

// Modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
