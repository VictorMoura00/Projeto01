using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Domain;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record ExportFormCommand(Guid TenantId, Guid FormId);

public class ExportFormHandler(FormBuilderDbContext db)
{
    public async Task<FormExportDto> Handle(ExportFormCommand cmd, CancellationToken ct)
    {
        var form = await db.FormDefinitions
            .Include(f => f.Fields.OrderBy(x => x.DisplayOrder))
            .FirstOrDefaultAsync(f => f.Id == cmd.FormId && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(FormDefinition), cmd.FormId);

        return new FormExportDto(form.Name, form.Slug, form.Description, form.IsActive,
            form.Fields.Select(x => new FieldExportDto(x.Label, x.Key, x.Type.ToString(),
                x.IsRequired, x.Placeholder, x.DisplayOrder, x.OptionsJson, x.ValidationJson, x.LayoutJson)).ToList());
    }
}

public record ImportFormCommand(Guid TenantId, FormExportDto Data);

public class ImportFormHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(ImportFormCommand cmd, CancellationToken ct)
    {
        var exists = await db.FormDefinitions
            .AnyAsync(f => f.TenantId == cmd.TenantId && f.Slug == cmd.Data.Slug, ct);
        if (exists) throw new ConflictException($"Form with slug '{cmd.Data.Slug}' already exists.");

        var form = new FormDefinition
        {
            TenantId = cmd.TenantId, Name = cmd.Data.Name, Slug = cmd.Data.Slug,
            Description = cmd.Data.Description, IsActive = cmd.Data.IsActive, IsPublished = false,
            Fields = cmd.Data.Fields.Select((x, i) => new FormField
            {
                TenantId = cmd.TenantId, Label = x.Label, Key = x.Key,
                Type = Enum.TryParse<FormFieldType>(x.FieldType, true, out var ft) ? ft : FormFieldType.Text,
                IsRequired = x.IsRequired, Placeholder = x.Placeholder,
                DisplayOrder = x.DisplayOrder > 0 ? x.DisplayOrder : i + 1,
                OptionsJson = x.OptionsJson, ValidationJson = x.ValidationJson, LayoutJson = x.LayoutJson
            }).ToList()
        };

        db.FormDefinitions.Add(form);
        await db.SaveChangesAsync(ct);
        return FormMapping.ToDto(form);
    }
}

public record FormExportDto(string Name, string Slug, string? Description, bool IsActive, IReadOnlyList<FieldExportDto> Fields);
public record FieldExportDto(string Label, string Key, string FieldType, bool IsRequired, string? Placeholder,
    int DisplayOrder, string? OptionsJson, string? ValidationJson, string? LayoutJson);
