// Sistema de Administração - Programação de Seminários

// ─── Imgur ────────────────────────────────────────────────────────────────────
// Client ID: crie em https://api.imgur.com/oauth2/addclient (Anonymous usage)
const IMGUR_CLIENT_ID = 'c9a6efb3d7932fd';

async function uploadToImgur(file) {
    const status = document.getElementById('eventImageStatus');
    if (status) status.textContent = '⏳ Enviando imagem para Imgur...';

    const formData = new FormData();
    formData.append('image', file);

    const resp = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: { 'Authorization': `Client-ID ${IMGUR_CLIENT_ID}` },
        body: formData
    });

    const json = await resp.json();
    if (!resp.ok || !json.success) {
        throw new Error(json.data?.error || 'Falha no upload para Imgur');
    }

    if (status) status.textContent = '✅ Imagem enviada!';
    return json.data.link; // URL pública da imagem
}

// Gerenciamento de Estado
const state = {
    currentUser: null,
    events: [],
    users: [],
    pendingUsers: [],
    maanaims: []
};

// Dados iniciais
const initialUsers = [
    {
        id: '1',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        maanaim: null
    }
];

const initialMaanaims = [
    { id: '1', name: 'Domingos Martins', slug: 'domingos-martins' },
    { id: '2', name: 'Terra Vermelha', slug: 'terra-vermelha' },
    { id: '3', name: 'Cariacica', slug: 'cariacica' },
    { id: '4', name: 'Carapina', slug: 'carapina' }
];

// Inicialização
async function init() {
    await loadFromLocalStorage();
    cleanOldEvents();
    setupEventListeners();
    setupRealtimeListeners(); // Adicionar listeners em tempo real
    checkAuth();
}

// ========================================
// ATUALIZAÇÃO EM TEMPO REAL
// ========================================

function setupRealtimeListeners() {
    // Listener para eventos
    const eventsRef = firebase.database().ref('events');
    
    // Quando um evento é adicionado
    eventsRef.on('child_added', (snapshot) => {
        const newEvent = snapshot.val();
        const existingIndex = state.events.findIndex(e => e.id === newEvent.id);
        
        if (existingIndex === -1) {
            // Evento realmente novo, adicionar
            state.events.push(newEvent);
            console.log('✅ Novo evento detectado:', newEvent.name);
            
            // Atualizar lista de eventos (se estiver visível)
            if (state.currentUser) {
                renderEventsList();
            }
        }
    });
    
    // Quando um evento é modificado
    eventsRef.on('child_changed', (snapshot) => {
        const updatedEvent = snapshot.val();
        const index = state.events.findIndex(e => e.id === updatedEvent.id);
        
        if (index !== -1) {
            state.events[index] = updatedEvent;
            console.log('✏️ Evento atualizado:', updatedEvent.name);
            
            // Atualizar lista de eventos
            if (state.currentUser) {
                renderEventsList();
            }
        }
    });
    
    // Quando um evento é removido
    eventsRef.on('child_removed', (snapshot) => {
        const removedEvent = snapshot.val();
        state.events = state.events.filter(e => e.id !== removedEvent.id);
        console.log('🗑️ Evento removido:', removedEvent.name);
        
        // Atualizar lista de eventos
        if (state.currentUser) {
            renderEventsList();
        }
    });
    
    // Listener para usuários pendentes
    const pendingUsersRef = firebase.database().ref('pendingUsers');
    
    pendingUsersRef.on('value', (snapshot) => {
        const pending = [];
        snapshot.forEach((child) => {
            pending.push(child.val());
        });
        
        state.pendingUsers = pending;
        
        // Atualizar badge de aprovações pendentes
        if (state.currentUser?.role === 'admin') {
            updatePendingBadge();
            renderPendingList();
        }
    });
    
    // Listener para maanaims
    const maanaimsRef = firebase.database().ref('maanaims');
    
    maanaimsRef.on('value', (snapshot) => {
        const maanaims = [];
        snapshot.forEach((child) => {
            maanaims.push(child.val());
        });
        
        // Verificar se houve mudança
        if (JSON.stringify(maanaims) !== JSON.stringify(state.maanaims)) {
            state.maanaims = maanaims;
            console.log('🏛️ Maanaims atualizados');
            
            if (state.currentUser) {
                renderMaanaimSelect();
                if (state.currentUser.role === 'admin') {
                    renderMaanaimsList();
                }
            }
        }
    });
    
    // Listener para usuários (apenas para admin)
    if (state.currentUser?.role === 'admin') {
        const usersRef = firebase.database().ref('users');
        
        usersRef.on('value', (snapshot) => {
            const users = [];
            snapshot.forEach((child) => {
                users.push(child.val());
            });
            
            state.users = users;
            renderUsersList();
        });
    }
    
    console.log('🔄 Listeners em tempo real configurados (Admin)');
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
        console.log(`${eventsBeforeClean - state.events.length} evento(s) antigo(s) removido(s) automaticamente`);
    }
}

