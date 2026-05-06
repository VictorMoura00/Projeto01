using AdminCore.Modules.Auth.Infrastructure.Persistence;
using AdminCore.Modules.Auth.Infrastructure.Security;
using AdminCore.Modules.Auth.Domain;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.Auth;

public class AuthModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuthDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentityCore<AppUser>()
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AuthDbContext>();

        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
