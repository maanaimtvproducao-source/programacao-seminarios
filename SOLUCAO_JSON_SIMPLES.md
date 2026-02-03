# 📦 Solução Simples com JSON (Sem Firebase!)

## 🎯 A Melhor Solução: JSONBin.io

### Por quê JSONBin ao invés de Firebase?

| Característica | JSONBin | Firebase |
|----------------|---------|----------|
| **Simplicidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Tempo Setup** | 2 minutos | 15 minutos |
| **É só JSON?** | ✅ SIM | ❌ Não |
| **Fácil de entender** | ✅ SIM | ⚠️ Complexo |
| **Grátis** | ✅ 100k/mês | ✅ 50k/mês |
| **Todos veem mesmos dados** | ✅ SIM | ✅ SIM |

---

## ⚡ Setup em 2 Minutos

### Passo 1: Criar Conta (30 seg)
1. Acesse: https://jsonbin.io
2. Clique "Sign Up"
3. Use Google ou Email

### Passo 2: Criar Bin (1 min)
1. Clique "Create Bin"
2. Cole este JSON:

```json
{
  "events": [],
  "maanaims": [
    {"id": "1", "name": "Domingos Martins", "slug": "domingos-martins"},
    {"id": "2", "name": "Terra Vermelha", "slug": "terra-vermelha"}
  ],
  "users": [
    {"id": "1", "username": "admin", "password": "admin123", "role": "admin", "maanaim": null}
  ],
  "pendingUsers": []
}
```

3. Clique "Create"
4. **Copie o Bin ID** (está na URL)

### Passo 3: Pegar API Key (30 seg)
1. Clique no seu perfil
2. Vá em "API Keys"
3. Copie a "Master Key"

### Passo 4: Configurar (30 seg)

Abra `jsonbin-config.js` e cole:

```javascript
const JSONBIN_CONFIG = {
    binId: 'COLE_SEU_BIN_ID_AQUI',
    apiKey: 'COLE_SUA_API_KEY_AQUI'
};
```

### Passo 5: Atualizar HTMLs

**Em `index.html`, antes do `</body>`:**
```html
<script src="jsonbin-config.js"></script>
<script src="script.js"></script>
```

**Em `admin.html`, antes do `</body>`:**
```html
<script src="jsonbin-config.js"></script>
<script src="admin.js"></script>
```

---

## ✅ Pronto!

**Agora:**
- ✅ Todos veem os mesmos dados
- ✅ Dados salvos na nuvem
- ✅ Simples como JSON
- ✅ Grátis para sempre

---

## 🔄 Como Funciona

### Quando alguém abre o site:
1. Carrega JSON do JSONBin
2. Mostra os eventos

### Quando admin adiciona evento:
1. Adiciona no array `events`
2. Salva todo o JSON no JSONBin
3. Outros usuários veem imediatamente

---

## 💾 Exemplo de Uso

### Adicionar Evento:
```javascript
// Admin adiciona evento
state.events.push(novoEvento);

// Salva tudo no JSONBin
await saveDataWithFallback({
    events: state.events,
    maanaims: state.maanaims,
    users: state.users,
    pendingUsers: state.pendingUsers
});
```

### Ver Eventos:
```javascript
// Usuário abre site
const data = await loadDataWithFallback();
state.events = data.events;
// Renderiza na tela
```

---

## 🆚 Comparação Completa

### JSONBin (Recomendado para você)
- ✅ É literalmente um JSON na nuvem
- ✅ API REST simples (GET, PUT)
- ✅ Não precisa aprender nada novo
- ✅ 2 minutos para configurar
- ✅ Perfeito para igrejas

### Firebase
- ⚠️ Precisa aprender conceitos novos
- ⚠️ Firestore, documentos, coleções
- ⚠️ 15 minutos para configurar
- ✅ Mais poderoso (se precisar)

### GitHub JSON
- ❌ Não pode modificar diretamente
- ❌ Precisa GitHub Actions
- ❌ Delay de 1-2 minutos
- ⚠️ Complexo de implementar

---

## 🎯 Por que JSONBin é Perfeito

1. **É só JSON** - Você já conhece JSON
2. **API simples** - Apenas GET e PUT
3. **Sem conceitos novos** - Não precisa aprender nada
4. **2 minutos** - Setup super rápido
5. **Grátis** - 100.000 requests/mês
6. **Funciona** - Testado e confiável

---

## 📊 Estrutura dos Dados

```
JSONBin (nuvem)
└── Seu Bin
    ├── events: [array]
    ├── maanaims: [array]
    ├── users: [array]
    ├── pendingUsers: [array]
    └── lastUpdate: timestamp
```

Simples assim! Um único JSON com tudo.

---

## 💡 Dicas

### Backup Automático
O sistema salva também no localStorage como backup!

### Versionamento
JSONBin guarda versões anteriores automaticamente!

### Ver Histórico
No dashboard do JSONBin você vê todas as versões!

### Restaurar Versão Antiga
Basta copiar versão antiga e dar PUT!

---

## ⚠️ Importante

### Segurança da API Key

**Problema:** API Key fica visível no código

**Soluções:**

1. **Básica:** Só admin usa a chave (página admin)
2. **Média:** Criar proxy simples
3. **Avançada:** Backend intermediário

Para começar, solução básica é suficiente!

---

## 🚀 Publicar

### GitHub Pages + JSONBin = Perfeito!

1. **Site no GitHub Pages** (grátis)
2. **Dados no JSONBin** (grátis)
3. **Funciona perfeito!**

**Custo total:** R$ 0,00
**Tempo total:** 10 minutos

---

## 📞 Links Úteis

- **JSONBin:** https://jsonbin.io
- **Documentação:** https://jsonbin.io/api-reference
- **Dashboard:** https://jsonbin.io/dashboard

---

## ❓ FAQ Rápido

**P: É grátis?**
R: Sim! 100k requests/mês.

**P: É difícil?**
R: Não! É só JSON normal.

**P: É seguro?**
R: Sim! SSL/HTTPS automático.

**P: Todos veem mesmos dados?**
R: Sim! Dados na nuvem.

**P: Precisa saber programar?**
R: Não! Já está tudo pronto.

**P: Funciona offline?**
R: Sim! Usa localStorage como backup.

---

## ✨ Conclusão

**JSONBin é a solução perfeita:**
- Simples como JSON
- Rápido para configurar  
- Grátis para sempre
- Perfeito para igrejas

**Próximo passo:**
📖 Siga o `GUIA_JSONBIN.md` completo!

---

**2 minutos para ter dados compartilhados na nuvem!** 📦✨
