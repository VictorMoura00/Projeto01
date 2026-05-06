using AdminCore.Modules.Tenants.Application.Commands;
using AdminCore.Modules.Tenants.Application.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
public class TenantsController(IMessageBus bus) : ControllerBase
{
    [Authorize]
    [HttpGet("admin/tenants")]
    public Task<object> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        bus.InvokeAsync<object>(new GetTenantsQuery(page, pageSize));

    [Authorize]
    [HttpGet("admin/tenants/{id:guid}")]
    public Task<object> GetById(Guid id) =>
        bus.InvokeAsync<object>(new GetTenantByIdQuery(id));

    [Authorize]
    [HttpPost("admin/tenants")]
    public Task<object> Create([FromBody] CreateTenantCommand cmd) =>
        bus.InvokeAsync<object>(cmd);

    [Authorize]
    [HttpPut("admin/tenants/{id:guid}")]
    public Task<object> Update(Guid id, [FromBody] UpdateTenantCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { Id = id });

    [Authorize]
    [HttpPut("admin/tenants/{id:guid}/theme")]
    public Task<object> UpdateTheme(Guid id, [FromBody] UpdateTenantThemeCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = id });

    [AllowAnonymous]
    [HttpGet("tenants/{slug}/config")]
    public Task<object> GetConfig(string slug) =>
        bus.InvokeAsync<object>(new GetTenantConfigQuery(slug));
}
