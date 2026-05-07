using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.Access;

public class AccessModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AccessDbContext>(options =>
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
