# 📦 Usar JSON como Banco de Dados (Sem Firebase!)

## 🎯 Opção 1: JSONBin.io (MAIS FÁCIL) ⭐

### Por quê JSONBin?
- ✅ **100% GRATUITO** (até 100.000 requests/mês)
- ✅ **2 MINUTOS** para configurar
- ✅ **Simples como JSON**
- ✅ **API REST fácil**
- ✅ **Todos veem mesmos dados**
- ✅ **Mais simples que Firebase**

### 📋 Passo a Passo (2 minutos)

#### 1️⃣ Criar Conta (30 segundos)
1. Acesse: https://jsonbin.io
2. Clique em "Sign Up"
3. Use Google ou Email
4. Confirme email

#### 2️⃣ Criar Bin (30 segundos)
1. No dashboard, clique em "Create Bin"
2. Cole este JSON inicial:

```json
{
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
  "pendingUsers": []
}
```

3. Clique em "Create"
4. **Copie o Bin ID** (aparece na URL)

#### 3️⃣ Pegar API Key (30 segundos)
1. Clique no seu perfil (canto superior direito)
2. Vá em "API Keys"
3. Copie sua "Master Key"

#### 4️⃣ Configurar no Código (30 segundos)

Crie arquivo `jsonbin-config.js`:

```javascript
// Configuração JSONBin
const JSONBIN_CONFIG = {
    binId: 'SEU_BIN_ID_AQUI', // Ex: 67890abcdef
    apiKey: '$2a$10$...SUA_API_KEY_AQUI'
};

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`;

// Carregar dados
async function loadFromJSONBin() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        const data = await response.json();
        return data.record;
    } catch (error) {
        console.error('Erro ao carregar:', error);
        return null;
    }
}

// Salvar dados
async function saveToJSONBin(allData) {
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            },
            body: JSON.stringify(allData)
        });
        
        if (response.ok) {
            console.log('✅ Dados salvos com sucesso!');
            return true;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
}
```

#### 5️⃣ Atualizar script.js

Substitua as funções de LocalStorage:

```javascript
// Carregar dados
async function loadFromLocalStorage() {
    const data = await loadFromJSONBin();
    
    if (data) {
        state.events = data.events || [];
        state.maanaims = data.maanaims || [];
        cleanOldEvents();
    } else {
        // Fallback para localStorage
        const savedEvents = localStorage.getItem('seminarioEvents');
        state.events = savedEvents ? JSON.parse(savedEvents) : [];
    }
}

// Salvar dados (não precisa no script.js - apenas lê)
```

#### 6️⃣ Atualizar admin.js

```javascript
// Carregar dados
async function loadFromLocalStorage() {
    const data = await loadFromJSONBin();
    
    if (data) {
        state.events = data.events || [];
        state.maanaims = data.maanaims || [];
        state.users = data.users || [];
        state.pendingUsers = data.pendingUsers || [];
    }
}

