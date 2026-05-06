# AdminCore — Estado Atual do Projeto

> Documento gerado em: 2026-05-06
> Última revisão do código: commit `8570a67`

---

## Resumo Executivo

O projeto AdminCore teve implementações significativas nas Waves A e B, com entregas parciais na Wave D. A Wave C (Workflow) permanece inteiramente pendente.

| Wave | Status | Observação |
|------|--------|------------|
| **A — Fundação** | ✅ ~85% concluída | Auth, tenant resolution, cache, tema dinâmico entregues. Testes reais de Entities/Access/Parameters ainda pendentes. |
| **B — Configuração Avançada** | ✅ ~40% concluída | Form Builder backend entregue. Frontend Form Builder e endpoints `/config/*` públicos pendentes. |
| **C — Workflow + Motor** | ⏳ 0% | Nenhuma implementação. |
| **D — Operacional** | ✅ ~25% concluída | CI/CD (GitHub Actions) e guia de extração entregues. Observabilidade, audit log, rate limiting, tickets pendentes. |

---

## Backend (.NET 10)

### Módulos Implementados

| Módulo | Domínio | Handlers | Controller | Migrations | Testes Reais |
|--------|---------|----------|------------|------------|--------------|
| **Shared.Kernel** | ✅ | — | — | — | — |
| **Auth** | ✅ | ✅ Login, Refresh, Register | ✅ `/auth/*` | ✅ Init | ✅ 5 testes (AuthHandlerTests) |
| **Tenants** | ✅ | ✅ | ✅ | ✅ Init | ❌ Stub |
| **Entities** | ✅ | ✅ Full CRUD + Reorder | ✅ | ✅ Init | ❌ Stub |
| **Access** | ✅ | ✅ Full CRUD + Permissions | ✅ | ✅ Init | ❌ Stub |
| **Parameters** | ✅ | ✅ + Cache | ✅ | ✅ Init | ❌ Stub |
| **FormBuilder** | ✅ | ✅ CRUD + Publish + Duplicate | ✅ `/admin/forms/*` | ❌ **PENDENTE** | ❌ Nenhum |

### Infraestrutura Entregue

- ✅ **JWT Authentication** — `AuthExtensions.cs`, `IJwtTokenService`, claims: `sub`, `user_id`, `tenant_id`, `email`, `name`, `roles`
- ✅ **Refresh Token Rotation** — persistido em `RefreshToken` table, rotação e revogação implementadas
- ✅ **Tenant Resolution** — `CurrentTenantMiddleware`, `CurrentTenant.cs`, lê claim JWT `tenant_id` com fallback `X-Tenant-Id` em Development
- ✅ **Exception Handling** — `ExceptionHandlingMiddleware`, `ExceptionHandlingExtensions` (centraliza 404/409/403)
- ✅ **Parameter Cache** — `IMemoryCache` com chaves `param:{tenantId}:{key}`, invalidação síncrona em writes
- ✅ **CI/CD** — `.github/workflows/ci.yml` (build + test backend e frontend)

### Infraestrutura Pendente

- ❌ **Migrations do FormBuilder** — DbContext existe mas não tem migration inicial
- ❌ **Testes de Entities, Access, Parameters** — projetos existem mas contêm apenas stubs
- ❌ **Testes do FormBuilder** — nenhum projeto de teste criado
- ❌ **OpenTelemetry + Serilog estruturado**
- ❌ **Audit log por operação**
- ❌ **Rate limiting por tenant**
- ❌ **SignalR para notificações real-time**
- ❌ **REST connectors para integrações externas**

---

## Frontend (Angular 21 + PrimeNG Aura)

### Funcionalidades Entregues

- ✅ **App Shell aprimorado** — sidebar com menu agrupado, topbar, logo, status, responsivo
- ✅ **Entity Manager** — listagem com métricas, busca, paginação lazy, CRUD em dialog
- ✅ **Parameters** — CRUD completo
- ✅ **Access/Roles** — CRUD + matriz de permissões
- ✅ **White Label** — Tenants + editor de tema com color picker
- ✅ **Auth Frontend** — `AuthService`, `authGuard`, rota `/login`, interceptor com Bearer + refresh
- ✅ **Tema Dinâmico** — `ThemeService`, `TenantConfigService`, consome `/tenants/{slug}/config`, aplica CSS variables, fallback localStorage
- ✅ **Configurador Overview** — página de visão geral do módulo

### Funcionalidades Pendentes

- ❌ **Form Builder frontend** — nenhuma tela implementada (backend existe)
- ❌ **Workflow Designer** — canvas, states, transitions
- ❌ **App de Negócio (Tickets)** — módulo inteiro
- ❌ **Dashboard** — filtros dinâmicos, métricas
- ❌ **Notificações real-time** — SignalR hub client

### Mudanças Não Commitadas (Work-in-Progress)

As seguintes mudanças estavam no working tree antes da implementação do Codex e **não foram revertidas nem commitadas** para não misturar trabalho:

