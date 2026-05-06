using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Domain;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record UpdateFormDefinitionCommand(
    Guid TenantId,
    Guid FormId,
    string Name,
    string? Description,
    bool IsActive,
    IReadOnlyList<FormFieldInput> Fields
);

public class UpdateFormDefinitionHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(UpdateFormDefinitionCommand cmd, CancellationToken ct)
    {
        var form = await db.FormDefinitions
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == cmd.FormId && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("FormDefinition", cmd.FormId);

        form.Name = cmd.Name;
        form.Description = cmd.Description;
        form.IsActive = cmd.IsActive;
        form.UpdatedAt = DateTime.UtcNow;

        db.FormFields.RemoveRange(form.Fields);
        form.Fields = cmd.Fields.Select(field => new FormField
        {
            TenantId = cmd.TenantId,
            FormDefinitionId = form.Id,
            Label = field.Label,
            Key = field.Key,
            Type = field.Type,
            IsRequired = field.IsRequired,
            Placeholder = field.Placeholder,
            DisplayOrder = field.DisplayOrder,
            OptionsJson = field.OptionsJson,
            ValidationJson = field.ValidationJson,
            LayoutJson = field.LayoutJson
        }).ToList();

        await db.SaveChangesAsync(ct);
        return FormMapping.ToDto(form);
    }
}
