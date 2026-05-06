# AdminCore — Arquitetura do Sistema

## Visão Geral
Plataforma white label low-code para gestão de chamados e processos. O sistema é um **monolito modular** preparado para extração a microsserviços.

## Princípio de Desacoplamento
- **Admin Core** expõe APIs de configuração (entidades, parâmetros, acesso, white label)
- **Apps de negócio** (ex: Chamados) consomem o Admin Core via endpoints `/config/*`
- Módulos comunicam entre si via Wolverine (in-process hoje, mensageria externa amanhã)

## Stack
| Camada | Tecnologia |
|--------|-----------|
| Backend | .NET 10 ASP.NET Core Web API |
| Mensageria/Background | WolverineFx 5.x |
| ORM | Entity Framework Core 10 + Npgsql |
| Banco | PostgreSQL 17 (JSONB para dados dinâmicos) |
| Auth | ASP.NET Identity + JWT + Refresh Tokens |
| Frontend | Angular 21 + TypeScript |
| UI | PrimeNG 18+ |
| Form Builder | ngx-formly |
| Testes | xUnit + NSubstitute + FluentAssertions |
| Container | Docker + Docker Compose |

## Estrutura de Projetos

```
backend/
├── AdminCore.slnx
├── src/
│   ├── AdminCore.API/                   ← Host mínimo (startup, routing)
│   ├── Shared/
│   │   └── AdminCore.Shared.Kernel/     ← Primitivos: base entities, interfaces, exceptions
│   └── Modules/
│       ├── Auth/AdminCore.Modules.Auth/         ← Usuários, JWT, refresh tokens
│       ├── Tenants/AdminCore.Modules.Tenants/   ← Multi-tenant + white label
│       ├── Entities/AdminCore.Modules.Entities/ ← Entidades dinâmicas + campos + dados
│       ├── Access/AdminCore.Modules.Access/     ← Roles customizáveis + permissões
│       └── Parameters/AdminCore.Modules.Parameters/ ← Parâmetros do sistema
├── tests/
│   ├── AdminCore.Modules.Auth.Tests/
│   ├── AdminCore.Modules.Entities.Tests/
│   └── AdminCore.Modules.Access.Tests/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml

frontend/
└── src/app/
    ├── core/          (auth, guards, interceptors, tenant)
    ├── shared/        (componentes reutilizáveis)
    └── admin/         (módulo admin — lazy loaded)
        ├── entities/
        ├── parameters/
        ├── access/
        └── white-label/
```

## Estrutura Interna de Módulo
Cada módulo segue a mesma estrutura interna:
```
AdminCore.Modules.{Name}/
├── Domain/           ← Entidades, enums, value objects do módulo
├── Application/
│   ├── Commands/     ← Wolverine handlers (escrita)
│   └── Queries/      ← Wolverine handlers (leitura)
├── Infrastructure/
│   └── Persistence/  ← DbContext próprio com schema isolado
└── {Name}Module.cs   ← IModule.RegisterModule()
```

## Schemas PostgreSQL (isolamento por módulo)
| Schema | Módulo |
|--------|--------|
| `auth` | Auth |
| `tenants` | Tenants |
| `entities` | Entities |
| `access` | Access |
| `parameters` | Parameters |

## Fluxo de Mensagens (Wolverine)
- Handlers em `Application/Commands/` e `Application/Queries/`
- `IMessageBus.InvokeAsync<T>()` para comandos síncronos
- `IMessageBus.PublishAsync()` para eventos assíncronos (fácil migrar para RabbitMQ)
- Para microsserviços: instalar `WolverineFx.RabbitMQ` e trocar transporte
