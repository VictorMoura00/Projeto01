using AdminCore.Modules.Access.Application.Commands;
using AdminCore.Modules.Access.Application.Queries;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Route("admin/roles")]
public class AccessController(IMessageBus bus) : ControllerBase
{
    private static readonly Guid DevTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        bus.InvokeAsync<object>(new GetRolesQuery(DevTenantId, page, pageSize));

    [HttpGet("{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetRoleByIdQuery(DevTenantId, id));

    [HttpPost]
    public Task<object> Create([FromBody] CreateRoleCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateRoleCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, RoleId = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteRoleCommand(DevTenantId, id));
        return NoContent();
    }

    [HttpPut("{id:guid}/permissions")]
    public Task<object> SetPermissions(Guid id, [FromBody] SetRolePermissionsCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId, RoleId = id });
}
