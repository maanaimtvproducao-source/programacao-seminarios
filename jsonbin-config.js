// ========================================
// Configuração JSONBin.io
// ========================================
// 1. Crie conta em: https://jsonbin.io
// 2. Crie um Bin com o JSON inicial
// 3. Copie seu Bin ID e API Key abaixo
// ========================================

const JSONBIN_CONFIG = {
    // Bin ID do seu JSONBin (PÚBLICO)
    binId: '6982498cae596e708f0eaafb',
    
    // Master Key ATUALIZADA (para criar/deletar bins e escrita)
    masterKey: '$2a$10$nxquLFaza/pq6NjaYDawrehKJJTpLZvq/GRjaNj.pwyBpaDRmAHIS',
    
    // Access Key com permissões completas (READ, CREATE, UPDATE, DELETE)
    accessKey: '$2a$10$UNBae5tE/YEYdsSDuu0gi.F.rum17Jf2J3IK1SRKn4cUWqBeZ7.hG'
};

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`;

// ========================================
// Funções de Leitura e Escrita
// ========================================

/**
 * Carregar todos os dados do JSONBin
 * @returns {Promise<Object|null>} Objeto com events, maanaims, users, pendingUsers
 */
async function loadFromJSONBin() {
    try {
        console.log('📥 Carregando dados do JSONBin...');
        
        const response = await fetch(JSONBIN_URL + '/latest', {
            method: 'GET',
            headers: {
                'X-Access-Key': JSONBIN_CONFIG.accessKey
            }
        });

        if (!response.ok) {
            console.error('❌ Resposta do servidor:', response.status, response.statusText);
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Dados carregados com sucesso!');
        return data.record || data;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return null;
    }
}

/**
 * Salvar todos os dados no JSONBin
 * @param {Object} allData Objeto com events, maanaims, users, pendingUsers
 * @returns {Promise<boolean>} True se salvou com sucesso
 */
async function saveToJSONBin(allData) {
    try {
        console.log('💾 Salvando dados no JSONBin...');
        
        // Adicionar timestamp
        allData.lastUpdate = new Date().toISOString();
        
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            },
            body: JSON.stringify(allData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Resposta do servidor:', response.status, errorText);
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        console.log('✅ Dados salvos com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        alert('Erro ao salvar dados. Verifique sua conexão.');
        return false;
    }
}

/**
 * Verificar se JSONBin está configurado
 * @returns {boolean} True se configurado corretamente
 */
function isJSONBinConfigured() {
    if (JSONBIN_CONFIG.binId === 'SEU_BIN_ID_AQUI' || 
        !JSONBIN_CONFIG.accessKey ||
        JSONBIN_CONFIG.accessKey === '$2a$10$...SUA_API_KEY_AQUI') {
        console.warn('⚠️ JSONBin não configurado! Configure em jsonbin-config.js');
        return false;
    }
    return true;
}

/**
 * Carregar dados com fallback para localStorage
 * @returns {Promise<Object>} Dados carregados
 */
async function loadDataWithFallback() {
    // Tentar carregar do JSONBin
    if (isJSONBinConfigured()) {
        const data = await loadFromJSONBin();
        if (data) {
            // Salvar no localStorage como backup
            try {
                localStorage.setItem('seminarioBackup', JSON.stringify(data));
            } catch (e) {
                console.warn('Não foi possível salvar backup local');
            }
            return data;
        }
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
    let saved = false;
    
    // Tentar salvar no JSONBin
    if (isJSONBinConfigured()) {
        saved = await saveToJSONBin(allData);
    }
    
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
// JSON Inicial para o Bin
// ========================================
const INITIAL_JSONBIN_DATA = {
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

// Copie o INITIAL_JSONBIN_DATA acima para criar seu Bin inicial!
console.log('📦 JSONBin Config carregado');
