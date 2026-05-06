using AdminCore.Modules.FormBuilder.Domain;

namespace AdminCore.Modules.FormBuilder.Application.DTOs;

public record FormDefinitionDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    int Version,
    bool IsPublished,
    bool IsActive,
    IReadOnlyList<FormFieldDto> Fields,
    DateTime CreatedAt
);

public record FormFieldDto(
    Guid Id,
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

public static class FormMapping
{
    public static FormDefinitionDto ToDto(FormDefinition form) =>
        new(form.Id, form.Name, form.Slug, form.Description, form.Version, form.IsPublished, form.IsActive,
            form.Fields.OrderBy(f => f.DisplayOrder).Select(ToDto).ToList(), form.CreatedAt);

    public static FormFieldDto ToDto(FormField field) =>
        new(field.Id, field.Label, field.Key, field.Type, field.IsRequired, field.Placeholder,
            field.DisplayOrder, field.OptionsJson, field.ValidationJson, field.LayoutJson);
}
