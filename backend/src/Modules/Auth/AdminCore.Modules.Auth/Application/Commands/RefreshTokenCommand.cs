using AdminCore.Modules.Auth.Application.DTOs;
using AdminCore.Modules.Auth.Infrastructure.Persistence;
using AdminCore.Modules.Auth.Infrastructure.Security;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AdminCore.Modules.Auth.Domain;

namespace AdminCore.Modules.Auth.Application.Commands;

public record RefreshTokenCommand(string RefreshToken);

public class RefreshTokenCommandHandler(AuthDbContext db, UserManager<AppUser> userManager, IJwtTokenService tokenService)
{
    public async Task<AuthResultDto> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var storedToken = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == cmd.RefreshToken, ct)
            ?? throw new ForbiddenException("Invalid refresh token.");

        if (storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow || !storedToken.User.IsActive)
            throw new ForbiddenException("Invalid refresh token.");

        var user = storedToken.User;
        var roles = (await userManager.GetRolesAsync(user)).ToList();
        var newRefreshToken = tokenService.CreateRefreshToken(user);

        storedToken.IsRevoked = true;
        storedToken.ReplacedByToken = newRefreshToken.Token;
        db.RefreshTokens.Add(newRefreshToken);
        await db.SaveChangesAsync(ct);

        return new AuthResultDto(
            tokenService.CreateAccessToken(user, roles),
            newRefreshToken.Token,
            tokenService.AccessTokenSeconds,
            tokenService.CreateSession(user, roles));
    }
}
