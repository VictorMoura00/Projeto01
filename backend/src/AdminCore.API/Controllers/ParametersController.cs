using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.Queries;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Authorize]
[Route("admin/parameters")]
public class ParametersController(IMessageBus bus, ICurrentTenant currentTenant) : ControllerBase
{
    private Guid TenantId => currentTenant.Id ?? throw new UnauthorizedAccessException("Tenant was not resolved.");

    [HttpGet]
    public Task<object> GetAll([FromQuery] string? group = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        bus.InvokeAsync<object>(new GetParametersQuery(TenantId, group, page, pageSize));

    [HttpGet("{key}")]
    public Task<object> GetByKey(string key) =>
        bus.InvokeAsync<object>(new GetParameterByKeyQuery(TenantId, key));

    [HttpPost]
    public Task<object> Create([FromBody] CreateParameterCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateParameterCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, Id = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteParameterCommand(TenantId, id));
        return NoContent();
    }
}
