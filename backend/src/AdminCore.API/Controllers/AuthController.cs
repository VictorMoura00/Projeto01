using AdminCore.Modules.Auth.Application.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace AdminCore.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(IMessageBus bus) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public Task<object> Login([FromBody] LoginCommand command) =>
        bus.InvokeAsync<object>(command);

    [AllowAnonymous]
    [HttpPost("refresh")]
    public Task<object> Refresh([FromBody] RefreshTokenCommand command) =>
        bus.InvokeAsync<object>(command);

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public Task<object> Register([FromBody] RegisterCommand command) =>
        bus.InvokeAsync<object>(command);
}
