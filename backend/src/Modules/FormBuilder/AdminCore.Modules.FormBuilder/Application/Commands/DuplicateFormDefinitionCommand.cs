using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Domain;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record DuplicateFormDefinitionCommand(Guid TenantId, Guid FormId, string Name, string Slug);

public class DuplicateFormDefinitionHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(DuplicateFormDefinitionCommand cmd, CancellationToken ct)
    {
        var source = await db.FormDefinitions
            .AsNoTracking()
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == cmd.FormId && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("FormDefinition", cmd.FormId);

        var exists = await db.FormDefinitions.AnyAsync(f => f.TenantId == cmd.TenantId && f.Slug == cmd.Slug, ct);
        if (exists)
            throw new ConflictException($"Form with slug '{cmd.Slug}' already exists.");

        var copy = new FormDefinition
        {
            TenantId = cmd.TenantId,
            Name = cmd.Name,
            Slug = cmd.Slug,
            Description = source.Description,
            Fields = source.Fields.Select(field => new FormField
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

        db.FormDefinitions.Add(copy);
        await db.SaveChangesAsync(ct);
        return FormMapping.ToDto(copy);
    }
}
