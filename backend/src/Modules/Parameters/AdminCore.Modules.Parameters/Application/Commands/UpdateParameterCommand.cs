using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Commands;

public record UpdateParameterCommand(
    Guid? TenantId,
    Guid Id,
    string Value,
    string? Description
);

public class UpdateParameterHandler(ParametersDbContext db)
{
    public async Task<SystemParameterDto> Handle(UpdateParameterCommand cmd, CancellationToken ct)
    {
        var param = await db.Parameters
            .FirstOrDefaultAsync(p => p.Id == cmd.Id && p.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("Parameter", cmd.Id);

        if (param.IsReadOnly)
            throw new ForbiddenException("This parameter is read-only.");

        param.Value = cmd.Value;
        param.Description = cmd.Description;

        await db.SaveChangesAsync(ct);
        return CreateParameterHandler.ToDto(param);
    }
}
