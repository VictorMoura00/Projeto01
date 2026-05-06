using AdminCore.Modules.FormBuilder.Application.Commands;
using AdminCore.Modules.FormBuilder.Application.Queries;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Authorize]
[Route("admin/forms")]
public class FormsController(IMessageBus bus, ICurrentTenant currentTenant) : ControllerBase
{
    private Guid TenantId => currentTenant.Id ?? throw new UnauthorizedAccessException("Tenant was not resolved.");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null) =>
        bus.InvokeAsync<object>(new GetFormDefinitionsQuery(TenantId, page, pageSize, search));

    [HttpGet("{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetFormDefinitionByIdQuery(TenantId, id));

    [HttpPost]
    public Task<object> Create([FromBody] CreateFormDefinitionCommand command) =>
        bus.InvokeAsync<object>(command with { TenantId = TenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateFormDefinitionCommand command) =>
        bus.InvokeAsync<object>(command with { TenantId = TenantId, FormId = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteFormDefinitionCommand(TenantId, id));
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public Task<object> Publish(Guid id) =>
        bus.InvokeAsync<object>(new PublishFormDefinitionCommand(TenantId, id));

    [HttpPost("{id:guid}/duplicate")]
    public Task<object> Duplicate(Guid id, [FromBody] DuplicateFormDefinitionCommand command) =>
        bus.InvokeAsync<object>(command with { TenantId = TenantId, FormId = id });
}
