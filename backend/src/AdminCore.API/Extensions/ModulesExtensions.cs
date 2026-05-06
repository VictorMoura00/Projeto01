using AdminCore.Modules.Access;
using AdminCore.Modules.Auth;
using AdminCore.Modules.Entities;
using AdminCore.Modules.Parameters;
using AdminCore.Modules.Tenants;
using AdminCore.Shared.Kernel.Interfaces;

namespace AdminCore.API.Extensions;

public static class ModulesExtensions
{
    public static IServiceCollection AddModules(this IServiceCollection services, IConfiguration configuration)
    {
        IModule[] modules =
        [
            new AuthModule(),
            new TenantsModule(),
            new EntitiesModule(),
            new AccessModule(),
            new ParametersModule(),
        ];

        foreach (var module in modules)
            module.RegisterModule(services, configuration);

        return services;
    }
}
