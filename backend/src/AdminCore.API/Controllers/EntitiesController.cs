using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.Queries;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Authorize]
[Route("admin/entities")]
public class EntitiesController(IMessageBus bus, ICurrentTenant currentTenant) : ControllerBase
{
    private Guid TenantId => currentTenant.Id ?? throw new UnauthorizedAccessException("Tenant was not resolved.");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null) =>
        bus.InvokeAsync<object>(new GetEntityDefinitionsQuery(TenantId, page, pageSize, search));

    [HttpGet("{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetEntityDefinitionByIdQuery(TenantId, id));

    [HttpPost]
    public Task<object> Create([FromBody] CreateEntityDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateEntityDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, EntityId = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteEntityDefinitionCommand(TenantId, id));
        return NoContent();
    }

    [HttpGet("{id:guid}/fields")]
    public async Task<object> GetFields(Guid id)
    {
        var entity = await bus.InvokeAsync<object>(new GetEntityDefinitionByIdQuery(TenantId, id));
        return entity;
    }

    [HttpPost("{id:guid}/fields")]
    public Task<object> CreateField(Guid id, [FromBody] CreateFieldDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, EntityDefinitionId = id });

    [HttpPut("{id:guid}/fields/{fieldId:guid}")]
    public Task<object> UpdateField(Guid id, Guid fieldId, [FromBody] UpdateFieldDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, EntityDefinitionId = id, FieldId = fieldId });

    [HttpDelete("{id:guid}/fields/{fieldId:guid}")]
    public async Task<IActionResult> DeleteField(Guid id, Guid fieldId)
    {
        await bus.InvokeAsync(new DeleteFieldDefinitionCommand(TenantId, id, fieldId));
        return NoContent();
    }

    [HttpPut("{id:guid}/fields/reorder")]
    public async Task<IActionResult> ReorderFields(Guid id, [FromBody] IReadOnlyList<Guid> orderedFieldIds)
    {
        await bus.InvokeAsync(new ReorderFieldsCommand(TenantId, id, orderedFieldIds));
        return NoContent();
    }
}
