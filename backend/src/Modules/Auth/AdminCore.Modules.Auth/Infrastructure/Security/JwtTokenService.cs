using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AdminCore.Modules.Auth.Application.DTOs;
using AdminCore.Modules.Auth.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AdminCore.Modules.Auth.Infrastructure.Security;

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    public int AccessTokenSeconds => AccessTokenMinutes * 60;
    public int RefreshTokenDays => int.TryParse(configuration["Jwt:RefreshTokenDays"], out var days)
        ? days
        : int.TryParse(configuration["Jwt:RefreshTokenExpirationDays"], out var legacyDays) ? legacyDays : 7;

    private int AccessTokenMinutes => int.TryParse(configuration["Jwt:AccessTokenMinutes"], out var minutes)
        ? minutes
        : int.TryParse(configuration["Jwt:AccessTokenExpirationMinutes"], out var legacyMinutes) ? legacyMinutes : 15;

    public string CreateAccessToken(AppUser user, IReadOnlyList<string> roles)
    {
        var secret = configuration["Jwt:Secret"] ?? configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Secret or Jwt:Key is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("user_id", user.Id.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("name", $"{user.FirstName} {user.LastName}".Trim())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(AccessTokenMinutes),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public RefreshToken CreateRefreshToken(AppUser user)
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return new RefreshToken
        {
            UserId = user.Id,
            User = user,
            Token = Convert.ToBase64String(bytes),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays)
        };
    }

    public UserSessionDto CreateSession(AppUser user, IReadOnlyList<string> roles) =>
        new(user.Id, user.TenantId, user.Email ?? string.Empty, $"{user.FirstName} {user.LastName}".Trim(), roles);
}
