using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AdminCore.Modules.Parameters;

public class ParametersModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ParametersDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddMemoryCache();
        services.AddScoped<ICachedParameterService, CachedParameterService>();

        return services;
    }
}
