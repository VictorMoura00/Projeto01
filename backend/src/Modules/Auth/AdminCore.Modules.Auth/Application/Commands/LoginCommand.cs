using AdminCore.Modules.Auth.Application.DTOs;
using AdminCore.Modules.Auth.Domain;
using AdminCore.Modules.Auth.Infrastructure.Persistence;
using AdminCore.Modules.Auth.Infrastructure.Security;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Auth.Application.Commands;

public record LoginCommand(string Email, string Password);

public class LoginCommandHandler(UserManager<AppUser> userManager, AuthDbContext db, IJwtTokenService tokenService)
{
    public async Task<AuthResultDto> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var normalizedEmail = userManager.NormalizeEmail(cmd.Email);
        var user = await userManager.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);
        if (user is null || !user.IsActive || !await userManager.CheckPasswordAsync(user, cmd.Password))
            throw new ForbiddenException("Invalid email or password.");

        var roles = (await userManager.GetRolesAsync(user)).ToList();
        var refreshToken = tokenService.CreateRefreshToken(user);
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync(ct);

        return new AuthResultDto(
            tokenService.CreateAccessToken(user, roles),
            refreshToken.Token,
            tokenService.AccessTokenSeconds,
            tokenService.CreateSession(user, roles));
    }
}
