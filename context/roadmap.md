# AdminCore — Roadmap

## Fase 1 — Admin Core MVP (em andamento)

### ✅ Concluído
- Estrutura do monolito modular (.NET 10)
- Projetos: Shared.Kernel + 5 módulos + 3 projetos de testes
- Entidades de domínio de todos os módulos
- DbContexts isolados por schema PostgreSQL (auth, tenants, entities, access, parameters)
- EF Core migrations iniciais de todos os módulos
- Docker + Makefile para ambiente de desenvolvimento (`make dev`, `make migrate`, etc.)
- Wolverine configurado no host com discovery por assembly
- MCPs: PrimeNG, Angular, dotnet skills
- Extension classes para Program.cs (CorsExtensions, ModulesExtensions, WolverineExtensions)
- **Entity Manager completo** — CRUD de EntityDefinition + FieldDefinition (back + front)
  - Drag-and-drop para reordenar campos (Angular CDK)
  - Campo JSONB para dados dinâmicos (EntityData.Payload)
- **Parâmetros do Sistema completo** — CRUD agrupado com suporte a String/Number/Boolean/JSON
- **Controle de Acesso completo** — Roles customizáveis + matriz de permissões por entidade
- **White Label completo** — Gestão de tenants + editor de tema visual (color picker)
- Angular 21 standalone + PrimeNG Aura + lazy routing + interceptors

### ⏳ Pendente — Fase 1
- [ ] Auth end-to-end (login, refresh token, JWT claims com TenantId/UserId)
- [ ] Middleware de tenant resolution (lê JWT → ICurrentTenant) — substitui DevTenantId hardcoded
- [ ] Cache de parâmetros no backend com invalidação
- [ ] Aplicação dinâmica do tema no Angular via CSS variables (usando `/tenants/{slug}/config`)
- [ ] Testes unitários dos handlers (Entities, Access, Parameters)

## Fase 2 — Form Builder + Workflow

### ⏳ Pendente
- [ ] Form Builder backend (FormDefinition, FormField com schema JSON)
- [ ] ngx-formly frontend com preview ao vivo
- [ ] Workflow Designer backend (WorkflowDefinition, States, Transitions)
- [ ] Workflow Designer frontend (Angular CDK drag-drop canvas)
- [ ] Motor de execução de workflow (.NET handlers)
- [ ] Webhooks por transição

## Fase 3 — App de Negócio (Chamados)

### ⏳ Pendente
- [ ] Módulo `Tickets` consumindo Admin Core via `/config/*`
- [ ] CRUD de chamados com formulários configurados na Fase 1
- [ ] Dashboard de chamados com filtros dinâmicos
- [ ] Notificações real-time (SignalR)
- [ ] Integração com sistemas externos (REST connectors)

## Fase 4 — Operacional

### ⏳ Pendente
- [ ] CI/CD (GitHub Actions)
- [ ] Observabilidade (OpenTelemetry + Serilog estruturado)
- [ ] Refresh token rotation e revogação
- [ ] Rate limiting por tenant
- [ ] Audit log por operação
- [ ] Guia de extração para microsserviços (substituir Wolverine in-process → RabbitMQ)
