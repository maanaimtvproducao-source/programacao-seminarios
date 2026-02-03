// ========================================
// Configuração Firebase Realtime Database
// ========================================

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

// Referência ao banco de dados
const database = firebase.database();

console.log('🔥 Firebase inicializado com sucesso!');

// ========================================
// Funções de Leitura e Escrita
// ========================================

/**
 * Carregar todos os dados do Firebase
 * @returns {Promise<Object>} Objeto com events, maanaims, users, pendingUsers
 */
async function loadFromFirebase() {
    try {
        console.log('📥 Carregando dados do Firebase...');
        
        const snapshot = await database.ref('/').once('value');
        const data = snapshot.val();
        
        if (data) {
            console.log('✅ Dados carregados com sucesso do Firebase!');
            return {
                events: data.events || [],
                maanaims: data.maanaims || [],
                users: data.users || [],
                pendingUsers: data.pendingUsers || []
            };
        } else {
            console.log('⚠️ Nenhum dado encontrado. Inicializando estrutura...');
            return {
                events: [],
                maanaims: [],
                users: [],
                pendingUsers: []
            };
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Firebase:', error);
        return null;
    }
}

/**
 * Salvar todos os dados no Firebase
 * @param {Object} allData Objeto com events, maanaims, users, pendingUsers
 * @returns {Promise<boolean>} True se salvou com sucesso
 */
async function saveToFirebase(allData) {
    try {
        console.log('💾 Salvando dados no Firebase...');
        
        // Adicionar timestamp
        allData.lastUpdate = new Date().toISOString();
        
        await database.ref('/').set(allData);
        
        console.log('✅ Dados salvos com sucesso no Firebase!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados no Firebase:', error);
        alert('Erro ao salvar dados. Verifique sua conexão.');
        return false;
    }
}

/**
 * Carregar dados com fallback para localStorage
 * @returns {Promise<Object>} Dados carregados
 */
async function loadDataWithFallback() {
    // Tentar carregar do Firebase
    const data = await loadFromFirebase();
    if (data) {
        // Salvar no localStorage como backup
        try {
            localStorage.setItem('seminarioBackup', JSON.stringify(data));
        } catch (e) {
            console.warn('Não foi possível salvar backup local');
        }
        return data;
    }
    
    // Fallback para localStorage
    console.log('📦 Usando dados do localStorage...');
    try {
        const backup = localStorage.getItem('seminarioBackup');
        if (backup) {
            return JSON.parse(backup);
        }
    } catch (e) {
        console.error('Erro ao ler localStorage');
    }
    
    // Retornar estrutura vazia
    return {
        events: [],
        maanaims: [],
        users: [],
        pendingUsers: []
    };
}

/**
 * Salvar dados com fallback para localStorage
 * @param {Object} allData Todos os dados
 * @returns {Promise<boolean>} True se salvou
 */
async function saveDataWithFallback(allData) {
    // Tentar salvar no Firebase
    const saved = await saveToFirebase(allData);
    
    // Sempre salvar no localStorage como backup
    try {
        localStorage.setItem('seminarioBackup', JSON.stringify(allData));
        localStorage.setItem('seminarioEvents', JSON.stringify(allData.events || []));
        localStorage.setItem('seminarioMaanaims', JSON.stringify(allData.maanaims || []));
        localStorage.setItem('seminarioUsers', JSON.stringify(allData.users || []));
        localStorage.setItem('seminarioPendingUsers', JSON.stringify(allData.pendingUsers || []));
        console.log('💾 Backup local salvo');
    } catch (e) {
        console.error('Erro ao salvar no localStorage');
    }
    
    return saved;
}

// ========================================
// Dados Iniciais para Popular o Firebase
// ========================================
const INITIAL_FIREBASE_DATA = {
    "events": [],
    "maanaims": [
        {
            "id": "1",
            "name": "Domingos Martins",
            "slug": "domingos-martins"
        },
        {
            "id": "2",
            "name": "Terra Vermelha",
            "slug": "terra-vermelha"
        }
    ],
    "users": [
        {
            "id": "1",
            "username": "admin",
            "password": "admin123",
            "role": "admin",
            "maanaim": null
        }
    ],
    "pendingUsers": [],
    "lastUpdate": null
};

// Inicializar dados se necessário
async function initializeFirebaseData() {
    try {
        const snapshot = await database.ref('/').once('value');
        if (!snapshot.exists()) {
            console.log('🔄 Inicializando dados no Firebase...');
            await saveToFirebase(INITIAL_FIREBASE_DATA);
            console.log('✅ Dados iniciais salvos no Firebase!');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar dados:', error);
    }
}

// Inicializar ao carregar
initializeFirebaseData();
