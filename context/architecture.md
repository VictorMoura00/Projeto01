# AdminCore — Arquitetura do Sistema

## Visão Geral
Plataforma white label low-code para gestão configurável de processos. O sistema é um **monolito modular** preparado para extração a microsserviços. Admins configuram entidades, formulários, workflows e parâmetros via UI — apps de negócio apenas consomem.

## Princípio de Desacoplamento
```
┌─────────────────────────────────────┐
│          ADMIN CORE (este repo)     │
│  Entities · Parameters · Access     │
│  White Label · (Forms · Workflows)  │
│  Expõe: REST API /admin/* e /config/*│
└──────────────┬──────────────────────┘
               │ consome (só leitura de configs)
    ┌──────────┴──────────┐
    │  App Chamados (F3)  │  outros apps
    └─────────────────────┘
```

## Stack
| Camada | Tecnologia |
|--------|-----------|
| Backend | .NET 10 ASP.NET Core Web API |
| Mensageria/Background | WolverineFx 5.x |
| ORM | Entity Framework Core 10 + Npgsql |
| Banco | PostgreSQL 17 (JSONB para dados dinâmicos) |
| Auth | ASP.NET Identity + JWT + Refresh Tokens (**deferido**) |
| Frontend | Angular 21 + TypeScript (standalone components) |
| UI | PrimeNG 21+ tema Aura |
| Testes | xUnit + NSubstitute + FluentAssertions |
| Container | Docker + Docker Compose |
| Dev IaC | Makefile (`make dev` sobe tudo) |

## Estrutura de Projetos

```
backend/
├── AdminCore.slnx              ← .NET 10 usa .slnx (não .sln)
├── src/
│   ├── AdminCore.API/          ← Host: startup, controllers, extensions
│   │   ├── Controllers/        ← MVC Controllers (não Wolverine.Http)
│   │   ├── Extensions/         ← CorsExtensions, ModulesExtensions, WolverineExtensions
│   │   └── Properties/launchSettings.json  ← porta 5000 (http profile)
│   ├── Shared/
│   │   └── AdminCore.Shared.Kernel/
│   └── Modules/
│       ├── Auth/AdminCore.Modules.Auth/
│       ├── Tenants/AdminCore.Modules.Tenants/
│       ├── Entities/AdminCore.Modules.Entities/
│       ├── Access/AdminCore.Modules.Access/
│       └── Parameters/AdminCore.Modules.Parameters/
├── tests/
│   ├── AdminCore.Modules.Auth.Tests/
│   ├── AdminCore.Modules.Entities.Tests/
│   └── AdminCore.Modules.Access.Tests/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml       ← produção

frontend/
└── src/app/
    ├── app.config.ts            ← MessageService provido aqui (root-level)
    ├── core/
    │   └── interceptors/        ← apiInterceptor (prefixo URL), errorInterceptor (toasts)
    └── admin/
        ├── admin-layout.component.ts  ← sidebar + <p-toast />
        ├── entities/
        ├── parameters/
        ├── access/
        └── white-label/

context/    ← este diretório — docs para agents
docker-compose.dev.yml   ← só PostgreSQL, dev local
Makefile                 ← make dev / up / migrate / build / test
```

## Estrutura Interna de Módulo Backend
```
AdminCore.Modules.{Name}/
├── Domain/                  ← Entidades, enums (sem dependências externas)
├── Application/
│   ├── Commands/            ← record Command + class Handler (co-locados)
│   ├── Queries/             ← record Query + class Handler (co-locados)
│   └── DTOs/                ← records de resposta
├── Infrastructure/
│   └── Persistence/         ← DbContext com schema próprio + migrations
└── {Name}Module.cs          ← IModule.RegisterModule(services, config)
```

## Regras Críticas

**Program.cs** — apenas chamadas de extension methods, NUNCA config inline:
```csharp
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddModules(builder.Configuration);
builder.Host.AddWolverineModules();
```

**Autenticação** — **deferida**. Todos os controllers usam `DevTenantId` hardcoded:
```csharp
private static readonly Guid DevTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");
```
Quando auth for implementado: JWT claim `tenant_id` → `ICurrentTenant`.

**Schemas PostgreSQL (isolamento por módulo)**
| Schema | Módulo |
|--------|--------|
| `auth` | Auth |
| `tenants` | Tenants |
| `entities` | Entities |
| `access` | Access |
| `parameters` | Parameters |

## Dev Local
```bash
make dev      # sobe PostgreSQL, aplica migrations, inicia API (5000) + frontend (4200)
make migrate  # só migrations
make up       # só PostgreSQL
make down     # para containers
```