// Salvar TUDO de uma vez
async function saveToLocalStorage() {
    const allData = {
        events: state.events,
        maanaims: state.maanaims,
        users: state.users,
        pendingUsers: state.pendingUsers
    };
    
    await saveToJSONBin(allData);
    
    // Backup local
    localStorage.setItem('seminarioEvents', JSON.stringify(state.events));
    localStorage.setItem('seminarioMaanaims', JSON.stringify(state.maanaims));
}
```

### ✅ Pronto!
- Todos veem mesmos dados
- Atualização automática
- Simples como JSON
- Grátis para sempre

---

## 🎯 Opção 2: GitHub + JSON (Mais Complexo)

### Como Funciona:
1. Dados salvos em arquivo JSON no GitHub
2. GitHub Actions atualiza automaticamente
3. Todos leem do mesmo JSON

### Problema:
- ⚠️ Precisa configurar GitHub Actions
- ⚠️ Delay de 1-2 minutos para atualizar
- ⚠️ Mais complexo

### Quando usar:
- Se quiser TUDO no GitHub
- Se não quiser serviço externo

---

## 🎯 Opção 3: My JSON Server (Read-Only)

### Como Funciona:
1. Cria arquivo `db.json` no GitHub
2. API automática criada
3. Apenas leitura

### Uso:
```
https://my-json-server.typicode.com/SEU_USUARIO/SEU_REPO
```

### Problema:
- ❌ **Apenas leitura**
- ❌ Não pode salvar dados
- ✅ Bom para dados fixos

---

## 📊 Comparação

| Opção | Setup | Leitura | Escrita | Grátis | Simples |
|-------|-------|---------|---------|--------|---------|
| **JSONBin.io** | 2 min | ✅ Sim | ✅ Sim | ✅ Sim | ⭐⭐⭐⭐⭐ |
| **Firebase** | 15 min | ✅ Sim | ✅ Sim | ✅ Sim | ⭐⭐⭐ |
| **GitHub JSON** | 30 min | ✅ Sim | ⚠️ Delay | ✅ Sim | ⭐⭐ |
| **My JSON Server** | 5 min | ✅ Sim | ❌ Não | ✅ Sim | ⭐⭐⭐⭐ |

---

## 🏆 Recomendação

### Para seu caso: **JSONBin.io**

**Por quê?**
- ✅ Mais simples que Firebase
- ✅ Funciona como JSON puro
- ✅ 2 minutos para configurar
- ✅ 100.000 requests/mês grátis
- ✅ API REST simples
- ✅ Perfeito para igrejas

---

## 💾 Estrutura do JSON

```json
{
  "events": [
    {
      "id": "1",
      "name": "Retiro de Jovens",
      "class": "geral",
      "startDate": "2026-03-15",
      "endDate": "2026-03-15",
      "startTime": "19:00",
      "endTime": "22:00",
      "maanaim": "domingos-martins",
      "area": "TEMPLO",
      "price": 50.00,
      "deadline": "2026-03-13"
    }
  ],
  "maanaims": [
    {
      "id": "1",
      "name": "Domingos Martins",
      "slug": "domingos-martins"
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
  "pendingUsers": []
}
```

---

## 🚀 Implementação Completa

### Arquivos Necessários:

1. **`jsonbin-config.js`** → Configuração e funções
2. **`index.html`** → Adicionar script do JSONBin
3. **`admin.html`** → Adicionar script do JSONBin
4. **`script.js`** → Atualizar load/save
5. **`admin.js`** → Atualizar load/save

### No index.html e admin.html:

```html
<!-- Antes do </body> -->
<script src="jsonbin-config.js"></script>
<script src="script.js"></script> <!-- ou admin.js -->
```

---

## 🔒 Segurança

### Proteger API Key:

**Opção 1: Ocultar (Básico)**
```javascript
// Use variável de ambiente ou oculte do código público
```

**Opção 2: Proxy (Melhor)**
- Criar API intermediária
- Ocultar chave no servidor

**Opção 3: GitHub Secrets (Avançado)**
- Usar GitHub Actions
- Chave em secrets

---

## 📱 Vantagens do JSONBin

1. ✅ **Simples**: É só JSON
2. ✅ **Rápido**: Setup em 2 minutos
3. ✅ **Grátis**: 100k requests/mês
4. ✅ **REST API**: Fácil de usar
5. ✅ **Versionamento**: Guarda histórico
6. ✅ **Sem complexidade**: Não precisa aprender nada novo

---

## 🎯 Próximos Passos

1. ✅ **Agora**: Crie conta no JSONBin.io (2 min)
2. ✅ **Configure**: Copie Bin ID e API Key
3. ✅ **Atualize**: Código com configuração
4. ✅ **Teste**: Adicione evento e veja sincronizar
5. ✅ **Publique**: GitHub Pages + JSONBin

**Total: 10 minutos para sistema completo!** 🎉

---

## ❓ FAQ

**P: É realmente grátis?**
R: Sim! 100.000 requests/mês grátis para sempre.

**P: É seguro?**
R: Sim! Dados armazenados com segurança.

**P: Posso ver histórico?**
R: Sim! JSONBin guarda versões anteriores.

**P: E se passar 100k/mês?**
R: Seu caso não vai passar. Mas tem plano pago barato.

**P: É melhor que Firebase?**
R: Para seu caso, sim! Muito mais simples.

**P: Como fazer backup?**
R: Baixe o JSON do JSONBin. Também guarda no localStorage como backup.

---

**JSONBin.io é a solução perfeita: simples como JSON, poderoso como banco de dados!** 📦✨
