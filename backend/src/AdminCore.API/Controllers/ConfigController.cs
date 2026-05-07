using AdminCore.API.Infrastructure;
using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.Queries;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("config/{tenantSlug}")]
public class ConfigController(
    IMessageBus bus,
    CurrentTenant currentTenant,
    TenantsDbContext tenantsDb,
    EntitiesDbContext entitiesDb) : ControllerBase
{
    private async Task<Guid> ResolveTenantAsync(string tenantSlug, CancellationToken ct)
    {
        var tenant = await tenantsDb.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && t.IsActive, ct);

        if (tenant == null)
            throw new NotFoundException("Tenant", tenantSlug);

        currentTenant.Set(tenant.Id, tenant.Slug);
        return tenant.Id;
    }

    private async Task<Guid> ResolveEntityAsync(Guid tenantId, string entitySlug, CancellationToken ct)
    {
        var entity = await entitiesDb.EntityDefinitions
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Slug == entitySlug && e.IsActive, ct);

        if (entity == null)
            throw new NotFoundException("EntityDefinition", entitySlug);

        return entity.Id;
    }

    [HttpGet("entities")]
    public async Task<object> GetEntities(string tenantSlug, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        return await bus.InvokeAsync<object>(new GetActiveEntityDefinitionsQuery(tenantId, page, pageSize), ct);
    }

    [HttpGet("entities/{entitySlug}")]
    public async Task<object> GetEntityDefinition(string tenantSlug, string entitySlug, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        return await bus.InvokeAsync<object>(new GetEntityDefinitionBySlugQuery(tenantId, entitySlug), ct);
    }

    [HttpGet("entities/{entitySlug}/data")]
    public async Task<object> GetEntityDataList(string tenantSlug, string entitySlug, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        var entityId = await ResolveEntityAsync(tenantId, entitySlug, ct);
        return await bus.InvokeAsync<object>(new GetEntityDataListQuery(tenantId, entityId, page, pageSize), ct);
    }

    [HttpGet("entities/{entitySlug}/data/{id:guid}")]
    public async Task<object> GetEntityDataById(string tenantSlug, string entitySlug, Guid id, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        await ResolveEntityAsync(tenantId, entitySlug, ct);
        return await bus.InvokeAsync<object>(new GetEntityDataQuery(tenantId, id), ct);
    }

    [HttpPost("entities/{entitySlug}/data")]
    public async Task<object> CreateEntityData(string tenantSlug, string entitySlug, [FromBody] CreateEntityDataRequest request, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        var entityId = await ResolveEntityAsync(tenantId, entitySlug, ct);
        return await bus.InvokeAsync<object>(new CreateEntityDataCommand(tenantId, entityId, request.Payload), ct);
    }

    [HttpPut("entities/{entitySlug}/data/{id:guid}")]
    public async Task<object> UpdateEntityData(string tenantSlug, string entitySlug, Guid id, [FromBody] UpdateEntityDataRequest request, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        await ResolveEntityAsync(tenantId, entitySlug, ct);
        return await bus.InvokeAsync<object>(new UpdateEntityDataCommand(tenantId, id, request.Payload), ct);
    }

    [HttpDelete("entities/{entitySlug}/data/{id:guid}")]
    public async Task<IActionResult> DeleteEntityData(string tenantSlug, string entitySlug, Guid id, CancellationToken ct = default)
    {
        var tenantId = await ResolveTenantAsync(tenantSlug, ct);
        await ResolveEntityAsync(tenantId, entitySlug, ct);
        await bus.InvokeAsync(new DeleteEntityDataCommand(tenantId, id), ct);
        return NoContent();
    }
}

public record CreateEntityDataRequest(string Payload);
public record UpdateEntityDataRequest(string Payload);
