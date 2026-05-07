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
| **Auth** | ✅ | ✅ Login, Refresh, Register | ✅ `/auth/*` | ✅ Init | ✅ 5 testes |
| **Tenants** | ✅ | ✅ | ✅ | ✅ Init | ❌ Stub |
| **Entities** | ✅ | ✅ Full CRUD + Reorder | ✅ | ✅ Init | ✅ 18 testes |
| **Access** | ✅ | ✅ Full CRUD + Permissions | ✅ | ✅ Init | ✅ 8 testes |
| **Parameters** | ✅ | ✅ + Cache | ✅ | ✅ Init | ✅ 9 testes |
| **FormBuilder** | ✅ | ✅ CRUD + Publish + Duplicate | ✅ `/admin/forms/*` | ❌ **PENDENTE** | ❌ Nenhum |

### Infraestrutura Entregue

- ✅ **JWT Authentication** — `AuthExtensions.cs`, `IJwtTokenService`, claims: `sub`, `user_id`, `tenant_id`, `email`, `name`, `roles`
- ✅ **Refresh Token Rotation** — persistido em `RefreshToken` table, rotação e revogação implementadas
- ✅ **Tenant Resolution** — `CurrentTenantMiddleware`, `CurrentTenant.cs`, lê claim JWT `tenant_id` com fallback `X-Tenant-Id` em Development
- ✅ **Exception Handling** — `ExceptionHandlingMiddleware`, `ExceptionHandlingExtensions` (centraliza 404/409/403)
- ✅ **Parameter Cache** — `IMemoryCache` com chaves `param:{tenantId}:{key}`, invalidação síncrona em writes
- ✅ **CI/CD** — `.github/workflows/ci.yml` (build + test backend e frontend)

### Infraestrutura Pendente

- ✅ **Migrations do FormBuilder** — InitFormBuilder criada e aplicada
- ✅ **Testes de Entities, Access, Parameters** — 40 testes totais passando
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

1. ~~**Bootstrap do primeiro admin**~~ — ✅ `DevelopmentSeedExtensions` cria tenant + admin automaticamente em Development.

2. ~~**FormBuilder sem migration**~~ — ✅ Migration `InitFormBuilder` criada e aplicada ao PostgreSQL.

3. ~~**Testes em stubs**~~ — ✅ 40 testes reais passando (Auth 5, Entities 18, Access 8, Parameters 9).

4. ~~**Frontend auth sem tratamento de 403**~~ — ✅ Toast específico implementado no `error.interceptor.ts`.

5. **CORS desalinhado com frontend** — `.env` define `CORS_ORIGINS` e `FRONTEND_PORT`. O `package.json` hardcoda `ng serve --port 4300`. Se não baterem, login falha silenciosamente no navegador (CORS bloqueia). Usar `npm run kill-ports` para liberar portas zumbis.

---

## Próximos Passos Recomendados

### Imediatos (antes de novas features)

1. [x] **Commitar UI improvements** do working tree
2. [x] **Criar migration do FormBuilder** e aplicar (`make migrate-add`)
3. [x] **Implementar bootstrap de admin** (seed via `DevelopmentSeedExtensions`)
4. [ ] **Adicionar tratamento de 403 no frontend** — toast específico para ForbiddenException
5. [ ] **Alinhar porta do frontend** — manter CORS_ORIGINS e FRONTEND_PORT em sync com `package.json` (porta 4300)

### Curto prazo (Wave A completa + Wave B frontend)

5. [x] **Testes reais de Entities handlers** (18 testes)
6. [x] **Testes reais de Access handlers** (8 testes)
7. [x] **Testes reais de Parameters handlers** (9 testes)
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
- **Auth está funcional** — use `POST /auth/login` com `admin@admincore.local / Admin123!`. O token JWT contém os claims `tenant_id`, `user_id`, `roles`.
- **CORS: frontend porta 4300** — `package.json` hardcoda `--port 4300`. O `.env` deve ter `CORS_ORIGINS=http://localhost:4300` e `FRONTEND_PORT=4300`. Login falha silenciosamente se as portas não baterem.
- **Use `npm run kill-ports`** para liberar portas zumbis (5000, 4300) antes de subir o dev.
- **Testes de Auth são a referência** — `backend/tests/AdminCore.Modules.Auth.Tests/AuthHandlerTests.cs` tem o padrão correto (InMemory DbContext, NSubstitute para interfaces).
