# AdminCore — Roadmap

> **Estado atual documentado em:** `context/PROJECT_STATUS.md`
> **Última atualização:** 2026-05-06

---

## Fase 1 — Admin Core MVP (parcialmente concluída)

### ✅ Concluído
- Estrutura do monolito modular (.NET 10)
- Projetos: Shared.Kernel + 6 módulos (Auth, Tenants, Entities, Access, Parameters, FormBuilder) + 3 projetos de testes
- Entidades de domínio de todos os módulos
- DbContexts isolados por schema PostgreSQL (auth, tenants, entities, access, parameters, formbuilder)
- EF Core migrations iniciais (exceto FormBuilder — ver pendências)
- Docker + Makefile para ambiente de desenvolvimento (`make dev`, `make migrate`, etc.)
- Wolverine configurado no host com discovery por assembly
- Extension classes para Program.cs (Cors, Modules, Wolverine, Auth, ExceptionHandling)
- **Entity Manager completo** — CRUD de EntityDefinition + FieldDefinition (back + front)
  - Drag-and-drop para reordenar campos (Angular CDK)
  - Campo JSONB para dados dinâmicos (EntityData.Payload)
- **Parâmetros do Sistema completo** — CRUD agrupado com suporte a String/Number/Boolean/JSON + cache com invalidação
- **Controle de Acesso completo** — Roles customizáveis + matriz de permissões por entidade
- **White Label completo** — Gestão de tenants + editor de tema visual (color picker)
- **Auth end-to-end** — Login, refresh token, JWT claims (TenantId/UserId/Roles), registro
- **Tenant Resolution** — Middleware lê JWT claim `tenant_id` → `ICurrentTenant`, fallback `X-Tenant-Id` em Development
- **Tema dinâmico no Angular** — consome `/tenants/{slug}/config`, aplica CSS variables, fallback localStorage
- Angular 21 standalone + PrimeNG Aura + lazy routing + interceptors (API + Error + Auth)

### ⏳ Pendente — Fase 1
- [ ] **Form Builder frontend** — listagem, editor, preview ao vivo
- [ ] **Testes do FormBuilder** — nenhum projeto de teste criado ainda

---

## Fase 2 — Form Builder + Workflow

### ✅ Concluído (parcial)
- [x] Form Builder backend — `FormDefinition`, `FormField`, CRUD, publish, duplicate
- [x] CI/CD — GitHub Actions para build + test backend e frontend

### ⏳ Pendente
- [ ] **Form Builder frontend** — listagem, editor, preview ao vivo (ngx-formly ou custom)
- [ ] **Endpoints `/config/entities` públicos** — API para apps de negócio consumirem configurações
- [ ] Workflow Designer backend (`WorkflowDefinition`, `State`, `Transition`)
- [ ] Workflow Designer frontend (Angular CDK drag-drop canvas)
- [ ] Motor de execução de workflow (.NET handlers)
- [ ] Webhooks por transição

---

## Fase 3 — App de Negócio (Chamados)

### ⏳ Pendente
- [ ] Módulo `Tickets` consumindo Admin Core via `/config/*`
- [ ] CRUD de chamados com formulários configurados na Fase 2
- [ ] Dashboard de chamados com filtros dinâmicos
- [ ] Notificações real-time (SignalR)
- [ ] Integração com sistemas externos (REST connectors)

---

## Fase 4 — Operacional

### ✅ Concluído (parcial)
- [x] CI/CD (GitHub Actions)
- [x] Guia de extração para microsserviços

### ⏳ Pendente
- [ ] Observabilidade (OpenTelemetry + Serilog estruturado)
- [ ] Rate limiting por tenant
- [ ] Audit log por operação
