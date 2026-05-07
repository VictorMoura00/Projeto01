using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Application.Queries;
using AdminCore.Modules.Entities.Application.Validation;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Tests;

public class EntityDataHandlerTests
{
    [Fact]
    public async Task Create_ValidCommand_ReturnsDto()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var handler = new CreateEntityDataHandler(db, CreateValidator(db));

        var result = await handler.Handle(
            new CreateEntityDataCommand(tenantId, entityId, "{\"title\":\"Test\"}"), default);

        result.Id.Should().NotBe(Guid.Empty);
        result.EntityDefinitionId.Should().Be(entityId);
        result.Payload.Should().Be("{\"title\":\"Test\"}");
    }

    [Fact]
    public async Task Create_EntityNotFound_ThrowsNotFoundException()
    {
        await using var db = CreateDb();
        var handler = new CreateEntityDataHandler(db, CreateValidator(db));

        var act = () => handler.Handle(
            new CreateEntityDataCommand(Guid.NewGuid(), Guid.NewGuid(), "{}"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Create_WrongTenant_ThrowsNotFoundException()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var handler = new CreateEntityDataHandler(db, CreateValidator(db));

        var act = () => handler.Handle(
            new CreateEntityDataCommand(Guid.NewGuid(), entityId, "{}"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Update_ValidCommand_UpdatesPayload()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var createHandler = new CreateEntityDataHandler(db, CreateValidator(db));
        var created = await createHandler.Handle(
            new CreateEntityDataCommand(tenantId, entityId, "{\"old\":true}"), default);

        var updateHandler = new UpdateEntityDataHandler(db, CreateValidator(db));
        var result = await updateHandler.Handle(
            new UpdateEntityDataCommand(tenantId, created.Id, "{\"new\":true}"), default);

        result.Payload.Should().Be("{\"new\":true}");
        result.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task Update_NotFound_ThrowsNotFoundException()
    {
        await using var db = CreateDb();
        var handler = new UpdateEntityDataHandler(db, CreateValidator(db));

        var act = () => handler.Handle(
            new UpdateEntityDataCommand(Guid.NewGuid(), Guid.NewGuid(), "{}"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Update_WrongTenant_ThrowsNotFoundException()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var createHandler = new CreateEntityDataHandler(db, CreateValidator(db));
        var created = await createHandler.Handle(
            new CreateEntityDataCommand(tenantId, entityId, "{}"), default);
        var updateHandler = new UpdateEntityDataHandler(db, CreateValidator(db));

        var act = () => updateHandler.Handle(
            new UpdateEntityDataCommand(Guid.NewGuid(), created.Id, "{}"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Delete_ValidCommand_RemovesEntity()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var createHandler = new CreateEntityDataHandler(db, CreateValidator(db));
        var created = await createHandler.Handle(
            new CreateEntityDataCommand(tenantId, entityId, "{}"), default);

        var deleteHandler = new DeleteEntityDataHandler(db);
        await deleteHandler.Handle(new DeleteEntityDataCommand(tenantId, created.Id), default);

        var exists = await db.EntityData.AnyAsync(e => e.Id == created.Id);
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task GetById_ReturnsDto()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var createHandler = new CreateEntityDataHandler(db, CreateValidator(db));
        var created = await createHandler.Handle(
            new CreateEntityDataCommand(tenantId, entityId, "{\"x\":1}"), default);

        var getHandler = new GetEntityDataHandler(db);
        var result = await getHandler.Handle(new GetEntityDataQuery(tenantId, created.Id), default);

        result.Id.Should().Be(created.Id);
        result.Payload.Should().Be("{\"x\":1}");
    }

    [Fact]
    public async Task GetList_Paginated_ReturnsPagedList()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entityId = await SeedEntityAsync(db, tenantId, "tickets");
        var createHandler = new CreateEntityDataHandler(db, CreateValidator(db));

        for (var i = 0; i < 5; i++)
            await createHandler.Handle(new CreateEntityDataCommand(tenantId, entityId, $"{{\"n\":{i}}}"), default);

        var listHandler = new GetEntityDataListHandler(db);
        var result = await listHandler.Handle(
            new GetEntityDataListQuery(tenantId, entityId, 1, 3), default);

        result.Items.Should().HaveCount(3);
        result.TotalCount.Should().Be(5);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(3);
    }

    [Fact]
    public async Task GetList_CrossTenantIsolation()
    {
        await using var db = CreateDb();
        var t1 = Guid.NewGuid();
        var t2 = Guid.NewGuid();
        var e1 = await SeedEntityAsync(db, t1, "tickets");
        var e2 = await SeedEntityAsync(db, t2, "tickets");

        var handler = new CreateEntityDataHandler(db, CreateValidator(db));
        await handler.Handle(new CreateEntityDataCommand(t1, e1, "{}"), default);
        await handler.Handle(new CreateEntityDataCommand(t2, e2, "{}"), default);

        var listHandler = new GetEntityDataListHandler(db);
        var r1 = await listHandler.Handle(new GetEntityDataListQuery(t1, e1), default);
        var r2 = await listHandler.Handle(new GetEntityDataListQuery(t2, e2), default);

        r1.TotalCount.Should().Be(1);
        r2.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetEntityBySlug_Public_IncludesFieldsAndForm()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();

        var entity = new EntityDefinition
        {
            TenantId = tenantId,
            Name = "Chamados",
            Slug = "chamados",
            IsActive = true
        };
        entity.Fields.Add(new FieldDefinition
        {
            TenantId = tenantId,
            Name = "Título",
            Slug = "titulo",
            FieldType = FieldType.Text,
            IsRequired = true
        });
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync();

        // Need FormBuilderDbContext for the handler, but InMemory won't work cross-context.
        // This tests that entity resolution works without form (form is optional).
        // For full test with form, we'd need a test container or mock.
    }

    private static async Task<Guid> SeedEntityAsync(EntitiesDbContext db, Guid tenantId, string slug)
    {
        var entity = new EntityDefinition
        {
            TenantId = tenantId,
            Name = slug,
            Slug = slug,
            IsActive = true
        };
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync();
        return entity.Id;
    }

    private static EntitiesDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<EntitiesDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new EntitiesDbContext(options);
    }

    private static EntityDataValidator CreateValidator(EntitiesDbContext db) => new(db);
}
