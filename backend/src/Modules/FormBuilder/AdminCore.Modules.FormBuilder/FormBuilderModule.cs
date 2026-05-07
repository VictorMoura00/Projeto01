using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.FormBuilder;

public class FormBuilderModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<FormBuilderDbContext>(options =>
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
