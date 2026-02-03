# Guia de Teste - Sistema de Programação de Seminários

## ✅ Checklist de Funcionalidades

### Página Pública (index.html)

**1. Visualização de Maanaims**
- [ ] Abre a página e verifica se mostra "Todos os Maanaim"
- [ ] Verifica se mostra apenas Maanaims cadastrados no sistema
- [ ] Clica em cada Maanaim e verifica se filtra corretamente

**2. Calendário**
- [ ] Navega entre meses (← e →)
- [ ] Clica no botão 🏠 e volta para o mês atual
- [ ] Clica em uma data e verifica se mostra eventos daquele dia
- [ ] Verifica se dias com eventos têm marcador laranja

**3. Filtros**
- [ ] Testa todos os filtros de classe (1º ao 6º Período, etc.)
- [ ] Testa o filtro "Favoritos"
- [ ] Verifica se filtros combinam com seleção de Maanaim

**4. Cards de Eventos**
- [ ] Clica no coração (🤍) e adiciona aos favoritos
- [ ] Clica novamente e remove dos favoritos
- [ ] Clica no botão compartilhar (📤)
- [ ] Clica na seta (→) e abre modal de detalhes

**5. Modal de Evento**
- [ ] Verifica se mostra todas as informações
- [ ] Clica em "WhatsApp" e verifica mensagem formatada
- [ ] Clica em "Copiar Texto" e cola em algum lugar
- [ ] Fecha o modal clicando no X ou fora

**6. Exclusão Automática**
- [ ] Fecha e reabre a página
- [ ] Verifica no console se eventos antigos foram removidos
- [ ] Cria evento de teste para ontem e recarrega página

---

### Página Administrativa (admin.html)

**1. Login**
- [ ] Acessa admin.html
- [ ] Faz login com `admin` / `admin123`
- [ ] Verifica se mostra "Administrador Geral"

**2. Cadastro de Novo Usuário**
- [ ] Clica em "Solicitar Cadastro"
- [ ] Preenche email, senha e seleciona Maanaim
- [ ] Envia solicitação
- [ ] Verifica mensagem de sucesso

**3. Aprovar Cadastro**
- [ ] Faz login como admin
- [ ] Vai para aba "✅ Aprovar Cadastros"
- [ ] Verifica se mostra badge com número de pendências
- [ ] Aprova o usuário criado anteriormente
- [ ] Faz logout e testa login com novo usuário

**4. Gerenciar Eventos**
- [ ] Preenche formulário de novo evento
- [ ] Salva evento
- [ ] Edita evento existente
- [ ] Exclui evento
- [ ] Verifica se mudanças aparecem em index.html

**5. Gerenciar Maanaims**
- [ ] Vai para aba "🏛️ Gerenciar Maanaims"
- [ ] Adiciona novo Maanaim (ex: "São Pedro")
- [ ] Verifica se slug é gerado automaticamente
- [ ] Edita Maanaim existente
- [ ] Tenta excluir Maanaim com eventos (deve dar erro)
- [ ] Verifica se novo Maanaim aparece em:
  - Selects de criar evento
  - Selects de criar usuário
  - Grid de Maanaims em index.html

**6. Gerenciar Usuários**
- [ ] Adiciona novo usuário manualmente
- [ ] Define como "Administrador Geral" ou "Admin Maanaim"
- [ ] Exclui usuário
- [ ] Tenta excluir próprio usuário (deve dar erro)

**7. Admin de Maanaim**
- [ ] Faz login com usuário de Maanaim
- [ ] Verifica que vê apenas aba de eventos
- [ ] Verifica que campo de Maanaim está desabilitado
- [ ] Cria evento (deve ser do Maanaim do usuário)
- [ ] Verifica que não pode editar eventos de outros Maanaims

---

## 🧪 Testes Específicos

### Teste 1: Fluxo Completo de Novo Maanaim

1. Login como admin em admin.html
2. Ir para "Gerenciar Maanaims"
3. Adicionar "São Pedro" (slug: sao-pedro)
4. Ir para "Gerenciar Eventos"
5. Criar evento para "São Pedro"
6. Abrir index.html em nova aba
7. Verificar se "São Pedro" aparece nos filtros
8. Clicar em "São Pedro" e ver o evento

### Teste 2: Exclusão Automática

1. Em admin.html, criar evento com data de ontem
2. Salvar evento
3. Fechar e reabrir admin.html
4. Abrir console do navegador (F12)
5. Verificar mensagem: "X evento(s) antigo(s) removido(s)"
6. Confirmar que evento não aparece mais na lista

### Teste 3: Hierarquia de Usuários

1. Login como admin
2. Criar novo usuário: teste@email.com / senha123 / Domingos Martins
3. Aprovar usuário
4. Fazer logout
5. Login com teste@email.com
6. Verificar que:
   - Vê apenas aba de eventos
   - Não vê abas de usuários, maanaims e aprovações
   - Campo Maanaim está desabilitado em "Domingos Martins"
7. Criar evento (deve ser de Domingos Martins)
8. Logout e login como admin
9. Verificar que evento foi criado corretamente

### Teste 4: Sincronização entre Páginas

1. Abrir index.html em uma aba
2. Abrir admin.html em outra aba
3. Em admin.html, criar novo evento
4. Voltar para aba index.html
5. Recarregar página (F5)
6. Verificar se novo evento aparece

---

## 🐛 Possíveis Problemas e Soluções

**Problema:** Maanaims não aparecem em index.html
**Solução:** Verificar se há Maanaims cadastrados em admin.html > Gerenciar Maanaims

**Problema:** Eventos não são excluídos automaticamente
**Solução:** Verificar se a data do evento está realmente no passado (usar data de ontem)

**Problema:** Não consigo fazer login
**Solução:** Limpar localStorage do navegador e tentar novamente com admin/admin123

**Problema:** Mudanças não aparecem entre páginas
**Solução:** Recarregar a página com F5 ou Ctrl+R

---

## 📊 Dados de Teste Sugeridos

### Eventos de Exemplo:

**Evento 1:**
- Nome: Retiro de Jovens
- Classe: Geral
- Data: (próxima semana)
- Horário: 19:00 - 22:00
- Maanaim: Domingos Martins
- Área: TEMPLO
- Valor: 50.00
- Inscrições até: (2 dias antes)

**Evento 2:**
- Nome: 1º Período
- Classe: 1º Período
- Data: (próximo mês)
- Horário: 09:00 - 17:00
- Maanaim: Terra Vermelha
- Área: TRIPLEX
- Valor: 150.00
- Inscrições até: (1 semana antes)

### Usuários de Exemplo:

**Admin Geral:**
- Email: admin@igreja.com
- Senha: admin123
- Tipo: Administrador Geral

**Admin Maanaim:**
- Email: dm@igreja.com
- Senha: dm123
- Tipo: Admin Maanaim
- Maanaim: Domingos Martins

---

## ✨ Checklist Final

Antes de publicar no lovable.dev:

- [ ] Todos os testes passaram
- [ ] Dados de exemplo criados
- [ ] README.md revisado
- [ ] Credenciais admin/admin123 funcionando
- [ ] Exclusão automática testada
- [ ] Responsividade testada em mobile
- [ ] Todas as funcionalidades documentadas
- [ ] URLs corretas no README

**Sistema pronto para produção!** 🎉
