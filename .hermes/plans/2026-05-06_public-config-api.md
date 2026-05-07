# Plano: Public Config API + EntityData CRUD

> Meta: Transformar AdminCore de "configurador" em "launcher" — apps externos consomem configurações e dados.

## Objetivo

Criar endpoints públicos `/config/{tenantSlug}/entities/*` que permitem a apps de negócio externos:
1. Listar entidades configuradas para um tenant
2. Obter definição de entidade (campos + formulário se existir)
3. CRUD completo de registros (EntityData) nas tabelas dinâmicas

## Arquivos a Criar

```
backend/src/AdminCore.API/Controllers/ConfigController.cs
backend/src/Modules/Entities/.../Application/Commands/CreateEntityDataCommand.cs
backend/src/Modules/Entities/.../Application/Commands/UpdateEntityDataCommand.cs
backend/src/Modules/Entities/.../Application/Commands/DeleteEntityDataCommand.cs
backend/src/Modules/Entities/.../Application/Queries/GetEntityDataQuery.cs
backend/src/Modules/Entities/.../Application/Queries/GetEntityDataListQuery.cs
backend/src/Modules/Entities/.../Application/Queries/GetEntityDefinitionBySlugQuery.cs
backend/src/Modules/Entities/.../Application/DTOs/EntityDataDto.cs
backend/tests/AdminCore.Modules.Entities.Tests/EntityDataHandlerTests.cs
backend/tests/AdminCore.API.Tests/ConfigControllerTests.cs
```

## Arquivos a Modificar

```
backend/src/AdminCore.API/Program.cs — garantir que o ConfigController é mapeado
```

## Plano de Execução

### Task 1: EntityData DTO
Criar `EntityDataDto.cs` — record simples com Id, EntityDefinitionId, TenantId, Payload (string JSON), CreatedAt, UpdatedAt.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/DTOs/EntityDataDto.cs`

### Task 2: CreateEntityData Command
Criar `CreateEntityDataCommand.cs` — record com TenantId, EntityDefinitionId, Payload (JSON string).
Handler: validar que EntityDefinition existe e pertence ao tenant, criar EntityData, salvar, retornar DTO.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/Commands/CreateEntityDataCommand.cs`

### Task 3: UpdateEntityData Command  
Criar `UpdateEntityDataCommand.cs` — record com TenantId, EntityDataId, Payload.
Handler: buscar EntityData por id + tenant, atualizar Payload, salvar, retornar DTO.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/Commands/UpdateEntityDataCommand.cs`

### Task 4: DeleteEntityData Command
Criar `DeleteEntityDataCommand.cs` — record com TenantId, EntityDataId.
Handler: buscar EntityData por id + tenant, remover, salvar.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/Commands/DeleteEntityDataCommand.cs`

### Task 5: GetEntityData Queries
Criar `GetEntityDataQuery.cs` — record com TenantId, EntityDataId → retorna DTO único.
Criar `GetEntityDataListQuery.cs` — record com TenantId, EntityDefinitionId, Page, PageSize → retorna PagedList<EntityDataDto>.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/Queries/GetEntityDataQuery.cs`

### Task 6: GetEntityDefinitionBySlug Query
Criar query pública que busca EntityDefinition por slug + tenant, retorna definição com campos + formulário associado (se existir form com mesmo slug no FormBuilder).
Precisa injetar FormBuilderDbContext para buscar o formulário.
Arquivo: `backend/src/Modules/Entities/AdminCore.Modules.Entities/Application/Queries/GetEntityDefinitionBySlugQuery.cs`

### Task 7: ConfigController
Criar `ConfigController.cs` — endpoints públicos (sem [Authorize]):
- `GET  /config/{tenantSlug}/entities` — lista entidades ativas do tenant
- `GET  /config/{tenantSlug}/entities/{entitySlug}` — definição + campos + formulário
- `GET  /config/{tenantSlug}/entities/{entitySlug}/data` — lista paginada de registros
- `GET  /config/{tenantSlug}/entities/{entitySlug}/data/{id}` — registro único
- `POST   /config/{tenantSlug}/entities/{entitySlug}/data` — criar registro
- `PUT    /config/{tenantSlug}/entities/{entitySlug}/data/{id}` — atualizar
- `DELETE /config/{tenantSlug}/entities/{entitySlug}/data/{id}` — deletar

Tenant resolvido pelo slug na URL: buscar tenant pelo slug no TenantsDbContext, setar no ICurrentTenant, depois disparar os handlers.

### Task 8: Testes
Criar testes xUnit para os handlers de EntityData e para o ConfigController.
Usar InMemory DbContext, seguir padrão dos testes existentes (AuthHandlerTests).
Arquivos em: `backend/tests/AdminCore.Modules.Entities.Tests/`

## Convenções a Seguir

- Handlers: Command/Query + Handler co-localizados no mesmo arquivo
- DTOs: records com construtor primário
- Exceções: NotFoundException(entity, key), ForbiddenException(msg?)
- PagedList: object initializer (não construtor)
- TenantId sempre validado nos handlers (não confiar só no controller)
- Injeção: construtor primário (classe com parâmetros)
- Testes: xUnit + NSubstitute + FluentAssertions, InMemory DbContext

## Verificação

```bash
cd backend && dotnet build AdminCore.slnx
cd backend && dotnet test AdminCore.slnx
```
