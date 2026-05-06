# AdminCore — Padrões e Convenções

## Handlers Wolverine (Commands/Queries)
```csharp
// Command — escrita
public record CreateEntityCommand(Guid TenantId, string Name, string Slug);

public class CreateEntityHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinition> Handle(CreateEntityCommand cmd, CancellationToken ct)
    {
        var entity = new EntityDefinition { TenantId = cmd.TenantId, Name = cmd.Name, Slug = cmd.Slug };
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }
}

// Query — leitura (sem efeito colateral)
public record GetEntitiesQuery(Guid TenantId, int Page = 1, int PageSize = 20);

public class GetEntitiesHandler(EntitiesDbContext db)
{
    public async Task<PagedList<EntityDefinition>> Handle(GetEntitiesQuery query, CancellationToken ct)
    {
        var items = await db.EntityDefinitions
            .Where(e => e.TenantId == query.TenantId)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);
        // ...
    }
}
```

## Endpoints Mínimos com Wolverine.Http
```csharp
// Em um módulo, registrar endpoints via extension method
public static class EntitiesEndpoints
{
    public static IEndpointRouteBuilder MapEntitiesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/entities").RequireAuthorization();
        group.MapGet("/", async (IMessageBus bus, ICurrentTenant tenant) =>
            await bus.InvokeAsync(new GetEntitiesQuery(tenant.Id!.Value)));
        group.MapPost("/", async (CreateEntityCommand cmd, IMessageBus bus) =>
            await bus.InvokeAsync(cmd));
        return app;
    }
}
```

## Testes com NSubstitute
```csharp
public class CreateEntityHandlerTests
{
    [Fact]
    public async Task Handle_ValidCommand_CreatesEntity()
    {
        // Arrange
        var db = Substitute.For<EntitiesDbContext>();
        var handler = new CreateEntityHandler(db);
        var cmd = new CreateEntityCommand(Guid.NewGuid(), "Chamado TI", "chamado-ti");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.Name.Should().Be("Chamado TI");
        await db.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
```

## Validação com FluentValidation
```csharp
public class CreateEntityCommandValidator : AbstractValidator<CreateEntityCommand>
{
    public CreateEntityCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().Matches("^[a-z0-9-]+$").MaximumLength(50);
    }
}
```

## Convenções de Nomeclatura
- Commands: `{Verbo}{Entidade}Command` — ex: `CreateEntityCommand`, `UpdateFieldCommand`
- Queries: `Get{Entidade}Query` — ex: `GetEntitiesQuery`, `GetEntityByIdQuery`
- Handlers: `{Command/Query}Handler` — mesmo namespace do command/query
- DTOs de resposta: `{Entidade}Dto` — ex: `EntityDefinitionDto`
- Módulos: `{Nome}Module.cs` na raiz do projeto

## Multi-Tenancy
- Toda entidade de negócio herda de `TenantAuditableEntity`
- `ICurrentTenant` resolvido via middleware que lê JWT claim `tenant_id`
- EF Core interceptors adicionam `WHERE TenantId = @tenant` automaticamente (a implementar)

## Migrations
Cada módulo tem seu próprio DbContext e migrations:
```bash
dotnet ef migrations add InitAuth -p src/Modules/Auth/AdminCore.Modules.Auth -s src/AdminCore.API
dotnet ef database update -p src/Modules/Auth/AdminCore.Modules.Auth -s src/AdminCore.API
```
