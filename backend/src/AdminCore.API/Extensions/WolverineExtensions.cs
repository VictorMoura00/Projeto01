using AdminCore.Modules.Access;
using AdminCore.Modules.Auth;
using AdminCore.Modules.Entities;
using AdminCore.Modules.Parameters;
using AdminCore.Modules.Tenants;
using Wolverine;

namespace AdminCore.API.Extensions;

public static class WolverineExtensions
{
    public static IHostBuilder AddWolverineModules(this IHostBuilder host)
    {
        host.UseWolverine(opts =>
        {
            opts.Discovery.IncludeAssembly(typeof(AuthModule).Assembly);
            opts.Discovery.IncludeAssembly(typeof(TenantsModule).Assembly);
            opts.Discovery.IncludeAssembly(typeof(EntitiesModule).Assembly);
            opts.Discovery.IncludeAssembly(typeof(AccessModule).Assembly);
            opts.Discovery.IncludeAssembly(typeof(ParametersModule).Assembly);
        });

        return host;
    }
}
