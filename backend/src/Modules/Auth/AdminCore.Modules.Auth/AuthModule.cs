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
        {
            var provider = configuration["Database:Provider"] ?? "postgres";
            var conn = configuration.GetConnectionString("DefaultConnection");
            if (provider == "sqlite")
                options.UseSqlite(conn);
            else
                options.UseNpgsql(conn);
        });

        services.AddIdentityCore<AppUser>()
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AuthDbContext>();

        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
