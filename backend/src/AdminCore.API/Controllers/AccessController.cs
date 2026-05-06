using AdminCore.Modules.Access.Application.Commands;
using AdminCore.Modules.Access.Application.Queries;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Authorize]
[Route("admin/roles")]
public class AccessController(IMessageBus bus, ICurrentTenant currentTenant) : ControllerBase
{
    private Guid TenantId => currentTenant.Id ?? throw new UnauthorizedAccessException("Tenant was not resolved.");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        bus.InvokeAsync<object>(new GetRolesQuery(TenantId, page, pageSize));

    [HttpGet("{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetRoleByIdQuery(TenantId, id));

    [HttpPost]
    public Task<object> Create([FromBody] CreateRoleCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId });

    [HttpPut("{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateRoleCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, RoleId = id });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteRoleCommand(TenantId, id));
        return NoContent();
    }

    [HttpPut("{id:guid}/permissions")]
    public Task<object> SetPermissions(Guid id, [FromBody] SetRolePermissionsCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = TenantId, RoleId = id });
}
