# Sistema de Programação de Seminários

Sistema completo para gerenciamento e visualização de seminários da Igreja Cristã Maranata.

## 🌐 Estrutura do Sistema

### Página Pública (`index.html`)
- Visualização de eventos por todos os usuários
- Calendário interativo
- Filtros por Maanaim e Classe
- Sistema de favoritos
- Compartilhamento via WhatsApp
- **SEM** acesso administrativo

### Página Administrativa (`admin.html`)
- Acesso restrito via login
- Gerenciamento completo de eventos
- Gerenciamento de Maanaims
- Gerenciamento de usuários
- Aprovação de novos cadastros
- URL de acesso: `admin.html` (mantenha esta URL privada!)

## 🚀 Características

- ✅ Interface moderna e responsiva
- ✅ Calendário interativo
- ✅ Filtros por Maanaim e Classe
- ✅ Sistema de favoritos
- ✅ Compartilhamento via WhatsApp
- ✅ Sistema de autenticação com hierarquia
- ✅ Painel administrativo completo
- ✅ Gerenciamento dinâmico de Maanaims
- ✅ **Exclusão automática de eventos passados**
- ✅ Armazenamento local (LocalStorage)
- ✅ Separação entre página pública e administrativa

## 📋 Como Usar

### Para Usuários (Página Pública)

1. Acesse `index.html` no navegador
2. Navegue pelo calendário e selecione datas para ver eventos
3. Use os filtros de Maanaim e Classe para refinar a busca
4. Clique nos eventos para ver detalhes
5. Compartilhe eventos via WhatsApp (com mensagem padrão: "A paz do Senhor, Por favor, me inscreva no evento:")
6. Copie o texto do evento para compartilhar
7. Adicione eventos aos favoritos (❤️)

### Para Administradores

#### Acesso Administrativo

1. Acesse `admin.html` no navegador (mantenha esta URL privada!)
2. Faça login com suas credenciais

#### Credenciais Padrão

**Administrador Geral:**
- Usuário: `admin`
- Senha: `admin123`
- Permissões: Acesso total + Gerenciamento de Maanaims + Aprovação de usuários

#### Cadastro de Novos Usuários

Na página `admin.html`, clique em **"Solicitar Cadastro"** para pedir acesso:
1. Informe seu email
2. Crie uma senha (mínimo 6 caracteres)
3. Selecione seu Maanaim
4. Aguarde aprovação de um administrador geral

#### Painel Administrativo

Após o login, você terá acesso a:

**1. 📅 Gerenciar Eventos**
- Adicionar novos eventos
- Editar eventos existentes
- Excluir eventos
- Visualizar todos os eventos (admin) ou apenas do seu Maanaim (admin-maanaim)

**2. 🏛️ Gerenciar Maanaims** (Apenas Administradores Gerais)
- Adicionar novos Maanaims ao sistema
- Editar Maanaims existentes
- Remover Maanaims (apenas se não tiverem eventos ou usuários associados)
- O slug é gerado automaticamente do nome

**3. 👥 Gerenciar Usuários** (Apenas Administradores Gerais)
- Adicionar novos usuários manualmente
- Definir hierarquia (Administrador Geral ou Administrador de Maanaim)
- Excluir usuários

**4. ✅ Aprovar Cadastros** (Apenas Administradores Gerais)
- Visualizar solicitações de cadastro pendentes
- Aprovar novos usuários
- Rejeitar solicitações
- Badge com número de solicitações pendentes

## 🔐 Hierarquia de Usuários

### Administrador Geral
- Acesso completo ao sistema
- Pode gerenciar todos os eventos de todos os Maanaim
- Pode adicionar, editar e excluir Maanaims
- Pode criar e gerenciar usuários manualmente
- Pode aprovar ou rejeitar solicitações de cadastro
- Pode criar outros administradores gerais ou administradores de Maanaim

### Administrador de Maanaim
- Pode adicionar, editar e excluir eventos apenas do seu Maanaim
- Não pode gerenciar Maanaims
- Não pode gerenciar usuários
- Não pode aprovar cadastros
- Não pode acessar eventos de outros Maanaim no painel administrativo

### Processo de Cadastro
1. Usuários novos podem solicitar cadastro através de `admin.html`
2. Informam email, senha e Maanaim desejado
3. Solicitação fica pendente até aprovação
4. Administradores gerais recebem notificação (badge) de solicitações pendentes
5. Após aprovação, usuário pode fazer login como Administrador de Maanaim

## 📂 Estrutura de Arquivos

```
Seminario/
├── index.html          # Página pública (visualização)
├── admin.html          # Página administrativa (restrita)
├── styles.css          # Estilos CSS (compartilhado)
├── script.js           # JavaScript da página pública
├── admin.js            # JavaScript da página administrativa
└── README.md          # Este arquivo
```

## 💾 Armazenamento de Dados

