# AdminCore — Descrição dos Módulos

## Shared.Kernel (`src/Shared/AdminCore.Shared.Kernel`)
Primitivos compartilhados. **Sem lógica de negócio.**
- `AuditableEntity` — base: Id (Guid), CreatedAt, UpdatedAt
- `TenantAuditableEntity` — extends AuditableEntity com TenantId
- `ICurrentTenant` — interface para resolver tenant da requisição (não implementado enquanto auth é deferido)
- `IModule` — contrato `RegisterModule(IServiceCollection, IConfiguration)`
- `PagedList<T>` — `{ Items, TotalCount, Page, PageSize, TotalPages, HasNextPage, HasPreviousPage }` (init-only)
- `NotFoundException(entity, key)`, `ForbiddenException(message?)`, `ConflictException(message)`, `DomainException(message)`

---

## Auth Module (`src/Modules/Auth`) — ✅ COMPLETO
Autenticação e autorização via ASP.NET Identity + JWT + Refresh Tokens.
- `AppUser` (IdentityUser<Guid>) — com TenantId, FirstName, LastName, IsActive
- `AppRole` (IdentityRole<Guid>) — com TenantId, Description, IsSystemRole
- `RefreshToken` — Token, ExpiresAt, IsRevoked, ReplacedByToken
- `AuthDbContext` (schema `auth`) — Identity + RefreshTokens
- **Application**: `LoginCommand`, `RegisterCommand`, `RefreshTokenCommand` com handlers Wolverine
- **Infrastructure**: `JwtTokenService` (HMAC SHA256), `IJwtTokenService`
- **Controller**: `AuthController` — `POST /auth/login` (AllowAnonymous), `POST /auth/refresh` (AllowAnonymous), `POST /auth/register` (Admin)
- **Seed**: `DevelopmentSeedExtensions` cria tenant `admin` + admin@admincore.local / Admin123!

---

## Tenants Module (`src/Modules/Tenants`)
Gerenciamento de tenants e white label.

**Domínio:**
- `Tenant` — slug (unique), name, logoUrl?, faviconUrl?, isActive
- `TenantTheme` (owned entity) — primaryColor, secondaryColor, accentColor, surfaceColor, fontFamily

**Application:**
- Commands: `CreateTenant`, `UpdateTenant`, `UpdateTenantTheme`
- Queries: `GetTenants`, `GetTenantById`, `GetTenantConfig` (por slug — público)

**Controller:** `TenantsController` — `/admin/tenants/*` + `/tenants/{slug}/config`

---

## Entities Module (`src/Modules/Entities`)
Núcleo do sistema — entidades dinâmicas sem DDL runtime.

**Domínio:**
- `EntityDefinition` — define um tipo de entidade (name, slug, icon, description, displayOrder, isActive)
- `FieldDefinition` — campo da entidade (name, slug, fieldType, isRequired, isSearchable, isFilterable, displayOrder)
- `EntityData` — instâncias com `Payload` JSONB + TenantId + EntityDefinitionId
- `FieldType` enum: Text=0, Textarea=1, Number=2, Decimal=3, Date=4, DateTime=5, Boolean=6, Select=7, MultiSelect=8, File=9, Relation=10

**Application:**
- Commands: `CreateEntityDefinition`, `UpdateEntityDefinition`, `DeleteEntityDefinition`, `CreateFieldDefinition`, `UpdateFieldDefinition`, `DeleteFieldDefinition`, `ReorderFields`
- Queries: `GetEntityDefinitions` (paginado + search), `GetEntityDefinitionById` (com campos)
- DTOs: `EntityDefinitionDto`, `FieldDefinitionDto`

**Controller:** `EntitiesController` — `/admin/entities/*`

---

## Access Module (`src/Modules/Access`)
Roles customizáveis e permissões granulares por entidade.

**Domínio:**
- `AppRole` (TenantAuditableEntity) — name, description, isSystemRole, isActive
- `RolePermission` — RoleId, EntitySlug, Operations (flags)
- `PermissionOperation` flags: None=0, Create=1, Read=2, Update=4, Delete=8, All=15

**Application:**
- Commands: `CreateRole`, `UpdateRole`, `DeleteRole`, `SetRolePermissions`
- Queries: `GetRoles`, `GetRoleById`
- DTO: `AppRoleDto` com `List<RolePermissionDto>`

**Controller:** `AccessController` — `/admin/roles/*`

---

## Parameters Module (`src/Modules/Parameters`)
Configurações chave-valor com escopo e tipo.

**Domínio:**
- `SystemParameter` — Key (unique por TenantId), Value, Type, Group, Description, Scope, TenantId?, IsReadOnly
- `ParameterType`: String=0, Number=1, Boolean=2, Json=3
- `ParameterScope`: Global=0, Tenant=1

**Application:**
- Commands: `CreateParameter`, `UpdateParameter` (apenas value+description), `DeleteParameter`
- Queries: `GetParameters` (por group + tenant), `GetParameterByKey`
- Parâmetros IsReadOnly bloqueiam update e delete

**Controller:** `ParametersController` — `/admin/parameters/*`

---

## API Host (`src/AdminCore.API`)
Host mínimo — apenas inicialização e roteamento.

- `Program.cs` — só extension methods (regra obrigatória)
- `Extensions/ModulesExtensions.cs` — instancia e chama `RegisterModule()` de cada módulo
- `Extensions/WolverineExtensions.cs` — adiciona assemblies de todos os módulos ao scan
- `Extensions/CorsExtensions.cs` — origin padrão `http://localhost:4300`
- Auth resolvida via claims JWT (middleware `UseCurrentTenant`, `UseAuthentication`, `UseAuthorization`)
- porta: **5000** (launchSettings.json, perfil `http`)
