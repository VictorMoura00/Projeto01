using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Application.Queries;
using AdminCore.Modules.Parameters.Domain;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AdminCore.Modules.Parameters.Tests;

public class ParameterHandlerTests
{
    [Fact]
    public async Task Create_ValidCommand_ReturnsDto()
    {
        await using var db = CreateDb();
        var handler = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        var result = await handler.Handle(new CreateParameterCommand(
            tenantId, "app.name", "AdminCore", ParameterType.String, "general", "App name", ParameterScope.Tenant), default);

        result.Key.Should().Be("app.name");
        result.Value.Should().Be("AdminCore");
        result.Type.Should().Be(ParameterType.String);
    }

    [Fact]
    public async Task Create_DuplicateKeyInTenant_ThrowsConflict()
    {
        await using var db = CreateDb();
        var handler = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        await handler.Handle(new CreateParameterCommand(tenantId, "dup", "v1", ParameterType.String, null, null, ParameterScope.Tenant), default);

        var act = () => handler.Handle(new CreateParameterCommand(tenantId, "dup", "v2", ParameterType.String, null, null, ParameterScope.Tenant), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Create_GlobalAndTenantSameKey_Allowed()
    {
        await using var db = CreateDb();
        var handler = new CreateParameterHandler(db);

        var g = await handler.Handle(new CreateParameterCommand(null, "theme", "dark", ParameterType.String, null, null, ParameterScope.Global), default);
        var t = await handler.Handle(new CreateParameterCommand(Guid.NewGuid(), "theme", "light", ParameterType.String, null, null, ParameterScope.Tenant), default);

        g.Value.Should().Be("dark");
        t.Value.Should().Be("light");
    }

    [Fact]
    public async Task Update_Existing_UpdatesValue()
    {
        await using var db = CreateDb();
        var create = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        var created = await create.Handle(new CreateParameterCommand(tenantId, "timeout", "30", ParameterType.Number, null, null, ParameterScope.Tenant), default);

        var handler = new UpdateParameterHandler(db);
        var result = await handler.Handle(new UpdateParameterCommand(tenantId, created.Id, "60", "Timeout em segundos"), default);

        result.Value.Should().Be("60");
        result.Description.Should().Be("Timeout em segundos");
    }

    [Fact]
    public async Task Update_ReadOnly_ThrowsForbidden()
    {
        await using var db = CreateDb();
        var create = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        var created = await create.Handle(new CreateParameterCommand(
            tenantId, "fixed", "val", ParameterType.String, null, null, ParameterScope.Tenant, true), default);

        var handler = new UpdateParameterHandler(db);
        var act = () => handler.Handle(new UpdateParameterCommand(tenantId, created.Id, "new", null), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Update_NotFound_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var handler = new UpdateParameterHandler(db);

        var act = () => handler.Handle(new UpdateParameterCommand(Guid.NewGuid(), Guid.NewGuid(), "x", null), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetAll_ByGroup_FiltersCorrectly()
    {
        await using var db = CreateDb();
        var create = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        await create.Handle(new CreateParameterCommand(tenantId, "a", "1", ParameterType.String, "g1", null, ParameterScope.Tenant), default);
        await create.Handle(new CreateParameterCommand(tenantId, "b", "2", ParameterType.String, "g2", null, ParameterScope.Tenant), default);
        await create.Handle(new CreateParameterCommand(tenantId, "c", "3", ParameterType.String, "g1", null, ParameterScope.Tenant), default);

        var cache = new CachedParameterService(new MemoryCache(new MemoryCacheOptions()));
        var handler = new GetParametersHandler(db, cache);
        var result = await handler.Handle(new GetParametersQuery(tenantId, "g1"), default);

        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(i => i.Group == "g1");
    }

    [Fact]
    public async Task GetAll_CacheHit_ReturnsWithoutQueryingDb()
    {
        await using var db = CreateDb();
        var create = new CreateParameterHandler(db);
        var tenantId = Guid.NewGuid();

        await create.Handle(new CreateParameterCommand(tenantId, "key1", "v1", ParameterType.String, null, null, ParameterScope.Tenant), default);

        var cache = new CachedParameterService(new MemoryCache(new MemoryCacheOptions()));
        var handler = new GetParametersHandler(db, cache);

        // First call populates cache
        var r1 = await handler.Handle(new GetParametersQuery(tenantId), default);
        r1.Items.Should().ContainSingle();

        // Add another parameter directly to DB (bypassing cache invalidation)
        db.Parameters.Add(new SystemParameter { TenantId = tenantId, Key = "key2", Value = "v2", Type = ParameterType.String });
        await db.SaveChangesAsync();

        // Second call should hit cache and NOT see key2
        var r2 = await handler.Handle(new GetParametersQuery(tenantId), default);
        r2.Items.Should().ContainSingle();
        r2.Items[0].Key.Should().Be("key1");
    }

    [Fact]
    public async Task Create_InvalidatesCache()
    {
        await using var db = CreateDb();
        var cache = new CachedParameterService(new MemoryCache(new MemoryCacheOptions()));
        var tenantId = Guid.NewGuid();

        var create = new CreateParameterHandler(db, cache);
        var get = new GetParametersHandler(db, cache);

        await create.Handle(new CreateParameterCommand(tenantId, "k1", "v1", ParameterType.String, null, null, ParameterScope.Tenant), default);
        var r1 = await get.Handle(new GetParametersQuery(tenantId), default);
        r1.Items.Should().ContainSingle();

        await create.Handle(new CreateParameterCommand(tenantId, "k2", "v2", ParameterType.String, null, null, ParameterScope.Tenant), default);
        var r2 = await get.Handle(new GetParametersQuery(tenantId), default);
        r2.Items.Should().HaveCount(2);
    }

    private static ParametersDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ParametersDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ParametersDbContext(options);
    }
}
