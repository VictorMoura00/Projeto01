using AdminCore.Modules.Auth.Application.Commands;
using AdminCore.Modules.Auth.Domain;
using AdminCore.Modules.Auth.Infrastructure.Persistence;
using AdminCore.Modules.Auth.Infrastructure.Security;
using AdminCore.Shared.Kernel.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.Auth.Tests;

public class AuthHandlerTests
{
    [Fact]
    public async Task Register_CreatesActiveUserLinkedToTenant()
    {
        await using var fixture = AuthFixture.Create();
        var handler = new RegisterCommandHandler(fixture.UserManager, fixture.RoleManager);
        var tenantId = Guid.NewGuid();

        var result = await handler.Handle(new RegisterCommand(
            tenantId, "admin@admincore.local", "Admin", "Core", "Admin123!"), default);

        result.Email.Should().Be("admin@admincore.local");
        result.TenantId.Should().Be(tenantId);

        var user = await fixture.Db.Users.SingleAsync();
        user.PasswordHash.Should().NotBeNullOrWhiteSpace();
        user.PasswordHash.Should().NotBe("Admin123!");
    }

    [Fact]
    public async Task Register_DuplicateEmailInTenant_ThrowsConflict()
    {
        await using var fixture = AuthFixture.Create();
        var handler = new RegisterCommandHandler(fixture.UserManager, fixture.RoleManager);
        var tenantId = Guid.NewGuid();

        await handler.Handle(new RegisterCommand(tenantId, "admin@admincore.local", "Admin", "Core", "Admin123!"), default);

        var act = () => handler.Handle(new RegisterCommand(tenantId, "admin@admincore.local", "Other", "User", "Admin123!"), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsJwtAndRefreshToken()
    {
        await using var fixture = AuthFixture.Create();
        var register = new RegisterCommandHandler(fixture.UserManager, fixture.RoleManager);
        var login = new LoginCommandHandler(fixture.UserManager, fixture.Db, fixture.TokenService);

        await register.Handle(new RegisterCommand(Guid.NewGuid(), "admin@admincore.local", "Admin", "Core", "Admin123!"), default);

        var result = await login.Handle(new LoginCommand("admin@admincore.local", "Admin123!"), default);

        result.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.ExpiresIn.Should().BePositive();
        (await fixture.Db.RefreshTokens.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ThrowsForbidden()
    {
        await using var fixture = AuthFixture.Create();
        var login = new LoginCommandHandler(fixture.UserManager, fixture.Db, fixture.TokenService);

        var act = () => login.Handle(new LoginCommand("missing@admincore.local", "bad"), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Refresh_ValidToken_RotatesRefreshToken()
    {
        await using var fixture = AuthFixture.Create();
        var register = new RegisterCommandHandler(fixture.UserManager, fixture.RoleManager);
        var login = new LoginCommandHandler(fixture.UserManager, fixture.Db, fixture.TokenService);
        var refresh = new RefreshTokenCommandHandler(fixture.Db, fixture.UserManager, fixture.TokenService);

        await register.Handle(new RegisterCommand(Guid.NewGuid(), "admin@admincore.local", "Admin", "Core", "Admin123!"), default);
        var loginResult = await login.Handle(new LoginCommand("admin@admincore.local", "Admin123!"), default);

        var refreshResult = await refresh.Handle(new RefreshTokenCommand(loginResult.RefreshToken), default);

        refreshResult.RefreshToken.Should().NotBe(loginResult.RefreshToken);
        var oldToken = await fixture.Db.RefreshTokens.SingleAsync(t => t.Token == loginResult.RefreshToken);
        oldToken.IsRevoked.Should().BeTrue();
        oldToken.ReplacedByToken.Should().Be(refreshResult.RefreshToken);
    }

    private sealed class AuthFixture : IAsyncDisposable
    {
        private readonly ServiceProvider provider;

        private AuthFixture(ServiceProvider provider)
        {
            this.provider = provider;
            Db = provider.GetRequiredService<AuthDbContext>();
            UserManager = provider.GetRequiredService<UserManager<AppUser>>();
            RoleManager = provider.GetRequiredService<RoleManager<AppRole>>();
            TokenService = provider.GetRequiredService<IJwtTokenService>();
        }

        public AuthDbContext Db { get; }
        public UserManager<AppUser> UserManager { get; }
        public RoleManager<AppRole> RoleManager { get; }
        public IJwtTokenService TokenService { get; }

        public static AuthFixture Create()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDbContext<AuthDbContext>(options => options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
            services.AddIdentityCore<AppUser>()
                .AddRoles<AppRole>()
                .AddEntityFrameworkStores<AuthDbContext>();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Issuer"] = "AdminCore.Tests",
                    ["Jwt:Audience"] = "AdminCore.Tests",
                    ["Jwt:Secret"] = "test-secret-key-with-at-least-32-bytes",
                    ["Jwt:AccessTokenMinutes"] = "15",
                    ["Jwt:RefreshTokenDays"] = "7"
                })
                .Build());
            services.AddScoped<IJwtTokenService, JwtTokenService>();

            return new AuthFixture(services.BuildServiceProvider());
        }

        public async ValueTask DisposeAsync() => await provider.DisposeAsync();
    }
}