// LocalStorage com JSONBin
async function loadFromLocalStorage() {
    // Tentar carregar do JSONBin primeiro
    const data = await loadDataWithFallback();
    
    if (data) {
        state.events = data.events || [];
        state.users = data.users || initialUsers;
        state.pendingUsers = data.pendingUsers || [];
        state.maanaims = data.maanaims || initialMaanaims;
    }
    
    // Carregar usuário atual do localStorage (específico do navegador)
    const savedCurrentUser = localStorage.getItem('seminarioCurrentUser');
    state.currentUser = savedCurrentUser ? JSON.parse(savedCurrentUser) : null;
}

async function saveToLocalStorage() {
    // Preparar todos os dados
    const allData = {
        events: state.events,
        users: state.users,
        pendingUsers: state.pendingUsers,
        maanaims: state.maanaims
    };
    
    // Salvar no JSONBin
    await saveDataWithFallback(allData);
    
    // Salvar usuário atual apenas no localStorage local
    if (state.currentUser) {
        localStorage.setItem('seminarioCurrentUser', JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem('seminarioCurrentUser');
    }
}

// Event Listeners
function setupEventListeners() {
    // Login e Cadastro
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegisterForm')?.addEventListener('click', showRegisterForm);
    document.getElementById('showLoginForm')?.addEventListener('click', showLoginForm);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(targetTab + 'Section').classList.add('active');
            
            if (targetTab === 'aprovacoes') {
                renderPendingUsers();
            }
        });
    });

    // Forms
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    document.getElementById('cancelEventBtn').addEventListener('click', clearEventForm);
    
    // Listener para ocultar classe e área se Terra Vermelha for selecionado
    const eventMaanaimSelect = document.getElementById('eventMaanaim');
    const eventClassGroup = document.getElementById('eventClass').closest('.form-group');
    const eventAreaGroup = document.getElementById('eventArea').closest('.form-group');
    
    eventMaanaimSelect.addEventListener('change', () => {
        const selectedMaanaim = eventMaanaimSelect.value;
        const isTerraVermelha = selectedMaanaim === 'terra-vermelha';

        if (isTerraVermelha) {
            // Ocultar campo classe e área (fixos para TV)
            eventClassGroup.style.display = 'none';
            document.getElementById('eventClass').removeAttribute('required');
            document.getElementById('eventClass').value = 'geral';
            
            eventAreaGroup.style.display = 'none';
            document.getElementById('eventArea').removeAttribute('required');
            document.getElementById('eventArea').value = 'TEMPLO';

            // Mostrar campo de imagem
            const imageRow = document.getElementById('eventImageRow');
            if (imageRow) imageRow.style.display = '';
        } else {
            // Mostrar campo classe e área
            eventClassGroup.style.display = '';
            document.getElementById('eventClass').setAttribute('required', 'required');
            
            eventAreaGroup.style.display = '';
            document.getElementById('eventArea').setAttribute('required', 'required');

            // Ocultar campo de imagem
            const imageRow = document.getElementById('eventImageRow');
            if (imageRow) imageRow.style.display = 'none';
            document.getElementById('eventImageUrl').value = '';
            document.getElementById('eventImagePreview').style.display = 'none';
            document.getElementById('eventImageStatus').textContent = '';
        }
    });

    // Preview da imagem ao selecionar arquivo
    const eventImageInput = document.getElementById('eventImage');
    if (eventImageInput) {
        eventImageInput.addEventListener('change', () => {
            const file = eventImageInput.files[0];
            if (!file) return;
            const preview = document.getElementById('eventImagePreview');
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            document.getElementById('eventImageStatus').textContent = '📷 Imagem selecionada. Será enviada ao salvar.';
            // Limpa URL anterior (será re-gerada ao salvar)
            document.getElementById('eventImageUrl').value = '';
        });
    }
    
    document.getElementById('maanaimForm').addEventListener('submit', handleMaanaimSubmit);
    document.getElementById('cancelMaanaimBtn').addEventListener('click', clearMaanaimForm);
    
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    
    // User role select
    document.getElementById('userRoleSelect').addEventListener('change', (e) => {
        const maanaimGroup = document.getElementById('maanaimSelectGroup');
        if (e.target.value === 'maanaim-admin') {
            maanaimGroup.style.display = 'block';
        } else {
            maanaimGroup.style.display = 'none';
        }
    });

    // Auto-generate slug from name
    document.getElementById('maanaimName')?.addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-') // Remove hífens duplicados
            .trim();
        document.getElementById('maanaimSlug').value = slug;
    });
}