O sistema utiliza LocalStorage do navegador para armazenar:
- Eventos cadastrados
- Maanaims cadastrados
- Usuários cadastrados
- Solicitações de cadastro pendentes
- Favoritos do usuário

**Nota:** Os dados são armazenados localmente no navegador. Como está hospedado no lovable.dev, os dados são compartilhados entre todos os usuários que acessam o mesmo link.

## 🎨 Personalização

### Cores das Classes

Você pode personalizar as cores no arquivo `styles.css`:

```css
:root {
    --primary-blue: #4169E1;
    --purple: #9333EA;
    --green: #10B981;
    --orange: #F59E0B;
    /* ... outras cores */
}
```

### Logo

Coloque um arquivo `logo.png` na mesma pasta dos arquivos HTML para exibir o logo da igreja no cabeçalho da página pública.

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Dispositivos móveis (responsivo)

## 🔧 Adicionar Novos Maanaims

Para adicionar novos Maanaims ao sistema:

1. Acesse `admin.html` como Administrador Geral
2. Vá para a aba "🏛️ Gerenciar Maanaims"
3. Preencha o nome do Maanaim (ex: "São Pedro")
4. O slug será gerado automaticamente (ex: "sao-pedro")
5. Clique em "Salvar Maanaim"
6. O novo Maanaim estará disponível imediatamente para:
   - Seleção ao criar eventos
   - Seleção ao cadastrar usuários
   - Filtro na página pública

## 🗑️ Exclusão Automática de Eventos

O sistema possui uma funcionalidade automática de limpeza de eventos antigos:

- **Quando acontece:** Toda vez que você abre a página (pública ou admin)
- **Como funciona:** Eventos são mantidos até o dia em que acontecem
- **Quando são removidos:** No dia seguinte após o evento terminar

### Exemplo:

- Evento agendado para: 15/03/2026
- O evento fica visível no sistema: até 15/03/2026 às 23:59
- O evento é automaticamente removido: em 16/03/2026 (dia seguinte)

Isso garante que:
✅ Eventos atuais permanecem visíveis
✅ Eventos do dia ainda podem ser visualizados
✅ Eventos passados são automaticamente removidos
✅ O sistema fica sempre organizado e atualizado

**Nota:** A verificação acontece automaticamente quando:
- Qualquer usuário acessa `index.html`
- Qualquer administrador acessa `admin.html`

## 🌐 Opções de Hospedagem

### Opção 1: GitHub Pages (RECOMENDADO) ⭐
- ✅ **100% GRATUITO**
- ✅ **5 minutos** para publicar
- ✅ URL própria: `seuusuario.github.io/seminarios`
- ✅ Fácil atualização via Git
- 📖 **Guia completo**: `GUIA_GITHUB_PAGES.md`

### Opção 2: Lovable.dev
- ✅ Já está configurado se você está usando
- ✅ Deploy automático
- ✅ Interface visual
- ⚠️ Dados locais (LocalStorage)

### Opção 3: Vercel / Netlify
- ✅ Deploy automático do GitHub
- ✅ CI/CD integrado
- ✅ Performance otimizada

## 💾 Dados Compartilhados

### Situação Atual (LocalStorage):
- ⚠️ Cada navegador tem seus próprios dados
- ⚠️ Não compartilha entre usuários
- ⚠️ Perde dados ao limpar cache

### Soluções Disponíveis:

#### Opção 1: JSONBin.io (MAIS SIMPLES) ⭐⭐⭐⭐⭐
- ✅ **100% JSON puro** - simples de entender
- ✅ **2 minutos** para configurar
- ✅ **100.000 requests/mês** grátis
- ✅ **Todos veem os mesmos dados**
- ✅ Backup automático no localStorage
- 📖 **Guia completo**: `GUIA_JSONBIN.md`
- 📖 **Guia rápido**: `SOLUCAO_JSON_SIMPLES.md`

#### Opção 2: Firebase (Mais Poderoso)
- ✅ **50.000 leituras/dia** grátis
- ✅ Sincronização em tempo real
- ⚠️ Mais complexo (15 min setup)
- ⚠️ Precisa aprender Firestore
- 📖 **Guia completo**: `GUIA_FIREBASE.md`

### Melhor Combinação:
**GitHub Pages + JSONBin = Simples, Rápido e Grátis!** 🎉

## ⚠️ Observações Importantes

1. **Segurança:** Este é um sistema básico de autenticação. Os dados são armazenados no localStorage do navegador.
2. **Dados Compartilhados:** Como está no lovable.dev, todos que acessam o mesmo link veem os mesmos dados.
3. **Backup:** Os dados persistem no navegador, mas recomenda-se fazer backup periódico.
4. **URL Administrativa:** A URL de `admin.html` deve ser mantida privada e compartilhada apenas com pessoas autorizadas.

## 🆘 Suporte

Para questões ou problemas:
- Administradores gerais podem gerenciar o sistema através de `admin.html`
- Usuários finais acessam apenas `index.html` para visualização

---

**Igreja Cristã Maranata © 2026**
