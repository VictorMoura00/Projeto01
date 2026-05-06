# AdminCore — Roadmap

## Fase 1 — Admin Core MVP (em andamento)

### ✅ Concluído
- Estrutura do monolito modular (.NET 10)
- Projetos: Shared.Kernel + 5 módulos + 3 projetos de testes
- Entidades de domínio de todos os módulos
- DbContexts isolados por schema PostgreSQL
- Docker + docker-compose (PostgreSQL + API)
- Wolverine configurado no host
- JWT Bearer configurado
- MCPs: PrimeNG, Angular, dotnet skills

### 🔄 Em progresso
- [ ] Classes de configuração para Program.cs (JwtConfig, CorsConfig, ModulesConfig)
- [ ] Auth end-to-end (login, register, refresh token handlers + endpoints)
- [ ] Setup Angular 21 (PrimeNG, lazy routing, interceptors)

### ⏳ Pendente — Fase 1
- [ ] Middleware de tenant resolution (lê JWT → ICurrentTenant)
- [ ] Entity Manager — CRUD de EntityDefinition + FieldDefinition (back + front)
- [ ] Parâmetros do sistema — CRUD com cache
- [ ] Controle de Acesso — roles + matriz de permissões
- [ ] White Label — tema dinâmico por tenant
- [ ] EF Core migrations iniciais de todos os módulos
- [ ] Testes unitários básicos (Auth, Entities, Access handlers)

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