// Autenticação
function checkAuth() {
    if (state.currentUser) {
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
    showLoginForm();
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    setupAdminPanel();
}

// Login e Cadastro
function showRegisterForm() {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
    populateMaanaimSelects();
}

function showLoginForm() {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('registerFormContainer').style.display = 'none';
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = state.users.find(u => u.username === username && u.password === password);

    if (user) {
        state.currentUser = user;
        saveToLocalStorage();
        document.getElementById('loginForm').reset();
        showAdminPanel();
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const maanaim = document.getElementById('registerMaanaim').value;

    // Verificar se email já existe
    const emailExists = state.users.some(u => u.username === email) || 
                       state.pendingUsers.some(u => u.username === email);
    
    if (emailExists) {
        alert('Este email já está cadastrado!');
        return;
    }

    // Criar usuário pendente
    const pendingUser = {
        id: Date.now().toString(),
        username: email,
        password: password,
        role: 'maanaim-admin',
        maanaim: maanaim,
        status: 'pending',
        requestDate: new Date().toISOString()
    };

    state.pendingUsers.push(pendingUser);
    saveToLocalStorage();

    alert('Cadastro solicitado com sucesso! Aguarde a aprovação de um administrador.');
    document.getElementById('registerForm').reset();
    showLoginForm();
}

function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        state.currentUser = null;
        saveToLocalStorage();
        showLoginScreen();
    }
}

// Admin Panel Setup
function setupAdminPanel() {
    const userRoleSpan = document.getElementById('userRole');
    const usuariosTab = document.getElementById('usuariosTab');
    const aprovacoesTab = document.getElementById('aprovacoesTab');
    const maanaimsTab = document.getElementById('maanaimsTab');

    if (state.currentUser.role === 'admin') {
        userRoleSpan.textContent = 'Administrador Geral';
        usuariosTab.style.display = 'inline-block';
        aprovacoesTab.style.display = 'inline-block';
        maanaimsTab.style.display = 'inline-block';
        updatePendingBadge();
    } else {
        userRoleSpan.textContent = `Admin - ${getMaanaimName(state.currentUser.maanaim)}`;
        usuariosTab.style.display = 'none';
        aprovacoesTab.style.display = 'none';
        maanaimsTab.style.display = 'none';
    }

    populateMaanaimSelects();
    renderAdminEvents();
    renderMaanaimsList();
    
    if (state.currentUser.role === 'admin') {
        renderUsersList();
        renderPendingUsers();
    }
}

// Maanaims Management
function populateMaanaimSelects() {
    const selects = [
        document.getElementById('eventMaanaim'),
        document.getElementById('userMaanaim'),
        document.getElementById('registerMaanaim')
    ];

    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = state.maanaims.map(m => 
            `<option value="${m.slug}">${m.name}</option>`
        ).join('');
        if (currentValue) select.value = currentValue;
    });

    // Configurar campo de Maanaim para admin de maanaim
    const eventMaanaimSelect = document.getElementById('eventMaanaim');
    if (state.currentUser && state.currentUser.role === 'maanaim-admin') {
        eventMaanaimSelect.value = state.currentUser.maanaim;
        eventMaanaimSelect.disabled = true;
        eventMaanaimSelect.style.background = '#F3F4F6';
        eventMaanaimSelect.style.cursor = 'not-allowed';
    } else if (eventMaanaimSelect) {
        eventMaanaimSelect.disabled = false;
        eventMaanaimSelect.style.background = '';
        eventMaanaimSelect.style.cursor = '';
    }
}

