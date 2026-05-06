using AdminCore.Modules.Parameters.Application.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace AdminCore.Modules.Parameters.Infrastructure.Services;

public class CachedParameterService(IMemoryCache cache) : ICachedParameterService
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public async Task<SystemParameterDto?> GetByKeyAsync(Guid? tenantId, string key, Func<Task<SystemParameterDto?>> factory)
    {
        var cacheKey = Key(tenantId, key);
        if (cache.TryGetValue(cacheKey, out SystemParameterDto? value))
            return value;

        value = await factory();
        if (value is not null)
            cache.Set(cacheKey, value, Ttl);

        return value;
    }

    public async Task<IReadOnlyList<SystemParameterDto>> GetAllAsync(Guid? tenantId, string? group, Func<Task<IReadOnlyList<SystemParameterDto>>> factory)
    {
        if (!string.IsNullOrWhiteSpace(group))
            return await factory();

        var cacheKey = AllKey(tenantId, group);
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<SystemParameterDto>? value) && value is not null)
            return value;

        value = await factory();
        cache.Set(cacheKey, value, Ttl);
        return value;
    }

    public void Invalidate(Guid? tenantId, string? key = null)
    {
        if (!string.IsNullOrWhiteSpace(key))
            cache.Remove(Key(tenantId, key));

        cache.Remove(AllKey(tenantId, null));
    }

    private static string Key(Guid? tenantId, string key) => $"param:{tenantId?.ToString() ?? "global"}:{key}";
    private static string AllKey(Guid? tenantId, string? group) => $"params:{tenantId?.ToString() ?? "global"}:{group ?? "all"}";
}
