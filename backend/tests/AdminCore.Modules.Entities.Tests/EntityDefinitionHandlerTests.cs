using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Application.Queries;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Tests;

public class EntityDefinitionHandlerTests
{
    [Fact]
    public async Task Create_ValidCommand_ReturnsDtoWithGeneratedId()
    {
        await using var db = CreateDb();
        var handler = new CreateEntityDefinitionHandler(db);
        var tenantId = Guid.NewGuid();

        var result = await handler.Handle(new CreateEntityDefinitionCommand(
            tenantId, "Chamado TI", "chamado-ti", "Tickets de TI", "pi-ticket"), default);

        result.Name.Should().Be("Chamado TI");
        result.Slug.Should().Be("chamado-ti");
        result.Id.Should().NotBe(Guid.Empty);
        result.FieldCount.Should().Be(0);
    }

    [Fact]
    public async Task Create_DuplicateSlugInTenant_ThrowsConflict()
    {
        await using var db = CreateDb();
        var handler = new CreateEntityDefinitionHandler(db);
        var tenantId = Guid.NewGuid();

        await handler.Handle(new CreateEntityDefinitionCommand(tenantId, "A", "same", null, null), default);

        var act = () => handler.Handle(new CreateEntityDefinitionCommand(tenantId, "B", "same", null, null), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Create_SameSlugDifferentTenants_Allowed()
    {
        await using var db = CreateDb();
        var handler = new CreateEntityDefinitionHandler(db);

        var t1 = await handler.Handle(new CreateEntityDefinitionCommand(Guid.NewGuid(), "A", "shared", null, null), default);
        var t2 = await handler.Handle(new CreateEntityDefinitionCommand(Guid.NewGuid(), "B", "shared", null, null), default);

        t1.Slug.Should().Be("shared");
        t2.Slug.Should().Be("shared");
    }

    [Fact]
    public async Task GetAll_Paginated_ReturnsPagedList()
    {
        await using var db = CreateDb();
        var create = new CreateEntityDefinitionHandler(db);
        var tenantId = Guid.NewGuid();

        for (int i = 1; i <= 5; i++)
            await create.Handle(new CreateEntityDefinitionCommand(tenantId, $"Entity {i}", $"entity-{i}", null, null), default);

        var handler = new GetEntityDefinitionsHandler(db);
        var result = await handler.Handle(new GetEntityDefinitionsQuery(tenantId, 1, 2), default);

        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(5);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(2);
        result.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task GetAll_WithSearch_FiltersByName()
    {
        await using var db = CreateDb();
        var create = new CreateEntityDefinitionHandler(db);
        var tenantId = Guid.NewGuid();

        await create.Handle(new CreateEntityDefinitionCommand(tenantId, "Alpha", "alpha", null, null), default);
        await create.Handle(new CreateEntityDefinitionCommand(tenantId, "Beta", "beta", null, null), default);
        await create.Handle(new CreateEntityDefinitionCommand(tenantId, "Gamma", "gamma", null, null), default);

        var handler = new GetEntityDefinitionsHandler(db);
        var result = await handler.Handle(new GetEntityDefinitionsQuery(tenantId, 1, 20, "Beta"), default);

        result.Items.Should().ContainSingle();
        result.Items[0].Name.Should().Be("Beta");
    }

    [Fact]
    public async Task GetById_Existing_ReturnsEntityWithFields()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = new EntityDefinition
        {
            TenantId = tenantId,
            Name = "Ticket",
            Slug = "ticket"
        };
        db.EntityDefinitions.Add(entity);
        db.FieldDefinitions.AddRange(
            new FieldDefinition { TenantId = tenantId, EntityDefinitionId = entity.Id, Name = "Título", Slug = "titulo", FieldType = FieldType.Text, DisplayOrder = 0 },
            new FieldDefinition { TenantId = tenantId, EntityDefinitionId = entity.Id, Name = "Descrição", Slug = "descricao", FieldType = FieldType.Textarea, DisplayOrder = 1 }
        );
        await db.SaveChangesAsync();

        var handler = new GetEntityDefinitionByIdHandler(db);
        var result = await handler.Handle(new GetEntityDefinitionByIdQuery(tenantId, entity.Id), default);

        result.Name.Should().Be("Ticket");
        result.Fields.Should().HaveCount(2);
        result.Fields[0].Slug.Should().Be("titulo");
        result.Fields[1].Slug.Should().Be("descricao");
    }

    [Fact]
    public async Task GetById_NotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new GetEntityDefinitionByIdHandler(db);

        var act = () => handler.Handle(new GetEntityDefinitionByIdQuery(Guid.NewGuid(), Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Update_Existing_UpdatesAndReturnsDto()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = new EntityDefinition { TenantId = tenantId, Name = "Old", Slug = "old", IsActive = true };
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync();

        var handler = new UpdateEntityDefinitionHandler(db);
        var result = await handler.Handle(new UpdateEntityDefinitionCommand(
            tenantId, entity.Id, "New", "Updated desc", "pi-star", false, 5), default);

        result.Name.Should().Be("New");
        result.Description.Should().Be("Updated desc");
        result.IsActive.Should().BeFalse();
        result.DisplayOrder.Should().Be(5);
    }

    [Fact]
    public async Task Update_NotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new UpdateEntityDefinitionHandler(db);

        var act = () => handler.Handle(new UpdateEntityDefinitionCommand(
            Guid.NewGuid(), Guid.NewGuid(), "X", null, null, true, 0), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Delete_Existing_RemovesEntity()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = new EntityDefinition { TenantId = tenantId, Name = "ToDelete", Slug = "to-delete" };
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync();

        var handler = new DeleteEntityDefinitionHandler(db);
        await handler.Handle(new DeleteEntityDefinitionCommand(tenantId, entity.Id), default);

        var exists = await db.EntityDefinitions.AnyAsync(e => e.Id == entity.Id);
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_NotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new DeleteEntityDefinitionHandler(db);

        var act = () => handler.Handle(new DeleteEntityDefinitionCommand(Guid.NewGuid(), Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ReorderFields_Existing_ReordersCorrectly()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = new EntityDefinition { TenantId = tenantId, Name = "E", Slug = "e" };
        db.EntityDefinitions.Add(entity);
        var f1 = new FieldDefinition { TenantId = tenantId, EntityDefinitionId = entity.Id, Name = "A", Slug = "a", FieldType = FieldType.Text, DisplayOrder = 0 };
        var f2 = new FieldDefinition { TenantId = tenantId, EntityDefinitionId = entity.Id, Name = "B", Slug = "b", FieldType = FieldType.Text, DisplayOrder = 1 };
        var f3 = new FieldDefinition { TenantId = tenantId, EntityDefinitionId = entity.Id, Name = "C", Slug = "c", FieldType = FieldType.Text, DisplayOrder = 2 };
        db.FieldDefinitions.AddRange(f1, f2, f3);
        await db.SaveChangesAsync();

        var handler = new ReorderFieldsHandler(db);
        await handler.Handle(new ReorderFieldsCommand(tenantId, entity.Id, [f3.Id, f1.Id, f2.Id]), default);

        var fields = await db.FieldDefinitions.Where(f => f.EntityDefinitionId == entity.Id).OrderBy(f => f.DisplayOrder).ToListAsync();
        fields[0].Slug.Should().Be("c");
        fields[1].Slug.Should().Be("a");
        fields[2].Slug.Should().Be("b");
    }

    [Fact]
    public async Task ReorderFields_NotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new ReorderFieldsHandler(db);

        var act = () => handler.Handle(new ReorderFieldsCommand(Guid.NewGuid(), Guid.NewGuid(), []), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    private static EntitiesDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<EntitiesDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new EntitiesDbContext(options);
    }
}
