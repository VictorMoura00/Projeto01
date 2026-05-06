using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Domain;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record FormFieldInput(
    string Label,
    string Key,
    FormFieldType Type,
    bool IsRequired,
    string? Placeholder,
    int DisplayOrder,
    string? OptionsJson,
    string? ValidationJson,
    string? LayoutJson
);

public record CreateFormDefinitionCommand(
    Guid TenantId,
    string Name,
    string Slug,
    string? Description,
    IReadOnlyList<FormFieldInput> Fields
);

public class CreateFormDefinitionHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(CreateFormDefinitionCommand cmd, CancellationToken ct)
    {
        var exists = await db.FormDefinitions.AnyAsync(f => f.TenantId == cmd.TenantId && f.Slug == cmd.Slug, ct);
        if (exists)
            throw new ConflictException($"Form with slug '{cmd.Slug}' already exists.");

        var form = new FormDefinition
        {
            TenantId = cmd.TenantId,
            Name = cmd.Name,
            Slug = cmd.Slug,
            Description = cmd.Description,
            Fields = cmd.Fields.Select(field => new FormField
            {
                TenantId = cmd.TenantId,
                Label = field.Label,
                Key = field.Key,
                Type = field.Type,
                IsRequired = field.IsRequired,
                Placeholder = field.Placeholder,
                DisplayOrder = field.DisplayOrder,
                OptionsJson = field.OptionsJson,
                ValidationJson = field.ValidationJson,
                LayoutJson = field.LayoutJson
            }).ToList()
        };

        db.FormDefinitions.Add(form);
        await db.SaveChangesAsync(ct);
        return FormMapping.ToDto(form);
    }
}