function renderMaanaimsList() {
    if (state.currentUser?.role !== 'admin') return;

    const list = document.getElementById('maanaimsList');
    list.innerHTML = '';

    if (state.maanaims.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhum Maanaim cadastrado</p>';
        return;
    }

    state.maanaims.forEach(maanaim => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <h4>${maanaim.name}</h4>
                <p>Slug: ${maanaim.slug}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" data-id="${maanaim.id}">Editar</button>
                <button class="btn-delete" data-id="${maanaim.id}">Excluir</button>
            </div>
        `;

        item.querySelector('.btn-edit').addEventListener('click', () => editMaanaim(maanaim.id));
        item.querySelector('.btn-delete').addEventListener('click', () => deleteMaanaim(maanaim.id));

        list.appendChild(item);
    });
}

function handleMaanaimSubmit(e) {
    e.preventDefault();

    const maanaimId = document.getElementById('maanaimId').value;
    const maanaimData = {
        id: maanaimId || Date.now().toString(),
        name: document.getElementById('maanaimName').value,
        slug: document.getElementById('maanaimSlug').value
    };

    // Verificar se slug já existe
    const slugExists = state.maanaims.some(m => 
        m.slug === maanaimData.slug && m.id !== maanaimData.id
    );

    if (slugExists) {
        alert('Já existe um Maanaim com este identificador!');
        return;
    }

    if (maanaimId) {
        // Update
        const index = state.maanaims.findIndex(m => m.id === maanaimId);
        if (index > -1) {
            state.maanaims[index] = maanaimData;
        }
    } else {
        // Create
        state.maanaims.push(maanaimData);
    }

    saveToLocalStorage();
    renderMaanaimsList();
    populateMaanaimSelects();
    clearMaanaimForm();
    alert('Maanaim salvo com sucesso!');
}

function editMaanaim(maanaimId) {
    const maanaim = state.maanaims.find(m => m.id === maanaimId);
    if (!maanaim) return;

    document.getElementById('maanaimId').value = maanaim.id;
    document.getElementById('maanaimName').value = maanaim.name;
    document.getElementById('maanaimSlug').value = maanaim.slug;
    document.getElementById('maanaimName').focus();
}

function deleteMaanaim(maanaimId) {
    const maanaim = state.maanaims.find(m => m.id === maanaimId);
    if (!maanaim) return;

    // Verificar se há eventos ou usuários usando este Maanaim
    const hasEvents = state.events.some(e => e.maanaim === maanaim.slug);
    const hasUsers = state.users.some(u => u.maanaim === maanaim.slug);

    if (hasEvents || hasUsers) {
        alert('Não é possível excluir este Maanaim pois existem eventos ou usuários associados a ele.');
        return;
    }

    if (confirm(`Tem certeza que deseja excluir o Maanaim "${maanaim.name}"?`)) {
        state.maanaims = state.maanaims.filter(m => m.id !== maanaimId);
        saveToLocalStorage();
        renderMaanaimsList();
        populateMaanaimSelects();
    }
}

function clearMaanaimForm() {
    document.getElementById('maanaimForm').reset();
    document.getElementById('maanaimId').value = '';
}

function getMaanaimName(slug) {
    const maanaim = state.maanaims.find(m => m.slug === slug);
    return maanaim ? maanaim.name : slug;
}

// Events Management
function renderAdminEvents() {
    const list = document.getElementById('adminEventsList');
    let events = state.events;

    // Filter by user permission
    if (state.currentUser.role === 'maanaim-admin') {
        events = events.filter(e => e.maanaim === state.currentUser.maanaim);
    }

    list.innerHTML = '';

    if (events.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhum evento cadastrado</p>';
        return;
    }

    events.forEach(event => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <h4>${event.name}</h4>
                <p>${event.startDate} - ${getMaanaimName(event.maanaim)}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" data-id="${event.id}">Editar</button>
                <button class="btn-delete" data-id="${event.id}">Excluir</button>
            </div>
        `;

        item.querySelector('.btn-edit').addEventListener('click', () => editEvent(event.id));
        item.querySelector('.btn-delete').addEventListener('click', () => deleteEvent(event.id));

        list.appendChild(item);
    });
}

