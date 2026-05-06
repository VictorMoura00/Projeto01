using AdminCore.Modules.Parameters.Application.DTOs;

namespace AdminCore.Modules.Parameters.Infrastructure.Services;

public interface ICachedParameterService
{
    Task<SystemParameterDto?> GetByKeyAsync(Guid? tenantId, string key, Func<Task<SystemParameterDto?>> factory);
    Task<IReadOnlyList<SystemParameterDto>> GetAllAsync(Guid? tenantId, string? group, Func<Task<IReadOnlyList<SystemParameterDto>>> factory);
    void Invalidate(Guid? tenantId, string? key = null);
}
