using System.Security.Claims;
using AdminCore.API.Infrastructure;

namespace AdminCore.API.Middleware;

public class CurrentTenantMiddleware(RequestDelegate next, IWebHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context, CurrentTenant currentTenant)
    {
        var tenantClaim = context.User.FindFirstValue("tenant_id");
        if (Guid.TryParse(tenantClaim, out var tenantId))
        {
            currentTenant.Set(tenantId);
        }
        else if (environment.IsDevelopment() &&
                 Guid.TryParse(context.Request.Headers["X-Tenant-Id"].FirstOrDefault(), out var headerTenantId))
        {
            currentTenant.Set(headerTenantId);
        }

        await next(context);
    }
}
