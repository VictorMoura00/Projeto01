using AdminCore.Modules.Auth.Application.DTOs;
using AdminCore.Modules.Auth.Domain;

namespace AdminCore.Modules.Auth.Infrastructure.Security;

public interface IJwtTokenService
{
    int AccessTokenSeconds { get; }
    int RefreshTokenDays { get; }
    string CreateAccessToken(AppUser user, IReadOnlyList<string> roles);
    RefreshToken CreateRefreshToken(AppUser user);
    UserSessionDto CreateSession(AppUser user, IReadOnlyList<string> roles);
}