async function handleEventSubmit(e) {
    e.preventDefault();

    const eventId = document.getElementById('eventId').value;
    const selectedMaanaim = document.getElementById('eventMaanaim').value;
    
    // FORÇAR classe = "geral" e área = "TEMPLO" se for Terra Vermelha
    let eventClass = document.getElementById('eventClass').value;
    let eventArea = document.getElementById('eventArea').value;
    if (selectedMaanaim === 'terra-vermelha') {
        eventClass = 'geral';
        eventArea = 'TEMPLO';
    }

    // Upload de imagem para Imgur (apenas Terra Vermelha)
    let inviteImage = document.getElementById('eventImageUrl')?.value || '';
    const imageFile = document.getElementById('eventImage')?.files?.[0];
    if (selectedMaanaim === 'terra-vermelha' && imageFile) {
        try {
            inviteImage = await uploadToImgur(imageFile);
        } catch (err) {
            alert('Erro ao enviar imagem: ' + err.message);
            return;
        }
    }
    
    const eventData = {
        id: eventId || Date.now().toString(),
        name: document.getElementById('eventName').value,
        class: eventClass,
        startDate: document.getElementById('eventStartDate').value,
        endDate: document.getElementById('eventEndDate').value,
        startTime: document.getElementById('eventStartTime').value,
        endTime: document.getElementById('eventEndTime').value,
        maanaim: selectedMaanaim,
        area: eventArea,
        price: parseFloat(document.getElementById('eventPrice').value),
        deadline: document.getElementById('eventDeadline').value,
        inviteImage: inviteImage || null
    };

    // Check permission
    if (state.currentUser.role === 'maanaim-admin' && eventData.maanaim !== state.currentUser.maanaim) {
        alert('Você só pode adicionar eventos do seu Maanaim!');
        return;
    }

    if (eventId) {
        // Update
        const index = state.events.findIndex(e => e.id === eventId);
        if (index > -1) {
            state.events[index] = eventData;
        }
    } else {
        // Create
        state.events.push(eventData);
    }

    saveToLocalStorage();
    renderAdminEvents();
    clearEventForm();
    alert('Evento salvo com sucesso!');
}

function editEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;

    // Check permission
    if (state.currentUser.role === 'maanaim-admin' && event.maanaim !== state.currentUser.maanaim) {
        alert('Você só pode editar eventos do seu Maanaim!');
        return;
    }

    document.getElementById('eventId').value = event.id;
    document.getElementById('eventName').value = event.name;
    document.getElementById('eventClass').value = event.class;
    document.getElementById('eventStartDate').value = event.startDate;
    document.getElementById('eventEndDate').value = event.endDate;
    document.getElementById('eventStartTime').value = event.startTime;
    document.getElementById('eventEndTime').value = event.endTime;
    document.getElementById('eventMaanaim').value = event.maanaim;
    document.getElementById('eventArea').value = event.area;
    document.getElementById('eventPrice').value = event.price;
    document.getElementById('eventDeadline').value = event.deadline;
    
    // Disparar evento change do maanaim para ocultar/mostrar campos de TV
    document.getElementById('eventMaanaim').dispatchEvent(new Event('change'));

    // Carregar imagem existente (se Terra Vermelha)
    if (event.inviteImage) {
        document.getElementById('eventImageUrl').value = event.inviteImage;
        const preview = document.getElementById('eventImagePreview');
        if (preview) {
            preview.src = event.inviteImage;
            preview.style.display = 'block';
        }
        const status = document.getElementById('eventImageStatus');
        if (status) status.textContent = '🖼️ Imagem atual carregada. Selecione outra para substituir.';
    }
    
    document.getElementById('eventName').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;

    // Check permission
    if (state.currentUser.role === 'maanaim-admin' && event.maanaim !== state.currentUser.maanaim) {
        alert('Você só pode excluir eventos do seu Maanaim!');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este evento?')) {
        state.events = state.events.filter(e => e.id !== eventId);
        saveToLocalStorage();
        renderAdminEvents();
    }
}

