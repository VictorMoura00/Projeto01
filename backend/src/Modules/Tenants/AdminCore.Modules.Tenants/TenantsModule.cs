using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.Tenants;

public class TenantsModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TenantsDbContext>(options =>
        {
            var provider = configuration["Database:Provider"] ?? "postgres";
            var conn = configuration.GetConnectionString("DefaultConnection");
            if (provider == "sqlite")
                options.UseSqlite(conn);
            else
                options.UseNpgsql(conn);
        });

        return services;
    }
}
