# AdminCore — Agent Context

> Auto-carregado pelo Hermes Agent ao trabalhar neste diretório.

## Stack

- **Backend**: .NET 10, ASP.NET Core, Wolverine (mediator), EF Core 10 + Npgsql, PostgreSQL 17
- **Auth**: ASP.NET Identity + JWT (HMAC SHA256) + Refresh Token rotation
- **Frontend**: Angular 21 standalone + PrimeNG 21 (tema Aura), TypeScript
- **Testes**: xUnit + NSubstitute + FluentAssertions (InMemory DbContext)

## Portas

| Serviço | Porta |
|---|---|
| API (.NET) | 5000 |
| Frontend (Angular) | 4300 |
| PostgreSQL | 5432 |

⚠️ A porta do frontend é hardcoded em `package.json` (`ng serve --port 4300`). `.env` deve ter `CORS_ORIGINS=http://localhost:4300` e `FRONTEND_PORT=4300`.

## Comandos

```bash
npm run dev           # API + frontend via concurrently
npm run kill-ports    # Mata processos nas portas 5000 e 4300
npm run kill-ports -- --db  # Inclui PostgreSQL (5432)
npm run migrate       # Aplica migrations pendentes
make up               # Sobe PostgreSQL (docker)
make down             # Para containers
```

## Login / Seed

- **Dev seed automático**: `admin@admincore.local` / `Admin123!` (role Admin)
- **Endpoint**: `POST /auth/login` → `{ accessToken, refreshToken, expiresIn, user }`
- Claims JWT: `sub`, `user_id`, `tenant_id`, `email`, `name`, `roles`

## MCP Servers (configurados em ~/.hermes/config.yaml)

| Server | Tools | Transport |
|---|---|---|
| `angular-cli` | AI tutor, exemplos, best practices, geração de código | npx |
| `primeng` | Busca de componentes, temas, migration guides | binário local |
| `cwm-roslyn` | Análise semântica Roslyn: symbols, references, diagnostics, antipatterns | dotnet tool |

**Instalação do primeng** (workaround para bug de compatibilidade):
```bash
# Já instalado. Se precisar reinstalar:
mkdir -p ~/.hermes/mcp-servers/primeng && cd ~/.hermes/mcp-servers/primeng
npm init -y && npm install @primeng/mcp@21.1.6 @modelcontextprotocol/sdk@1.25.2
```

## Estrutura do Projeto

```
backend/
├── AdminCore.slnx
├── src/
│   ├── AdminCore.API/          # Host: Program.cs, Controllers, Extensions
│   ├── Shared/AdminCore.Shared.Kernel/
│   └── Modules/
│       ├── Auth/               # Identity + JWT + Refresh Tokens
│       ├── Tenants/            # Multi-tenant + White Label
│       ├── Entities/           # Entidades dinâmicas (JSONB)
│       ├── Access/             # Roles + Permissões
│       ├── Parameters/         # Configs chave-valor com cache
│       └── FormBuilder/        # Formulários dinâmicos
├── tests/
└── docker/

frontend/src/app/
├── core/auth/          # AuthService, authGuard, auth.model
├── core/interceptors/  # apiInterceptor (prefixo + refresh), errorInterceptor (toasts)
├── core/theme/         # Tema dinâmico por tenant
├── login/              # Página de login
└── admin/              # Layout admin + módulos (entities, parameters, access, forms, white-label)

context/                # Documentação para agents (PROJECT_STATUS, architecture, roadmap, etc.)
scripts/                # setup.js, migrate.js, kill-ports.js
```

## Convenções Backend

- **Handlers**: Command + Handler co-localizados no mesmo arquivo
- **Controllers**: MVC pattern com `IMessageBus`, tenant injetado via `ICurrentTenant`
- **Schemas PostgreSQL**: `auth`, `tenants`, `entities`, `access`, `parameters`, `formbuilder`
- **Exception Handling**: `NotFoundException(entity, key)`, `ConflictException(msg)`, `ForbiddenException(msg?)`
- **PagedList**: `{ Items, TotalCount, Page, PageSize, TotalPages, HasNextPage, HasPreviousPage }`

## Convenções Frontend

- **Standalone components** com `inject()` (não constructor DI)
- **MessageService**: provido no root (`app.config.ts`), injetado nos componentes/interceptors
- **Formulários em dialogs**: usar `(onClick)` no p-button, não `type="submit"`
- **Auto-slug**: `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` para remover acentos
- **Signals**: `signal()`, `computed()` para estado reativo

## Context Files

Leia estes antes de implementar features:
- `context/PROJECT_STATUS.md` — estado atual de cada módulo
- `context/architecture.md` — visão geral da arquitetura
- `context/api.md` — referência dos endpoints
- `context/patterns.md` — padrões de código (handlers, controllers, testes)
- `context/roadmap.md` — fases e milestones
- `context/modules.md` — descrição detalhada de cada módulo