function clearEventForm() {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    
    // Restaurar o Maanaim se for admin de maanaim
    if (state.currentUser && state.currentUser.role === 'maanaim-admin') {
        document.getElementById('eventMaanaim').value = state.currentUser.maanaim;
    }
    
    // Disparar evento change para atualizar visibilidade dos campos
    document.getElementById('eventMaanaim').dispatchEvent(new Event('change'));

    // Limpar campos de imagem
    const imgInput = document.getElementById('eventImage');
    if (imgInput) imgInput.value = '';
    const imgUrl = document.getElementById('eventImageUrl');
    if (imgUrl) imgUrl.value = '';
    const imgPreview = document.getElementById('eventImagePreview');
    if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
    const imgStatus = document.getElementById('eventImageStatus');
    if (imgStatus) imgStatus.textContent = '';
}

// Users Management
function renderUsersList() {
    if (state.currentUser.role !== 'admin') return;

    const list = document.getElementById('usersList');
    list.innerHTML = '';

    if (state.users.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhum usuário cadastrado</p>';
        return;
    }

    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        
        const roleText = user.role === 'admin' ? 'Administrador Geral' : 
                        `Admin - ${getMaanaimName(user.maanaim)}`;

        item.innerHTML = `
            <div class="admin-item-info">
                <h4>${user.username}</h4>
                <p>${roleText}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-delete" data-id="${user.id}">Excluir</button>
            </div>
        `;

        item.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.id));

        list.appendChild(item);
    });
}

function handleUserSubmit(e) {
    e.preventDefault();

    if (state.currentUser.role !== 'admin') {
        alert('Apenas administradores podem gerenciar usuários!');
        return;
    }

    const userData = {
        id: Date.now().toString(),
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('userRoleSelect').value,
        maanaim: document.getElementById('userRoleSelect').value === 'maanaim-admin' ? 
                 document.getElementById('userMaanaim').value : null
    };

    state.users.push(userData);
    saveToLocalStorage();
    renderUsersList();
    document.getElementById('userForm').reset();
    alert('Usuário adicionado com sucesso!');
}

function deleteUser(userId) {
    if (state.currentUser.role !== 'admin') {
        alert('Apenas administradores podem gerenciar usuários!');
        return;
    }

    if (userId === state.currentUser.id) {
        alert('Você não pode excluir seu próprio usuário!');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        state.users = state.users.filter(u => u.id !== userId);
        saveToLocalStorage();
        renderUsersList();
    }
}

// Pending Users Management
function renderPendingUsers() {
    if (state.currentUser?.role !== 'admin') return;

    const list = document.getElementById('pendingUsersList');
    if (!list) return;

    list.innerHTML = '';

    if (state.pendingUsers.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhuma solicitação pendente</p>';
        return;
    }

    state.pendingUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        
        const requestDate = new Date(user.requestDate);
        const dateStr = requestDate.toLocaleDateString('pt-BR');

        item.innerHTML = `
            <div class="admin-item-info">
                <h4>${user.username}</h4>
                <p>Maanaim: ${getMaanaimName(user.maanaim)} - Solicitado em ${dateStr}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-approve" data-id="${user.id}">Aprovar</button>
                <button class="btn-delete" data-id="${user.id}">Rejeitar</button>
            </div>
        `;

        item.querySelector('.btn-approve').addEventListener('click', () => approveUser(user.id));
        item.querySelector('.btn-delete').addEventListener('click', () => rejectUser(user.id));

        list.appendChild(item);
    });

    updatePendingBadge();
}

function approveUser(userId) {
    const user = state.pendingUsers.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Aprovar o cadastro de ${user.username}?`)) {
        // Remove da lista de pendentes
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== userId);
        
        // Adiciona aos usuários aprovados
        delete user.status;
        delete user.requestDate;
        state.users.push(user);
        
        saveToLocalStorage();
        renderPendingUsers();
        renderUsersList();
        alert('Usuário aprovado com sucesso!');
    }
}

function rejectUser(userId) {
    const user = state.pendingUsers.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Rejeitar o cadastro de ${user.username}?`)) {
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== userId);
        saveToLocalStorage();
        renderPendingUsers();
        alert('Solicitação rejeitada.');
    }
}

function updatePendingBadge() {
    const badge = document.getElementById('pendingBadge');
    if (!badge) return;

    const count = state.pendingUsers.length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
