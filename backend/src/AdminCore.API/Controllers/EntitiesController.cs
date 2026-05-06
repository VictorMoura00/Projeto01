using AdminCore.Modules.Entities.Application.Commands;
using AdminCore.Modules.Entities.Application.Queries;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Route("admin/entities")]
public class EntitiesController(IMessageBus bus) : ControllerBase
{
    private static readonly Guid DevTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null) =>
        bus.InvokeAsync<object>(new GetEntityDefinitionsQuery(DevTenantId, page, pageSize, search));

    [HttpGet("{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetEntityDefinitionByIdQuery(DevTenantId, id));

    [HttpPost]
    public Task<object> Create([FromBody] CreateEntityDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateEntityDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, EntityId = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteEntityDefinitionCommand(DevTenantId, id));
        return NoContent();
    }

    [HttpGet("{id:guid}/fields")]
    public async Task<object> GetFields(Guid id)
    {
        var entity = await bus.InvokeAsync<object>(new GetEntityDefinitionByIdQuery(DevTenantId, id));
        return entity;
    }

    [HttpPost("{id:guid}/fields")]
    public Task<object> CreateField(Guid id, [FromBody] CreateFieldDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, EntityDefinitionId = id });

    [HttpPut("{id:guid}/fields/{fieldId:guid}")]
    public Task<object> UpdateField(Guid id, Guid fieldId, [FromBody] UpdateFieldDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, EntityDefinitionId = id, FieldId = fieldId });

    [HttpDelete("{id:guid}/fields/{fieldId:guid}")]
    public async Task<IActionResult> DeleteField(Guid id, Guid fieldId)
    {
        await bus.InvokeAsync(new DeleteFieldDefinitionCommand(DevTenantId, id, fieldId));
        return NoContent();
    }

    [HttpPut("{id:guid}/fields/reorder")]
    public async Task<IActionResult> ReorderFields(Guid id, [FromBody] IReadOnlyList<Guid> orderedFieldIds)
    {
        await bus.InvokeAsync(new ReorderFieldsCommand(DevTenantId, id, orderedFieldIds));
        return NoContent();
    }
}
