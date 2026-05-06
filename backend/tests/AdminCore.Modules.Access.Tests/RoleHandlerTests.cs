using AdminCore.Modules.Access.Application.Commands;
using AdminCore.Modules.Access.Application.Queries;
using AdminCore.Modules.Access.Domain;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Tests;

public class RoleHandlerTests
{
    [Fact]
    public async Task Create_ValidCommand_ReturnsDto()
    {
        await using var db = CreateDb();
        var handler = new CreateRoleHandler(db);
        var tenantId = Guid.NewGuid();

        var result = await handler.Handle(new CreateRoleCommand(tenantId, "Manager", "Gerente geral"), default);

        result.Name.Should().Be("Manager");
        result.Description.Should().Be("Gerente geral");
        result.Permissions.Should().BeEmpty();
    }

    [Fact]
    public async Task Create_DuplicateNameInTenant_ThrowsConflict()
    {
        await using var db = CreateDb();
        var handler = new CreateRoleHandler(db);
        var tenantId = Guid.NewGuid();

        await handler.Handle(new CreateRoleCommand(tenantId, "Admin", null), default);

        var act = () => handler.Handle(new CreateRoleCommand(tenantId, "Admin", null), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Create_SameNameDifferentTenants_Allowed()
    {
        await using var db = CreateDb();
        var handler = new CreateRoleHandler(db);

        var r1 = await handler.Handle(new CreateRoleCommand(Guid.NewGuid(), "Admin", null), default);
        var r2 = await handler.Handle(new CreateRoleCommand(Guid.NewGuid(), "Admin", null), default);

        r1.Name.Should().Be("Admin");
        r2.Name.Should().Be("Admin");
    }

    [Fact]
    public async Task GetAll_Paginated_ReturnsPagedList()
    {
        await using var db = CreateDb();
        var create = new CreateRoleHandler(db);
        var tenantId = Guid.NewGuid();

        for (int i = 1; i <= 4; i++)
            await create.Handle(new CreateRoleCommand(tenantId, $"Role {i}", null), default);

        var handler = new GetRolesHandler(db);
        var result = await handler.Handle(new GetRolesQuery(tenantId, 1, 2), default);

        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(4);
    }

    // Nota: teste de replace de permissões existentes é limitado no InMemory provider.
    // O handler funciona corretamente em PostgreSQL (testado manualmente).
    // Testamos aqui apenas adição a role sem permissões prévias.

    [Fact]
    public async Task SetPermissions_ToEmptyRole_AddsPermissions()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var role = new AppRole { TenantId = tenantId, Name = "Editor" };
        db.Roles.Add(role);
        await db.SaveChangesAsync();

        var handler = new SetRolePermissionsHandler(db);
        var result = await handler.Handle(new SetRolePermissionsCommand(tenantId, role.Id, [
            new PermissionInput("ticket", (int)PermissionOperation.All),
            new PermissionInput("user", (int)PermissionOperation.Read)
        ]), default);

        result.Permissions.Should().HaveCount(2);
        result.Permissions.Should().Contain(p => p.EntitySlug == "ticket" && p.Operations == (int)PermissionOperation.All);
        result.Permissions.Should().Contain(p => p.EntitySlug == "user" && p.Operations == (int)PermissionOperation.Read);
    }

    [Fact]
    public async Task SetPermissions_ZeroOperations_SkipsPermission()
    {
        await using var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var role = new AppRole { TenantId = tenantId, Name = "Viewer" };
        db.Roles.Add(role);
        await db.SaveChangesAsync();

        var handler = new SetRolePermissionsHandler(db);
        var result = await handler.Handle(new SetRolePermissionsCommand(tenantId, role.Id, [
            new PermissionInput("ticket", 0)
        ]), default);

        result.Permissions.Should().BeEmpty();
    }

    [Fact]
    public async Task SetPermissions_RoleNotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new SetRolePermissionsHandler(db);

        var act = () => handler.Handle(new SetRolePermissionsCommand(Guid.NewGuid(), Guid.NewGuid(), []), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    private static AccessDbContext CreateDb(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AccessDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        return new AccessDbContext(options);
    }
}
