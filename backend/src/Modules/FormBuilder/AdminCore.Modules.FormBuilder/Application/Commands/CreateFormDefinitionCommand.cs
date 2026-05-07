using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Domain;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public class FormFieldInput
{
    public string Label { get; init; } = null!;
    public string Key { get; init; } = null!;
    public FormFieldType Type { get; init; }
    public bool IsRequired { get; init; }
    public string? Placeholder { get; init; }
    public int DisplayOrder { get; init; }
    public string? OptionsJson { get; init; }
    public string? ValidationJson { get; init; }
    public string? LayoutJson { get; init; }
}

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
