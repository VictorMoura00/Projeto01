# AdminCore — Descrição dos Módulos

## Shared.Kernel (`src/Shared/AdminCore.Shared.Kernel`)
Primitivos compartilhados por todos os módulos. **Não contém lógica de negócio.**
- `AuditableEntity` — base com Id, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
- `TenantAuditableEntity` — extends AuditableEntity com TenantId
- `ICurrentTenant` — interface para resolver tenant da requisição
- `ICurrentUser` — interface para resolver usuário autenticado
- `IModule` — contrato para registro de módulos no DI
- `PagedList<T>` — resultado paginado padrão
- `DomainException`, `NotFoundException`, `ForbiddenException`, `ConflictException`

## Auth Module (`src/Modules/Auth`)
Autenticação e identidade de usuários.
- `AppUser` (IdentityUser) — usuário com TenantId, FirstName, LastName
- `AppRole` (IdentityRole) — role com TenantId
- `RefreshToken` — controle de tokens de renovação
- DbContext: `AuthDbContext` (schema `auth`)
- Responsabilidades: login, register, refresh token, logout

## Tenants Module (`src/Modules/Tenants`)
Gerenciamento de tenants e white label.
- `Tenant` — id, slug, name, logo, favicon, isActive
- `TenantTheme` (owned entity) — primaryColor, secondaryColor, accentColor, fontFamily
- DbContext: `TenantsDbContext` (schema `tenants`)
- Endpoint público: `GET /tenants/{slug}/config` (sem auth)

## Entities Module (`src/Modules/Entities`)
Núcleo do sistema — entidades e campos dinâmicos.
- `EntityDefinition` — define um "tipo" de entidade (ex: "Chamado TI")
- `FieldDefinition` — campos da entidade (tipo, validações, ordem, opções)
- `EntityData` — instâncias com payload JSONB
- `FieldType` — Text, Textarea, Number, Decimal, Date, DateTime, Boolean, Select, MultiSelect, File, Relation
- DbContext: `EntitiesDbContext` (schema `entities`)
- JSONB no PostgreSQL para payload flexível sem DDL dinâmico

## Access Module (`src/Modules/Access`)
Roles customizáveis e permissões granulares.
- `AppRole` — role por tenant com nome e descrição customizáveis
- `RolePermission` — permissão por role × entidade (flags: Create, Read, Update, Delete)
- `PermissionOperation` — flags enum [None=0, Create=1, Read=2, Update=4, Delete=8, All=15]
- DbContext: `AccessDbContext` (schema `access`)
- API pública: `GET /config/entities` respeita permissões do token

## Parameters Module (`src/Modules/Parameters`)
Configurações e parâmetros do sistema.
- `SystemParameter` — chave/valor/tipo por escopo (Global ou Tenant)
- `ParameterType` — String, Number, Boolean, Json
- `ParameterScope` — Global (todos os tenants) ou Tenant (isolado)
- DbContext: `ParametersDbContext` (schema `parameters`)
- Cache automático com invalidação ao salvar

## API Host (`src/AdminCore.API`)
Host mínimo — apenas inicialização e roteamento.
- `Program.cs` — registra todos os módulos via `IModule.RegisterModule()`
- Wolverine configurado para descobrir handlers em todos os assemblies de módulos
- JWT Bearer configurado globalmente
- CORS configurado para o frontend
- `/health` endpoint público