- `frontend/src/app/admin/admin-layout.component.ts` — redesign completo do layout
- `frontend/src/app/admin/entities/entities-list.component.ts` — UI aprimorada com métricas
- `frontend/src/app/admin/entities/entity-detail.component.ts` — UI aprimorada
- `frontend/src/app/admin/entities/entity-form.component.ts` — ajustes
- `frontend/src/app/admin/entities/field-form.component.ts` — ajustes
- `frontend/src/app/admin/parameters/parameters-list.component.ts` — UI aprimorada
- `frontend/src/app/admin/access/access-list.component.ts` — UI aprimorada
- `frontend/src/app/admin/white-label/white-label.component.ts` — UI aprimorada
- `frontend/src/app/admin/admin.routes.ts` — rotas de overview e placeholder
- `frontend/src/app/admin/configurator-overview.component.ts` — novo componente
- `frontend/src/app/admin/configurator-placeholder.component.ts` — novo componente
- `frontend/src/styles.scss` — design system global (CSS variables, utilitários)
- `frontend/src/app/app.spec.ts` — ajuste de teste

> **Decisão:** Estas mudanças devem ser revisadas e commitadas como um pacote separado de "UI/UX improvements" antes de continuar novas features.

---

## API Endpoints — Estado

### Implementados e Funcionais

| Endpoint | Status |
|----------|--------|
| `GET /health` | ✅ |
| `POST /auth/register` | ✅ |
| `POST /auth/login` | ✅ |
| `POST /auth/refresh` | ✅ |
| `GET /admin/entities/*` | ✅ (sem DevTenantId) |
| `GET /admin/parameters/*` | ✅ (com cache) |
| `GET /admin/roles/*` | ✅ (sem DevTenantId) |
| `GET /admin/tenants/*` | ✅ |
| `GET /tenants/{slug}/config` | ✅ (público) |
| `GET /admin/forms/*` | ✅ (backend pronto, sem migration) |

### Pendentes

| Endpoint | Justificativa |
|----------|---------------|
| `GET /config/entities` | API pública para apps de negócio — necessária para Fase 3 |
| `GET /admin/users` | Gestão de usuários — necessária para admin completo |
| Webhooks por transição | Wave C |
| SignalR hubs | Wave D |

---

## Riscos Técnicos Atuais

1. **Bootstrap do primeiro admin** — `POST /auth/register` pode ser admin-only, mas sem seed não há como criar o primeiro usuário. **Recomendação:** implementar um endpoint `/auth/bootstrap` ou seed no `Program.cs` para dev.

2. **FormBuilder sem migration** — O módulo existe em código mas não há tabela no banco. Qualquer chamada ao controller vai falhar.

3. **Testes em stubs** — 3 projetos de teste com `UnitTest1.cs` vazio. Isso é risco para refatorações futuras.

4. **Frontend auth sem tratamento de 403** — O interceptor lida com 401 (refresh/logout), mas 403 (ForbiddenException) não mostra toast específico.

5. **Secrets JWT em `appsettings.json`** — A chave de assinatura JWT pode estar hardcoded em `appsettings.Development.json`. Revisar para uso de `UserSecrets` ou variáveis de ambiente.

---

## Próximos Passos Recomendados

### Imediatos (antes de novas features)

1. [ ] **Commitar UI improvements** do working tree
2. [ ] **Criar migration do FormBuilder** e aplicar (`make migrate-add`)
3. [ ] **Implementar bootstrap de admin** (seed ou endpoint público único)
4. [ ] **Revisar secrets JWT** — mover para `UserSecrets` ou env vars

### Curto prazo (Wave A completa + Wave B frontend)

5. [ ] **Testes reais de Entities handlers** (exemplo para outros módulos)
6. [ ] **Testes reais de Access handlers**
7. [ ] **Testes reais de Parameters handlers**
8. [ ] **Frontend Form Builder** — listagem, editor, preview ao vivo
9. [ ] **Endpoints `/config/entities` públicos** para apps de negócio

### Médio prazo (Wave C)

10. [ ] **Workflow Designer backend** — `WorkflowDefinition`, `State`, `Transition`
11. [ ] **Workflow Designer frontend** — canvas drag-drop
12. [ ] **Motor de execução de workflow**
13. [ ] **Webhooks por transição**

### Longo prazo (Wave D)

14. [ ] **Módulo Tickets** — backend + frontend
15. [ ] **SignalR para notificações**
16. [ ] **Audit log por operação**
17. [ ] **Rate limiting por tenant**
18. [ ] **OpenTelemetry + Serilog estruturado**
19. [ ] **REST connectors**

---

## Commits de Referência

| Commit | Descrição |
|--------|-----------|
| `41bc8b2` | docs: adiciona plano completo do roadmap admincore |
| `952440c` | feat: implementa autenticação backend |
| `b0e4195` | feat: adiciona login e proteção de rotas no frontend |
| `de72d07` | perf: adiciona cache para parâmetros |
| `5df3138` | feat: aplica tema dinâmico por tenant |
| `139d99e` | feat: adiciona form builder backend |
| `8570a67` | ci: adiciona pipeline de validação |

---

## Notas para Agents Futuros

- **Sempre leia este arquivo antes de implementar** — ele é a fonte de verdade do estado atual.
- **Nunca commitar junto com mudanças de UI existentes** — o working tree de frontend tem mudanças antigas que devem ser tratadas separadamente.
- **FormBuilder precisa de migration antes de usar** — sem isso, o controller vai gerar exceção de tabela inexistente.
- **Auth está funcional** — use `POST /auth/register` e `POST /auth/login` para obter tokens. O `DevTenantId` foi removido dos controllers principais.
- **Testes de Auth são a referência** — `backend/tests/AdminCore.Modules.Auth.Tests/AuthHandlerTests.cs` tem o padrão correto (InMemory DbContext, NSubstitute para interfaces).
