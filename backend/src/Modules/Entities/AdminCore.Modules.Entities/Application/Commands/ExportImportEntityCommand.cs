using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

// ── Export ──

public record ExportEntityCommand(Guid TenantId, Guid EntityId);

public class ExportEntityHandler(EntitiesDbContext db)
{
    public async Task<EntityExportDto> Handle(ExportEntityCommand cmd, CancellationToken ct)
    {
        var entity = await db.EntityDefinitions
            .Include(e => e.Fields.OrderBy(f => f.DisplayOrder))
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), cmd.EntityId);

        return new EntityExportDto(
            entity.Name, entity.Slug, entity.Description, entity.Icon, entity.IsActive,
            entity.Fields.Select(f => new FieldExportDto(
                f.Name, f.Slug, f.FieldType.ToString(), f.IsRequired, f.IsSearchable,
                f.IsFilterable, f.DisplayOrder, f.DefaultValue, f.OptionsJson, f.ValidationJson
            )).ToList()
        );
    }
}

// ── Import ──

public record ImportEntityCommand(Guid TenantId, EntityExportDto Data);

public class ImportEntityHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinitionDto> Handle(ImportEntityCommand cmd, CancellationToken ct)
    {
        var exists = await db.EntityDefinitions
            .AnyAsync(e => e.TenantId == cmd.TenantId && e.Slug == cmd.Data.Slug, ct);
        if (exists)
            throw new ConflictException($"Entity with slug '{cmd.Data.Slug}' already exists.");

        var entity = new EntityDefinition
        {
            TenantId = cmd.TenantId,
            Name = cmd.Data.Name,
            Slug = cmd.Data.Slug,
            Description = cmd.Data.Description,
            Icon = cmd.Data.Icon,
            IsActive = cmd.Data.IsActive,
            Fields = cmd.Data.Fields.Select((f, i) => new FieldDefinition
            {
                TenantId = cmd.TenantId,
                Name = f.Name,
                Slug = f.Slug,
                FieldType = Enum.TryParse<FieldType>(f.FieldType, true, out var ft) ? ft : FieldType.Text,
                IsRequired = f.IsRequired,
                IsSearchable = f.IsSearchable,
                IsFilterable = f.IsFilterable,
                DisplayOrder = f.DisplayOrder > 0 ? f.DisplayOrder : i + 1,
                DefaultValue = f.DefaultValue,
                OptionsJson = f.OptionsJson,
                ValidationJson = f.ValidationJson
            }).ToList()
        };

        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync(ct);

        return new EntityDefinitionDto(entity.Id, entity.Name, entity.Slug, entity.Description,
            entity.Icon, entity.IsActive, entity.DisplayOrder, entity.Fields.Count, entity.CreatedAt);
    }
}

// ── DTOs ──

public record EntityExportDto(
    string Name, string Slug, string? Description, string? Icon, bool IsActive,
    IReadOnlyList<FieldExportDto> Fields
);

public record FieldExportDto(
    string Name, string Slug, string FieldType, bool IsRequired, bool IsSearchable,
    bool IsFilterable, int DisplayOrder, string? DefaultValue, string? OptionsJson, string? ValidationJson
);
