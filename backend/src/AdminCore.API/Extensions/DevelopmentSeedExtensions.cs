using AdminCore.Modules.Auth.Domain;
using AdminCore.Modules.Auth.Infrastructure.Persistence;
using AdminCore.Modules.Tenants.Domain;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.API.Extensions;

public static class DevelopmentSeedExtensions
{
    public static IApplicationBuilder UseDevelopmentSeed(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();

        if (!env.IsDevelopment())
            return app;

        var tenantsDb = scope.ServiceProvider.GetRequiredService<TenantsDbContext>();
        var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

        var tenantId = SeedTenantAsync(tenantsDb).GetAwaiter().GetResult();
        SeedAdminAsync(authDb, userManager, roleManager, tenantId).GetAwaiter().GetResult();

        return app;
    }

    private static async Task<Guid> SeedTenantAsync(TenantsDbContext db)
    {
        var existing = await db.Tenants.FirstOrDefaultAsync();
        if (existing is not null)
            return existing.Id;

        var tenant = new Tenant
        {
            Name = "AdminCore",
            Slug = "admin",
            IsActive = true,
            Theme = new TenantTheme
            {
                PrimaryColor = "#1976D2",
                SecondaryColor = "#424242",
                AccentColor = "#82B1FF",
                SurfaceColor = "#FFFFFF",
                FontFamily = "Inter, sans-serif"
            }
        };

        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();
        return tenant.Id;
    }

    private static async Task SeedAdminAsync(AuthDbContext db, UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, Guid tenantId)
    {
        if (await userManager.Users.AnyAsync())
            return;

        const string adminEmail = "admin@admincore.local";
        const string adminPassword = "Admin123!";
        const string adminRole = "Admin";

        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            var roleResult = await roleManager.CreateAsync(new AppRole
            {
                TenantId = tenantId,
                Name = adminRole,
                IsSystemRole = true
            });

            if (!roleResult.Succeeded)
                throw new InvalidOperationException($"Failed to seed admin role: {string.Join(" ", roleResult.Errors.Select(e => e.Description))}");
        }

        var user = new AppUser
        {
            TenantId = tenantId,
            Email = adminEmail,
            UserName = adminEmail,
            FirstName = "Admin",
            LastName = "Core",
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, adminPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException($"Failed to seed admin user: {string.Join(" ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(user, adminRole);
    }
}
