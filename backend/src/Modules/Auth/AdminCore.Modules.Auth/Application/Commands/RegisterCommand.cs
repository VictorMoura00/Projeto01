using AdminCore.Modules.Auth.Application.DTOs;
using AdminCore.Modules.Auth.Domain;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Auth.Application.Commands;

public record RegisterCommand(
    Guid TenantId,
    string Email,
    string FirstName,
    string LastName,
    string Password,
    IReadOnlyList<string>? Roles = null
);

public class RegisterCommandHandler(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
{
    public async Task<RegisteredUserDto> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var normalizedEmail = userManager.NormalizeEmail(cmd.Email);
        var exists = await userManager.Users
            .AnyAsync(u => u.TenantId == cmd.TenantId && u.NormalizedEmail == normalizedEmail, ct);
        if (exists)
            throw new ConflictException($"User with email '{cmd.Email}' already exists.");

        var user = new AppUser
        {
            TenantId = cmd.TenantId,
            Email = cmd.Email,
            UserName = cmd.Email,
            FirstName = cmd.FirstName,
            LastName = cmd.LastName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, cmd.Password);
        if (!result.Succeeded)
            throw new DomainException(string.Join(" ", result.Errors.Select(e => e.Description)));

        foreach (var role in cmd.Roles ?? [])
        {
            await EnsureRole(cmd.TenantId, role);
            await userManager.AddToRoleAsync(user, role);
        }

        return new RegisteredUserDto(user.Id, user.TenantId, user.Email ?? string.Empty, $"{user.FirstName} {user.LastName}".Trim());
    }

    private async Task EnsureRole(Guid tenantId, string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName))
            return;

        var result = await roleManager.CreateAsync(new AppRole
        {
            TenantId = tenantId,
            Name = roleName,
            IsSystemRole = true
        });

        if (!result.Succeeded)
            throw new DomainException(string.Join(" ", result.Errors.Select(e => e.Description)));
    }
}
