using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.Queries;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Route("admin/parameters")]
public class ParametersController(IMessageBus bus) : ControllerBase
{
    private static readonly Guid? DevTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public Task<object> GetAll([FromQuery] string? group = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        bus.InvokeAsync<object>(new GetParametersQuery(DevTenantId, group, page, pageSize));

    [HttpGet("{key}")]
    public Task<object> GetByKey(string key) =>
        bus.InvokeAsync<object>(new GetParameterByKeyQuery(DevTenantId, key));

    [HttpPost]
    public Task<object> Create([FromBody] CreateParameterCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateParameterCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, Id = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteParameterCommand(DevTenantId, id));
        return NoContent();
    }
}
