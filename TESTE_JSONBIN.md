# ✅ Testar JSONBin - Passo a Passo

## 🎉 Configuração Completa!

Suas credenciais foram configuradas:
- **Bin ID:** `698243f9ae596e708f0ea27e`
- **API Key:** Configurada ✅

## 📋 Como Testar

### 1️⃣ Abrir no Navegador

Abra os arquivos:
- `index.html` (página pública)
- `admin.html` (página administrativa)

### 2️⃣ Verificar Console

Abra o Console do navegador (F12 ou Cmd+Option+I):

**Deve aparecer:**
```
📦 JSONBin Config carregado
📥 Carregando dados do JSONBin...
✅ Dados carregados com sucesso!
```

**Se aparecer erro:**
```
⚠️ JSONBin não configurado!
```
Significa que as credenciais não foram salvas corretamente.

### 3️⃣ Testar Admin

1. Abra `admin.html`
2. Faça login: `admin` / `admin123`
3. Vá em "Gerenciar Eventos"
4. Adicione um evento de teste:
   - Nome: "Teste JSONBin"
   - Classe: Geral
   - Data: Amanhã
   - Preencha outros campos
5. Clique em "Salvar Evento"

**No console deve aparecer:**
```
💾 Salvando dados no JSONBin...
✅ Dados salvos com sucesso!
```

### 4️⃣ Verificar no JSONBin

1. Volte para https://jsonbin.io
2. Clique em "Bins"
3. Abra seu Bin
4. **Você deve ver o evento adicionado!**

### 5️⃣ Testar Sincronização

1. **Feche todas as abas**
2. Abra `index.html` novamente
3. **O evento deve aparecer!**

Se aparecer = **FUNCIONOU!** 🎉

### 6️⃣ Testar em Outro Dispositivo (Opcional)

1. Publique no GitHub Pages
2. Acesse de outro computador/celular
3. **Deve ver os mesmos dados!**

---

## 🔍 Verificar se Está Funcionando

### Console Logs Esperados:

**Ao abrir index.html:**
```
📦 JSONBin Config carregado
📥 Carregando dados do JSONBin...
✅ Dados carregados com sucesso!
```

**Ao salvar evento em admin.html:**
```
💾 Salvando dados no JSONBin...
✅ Dados salvos com sucesso!
💾 Backup local salvo
```

---

## ❌ Possíveis Erros

### Erro 1: "Erro ao carregar dados"
**Causa:** Problemas de rede ou credenciais erradas
**Solução:** 
- Verifique internet
- Confirme Bin ID e API Key em `jsonbin-config.js`

### Erro 2: "Erro HTTP: 403"
**Causa:** API Key inválida
**Solução:**
- Copie API Key novamente do JSONBin
- Cole em `jsonbin-config.js`

### Erro 3: "Erro HTTP: 404"
**Causa:** Bin ID inválido
**Solução:**
- Copie Bin ID da URL do JSONBin
- Cole em `jsonbin-config.js`

### Erro 4: Nada aparece no console
**Causa:** `jsonbin-config.js` não foi carregado
**Solução:**
- Verifique se adicionou `<script src="jsonbin-config.js"></script>` nos HTMLs

---

## 🎯 Checklist Rápido

- [ ] `jsonbin-config.js` tem Bin ID correto
- [ ] `jsonbin-config.js` tem API Key correta
- [ ] `index.html` inclui `jsonbin-config.js`
- [ ] `admin.html` inclui `jsonbin-config.js`
- [ ] Console mostra "✅ Dados carregados"
- [ ] Consegue adicionar evento no admin
- [ ] Console mostra "✅ Dados salvos"
- [ ] Evento aparece no JSONBin
- [ ] Evento aparece em `index.html`

---

## 🚀 Próximos Passos

Se tudo funcionou:

1. ✅ **Publicar no GitHub Pages** (5 min)
   - Siga `GUIA_GITHUB_PAGES.md`
   
2. ✅ **Adicionar Eventos Reais**
   - Via admin.html

3. ✅ **Compartilhar URL Pública**
   - Para membros da igreja

4. ✅ **Manter URL Admin Privada**
   - Apenas para administradores

---

## 💡 Dicas

### Backup Automático
O sistema já salva backup no localStorage automaticamente!

### Ver Histórico
No JSONBin > Clique no Bin > "Versions" = vê histórico completo

### Restaurar Versão Antiga
No JSONBin > Versions > Clique na versão desejada > Copy

### Limpar Tudo e Recomeçar
1. No JSONBin, delete o Bin
2. Crie novo Bin com JSON inicial
3. Atualize Bin ID em `jsonbin-config.js`

---

## ✨ Parabéns!

Se chegou até aqui e tudo funcionou, você tem:
- ✅ Sistema rodando localmente
- ✅ Dados sincronizados na nuvem
- ✅ Todos veem mesmos dados
- ✅ 100% grátis
- ✅ Fácil de usar

**Próximo passo: Publicar no GitHub Pages!** 🚀
