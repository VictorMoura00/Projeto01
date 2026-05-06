using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Tests;

public class FieldDefinitionHandlerTests
{
    [Fact]
    public async Task Create_ValidCommand_ReturnsDtoWithDisplayOrder()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = SeedEntity(db, tenantId, "Ticket", "ticket");

        var handler = new CreateFieldDefinitionHandler(db);
        var result = await handler.Handle(new CreateFieldDefinitionCommand(
            tenantId, entity.Id, "Título", "titulo", FieldType.Text, true, true, false), default);

        result.Name.Should().Be("Título");
        result.Slug.Should().Be("titulo");
        result.DisplayOrder.Should().Be(0);
    }

    [Fact]
    public async Task Create_MultipleFields_IncrementsDisplayOrder()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = SeedEntity(db, tenantId, "Ticket", "ticket");
        var handler = new CreateFieldDefinitionHandler(db);

        var f1 = await handler.Handle(new CreateFieldDefinitionCommand(tenantId, entity.Id, "A", "a", FieldType.Text), default);
        var f2 = await handler.Handle(new CreateFieldDefinitionCommand(tenantId, entity.Id, "B", "b", FieldType.Text), default);
        var f3 = await handler.Handle(new CreateFieldDefinitionCommand(tenantId, entity.Id, "C", "c", FieldType.Text), default);

        f1.DisplayOrder.Should().Be(0);
        f2.DisplayOrder.Should().Be(1);
        f3.DisplayOrder.Should().Be(2);
    }

    [Fact]
    public async Task Create_DuplicateSlugInEntity_ThrowsConflict()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var entity = SeedEntity(db, tenantId, "Ticket", "ticket");
        var handler = new CreateFieldDefinitionHandler(db);

        await handler.Handle(new CreateFieldDefinitionCommand(tenantId, entity.Id, "A", "same", FieldType.Text), default);

        var act = () => handler.Handle(new CreateFieldDefinitionCommand(tenantId, entity.Id, "B", "same", FieldType.Text), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Create_EntityNotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new CreateFieldDefinitionHandler(db);

        var act = () => handler.Handle(new CreateFieldDefinitionCommand(
            Guid.NewGuid(), Guid.NewGuid(), "A", "a", FieldType.Text), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    private static EntityDefinition SeedEntity(EntitiesDbContext db, Guid tenantId, string name, string slug)
    {
        var entity = new EntityDefinition { TenantId = tenantId, Name = name, Slug = slug };
        db.EntityDefinitions.Add(entity);
        db.SaveChanges();
        return entity;
    }

    private static EntitiesDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<EntitiesDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new EntitiesDbContext(options);
    }
}
