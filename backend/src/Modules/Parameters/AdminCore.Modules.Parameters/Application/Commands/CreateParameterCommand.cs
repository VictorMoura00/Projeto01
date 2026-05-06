using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Domain;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Commands;

public record CreateParameterCommand(
    Guid? TenantId,
    string Key,
    string Value,
    ParameterType Type,
    string? Group,
    string? Description,
    ParameterScope Scope,
    bool IsReadOnly = false
);

public class CreateParameterHandler(ParametersDbContext db, ICachedParameterService? cache = null)
{
    public async Task<SystemParameterDto> Handle(CreateParameterCommand cmd, CancellationToken ct)
    {
        var exists = await db.Parameters
            .AnyAsync(p => p.Key == cmd.Key && p.TenantId == cmd.TenantId, ct);

        if (exists)
            throw new ConflictException($"Parameter with key '{cmd.Key}' already exists.");

        var param = new SystemParameter
        {
            Key = cmd.Key,
            Value = cmd.Value,
            Type = cmd.Type,
            Group = cmd.Group,
            Description = cmd.Description,
            Scope = cmd.Scope,
            TenantId = cmd.TenantId,
            IsReadOnly = cmd.IsReadOnly
        };

        db.Parameters.Add(param);
        await db.SaveChangesAsync(ct);
        cache?.Invalidate(cmd.TenantId, cmd.Key);

        return ToDto(param);
    }

    internal static SystemParameterDto ToDto(SystemParameter p) =>
        new(p.Id, p.Key, p.Value, p.Type, p.Group, p.Description, p.Scope, p.IsReadOnly, p.CreatedAt);
}
