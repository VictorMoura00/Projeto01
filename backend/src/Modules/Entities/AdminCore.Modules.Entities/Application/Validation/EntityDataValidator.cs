using System.Text.Json;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Validation;

/// <summary>
/// Validates an EntityData payload JSON against the field definitions
/// of its parent EntityDefinition. Checks types, required fields,
/// select options, and custom validation rules.
/// </summary>
public class EntityDataValidator(EntitiesDbContext db)
{
    public async Task<List<ValidationError>> ValidateAsync(
        Guid entityDefinitionId, Guid tenantId, string payloadJson, CancellationToken ct)
    {
        var errors = new List<ValidationError>();

        var entity = await db.EntityDefinitions
            .Include(e => e.Fields)
            .FirstOrDefaultAsync(e => e.Id == entityDefinitionId && e.TenantId == tenantId, ct);

        if (entity is null)
        {
            errors.Add(new ValidationError("_entity", "Entity definition not found."));
            return errors;
        }

        JsonElement payload;
        try
        {
            payload = JsonSerializer.Deserialize<JsonElement>(payloadJson);
        }
        catch (JsonException)
        {
            errors.Add(new ValidationError("_payload", "Payload is not valid JSON."));
            return errors;
        }

        if (payload.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new ValidationError("_payload", "Payload must be a JSON object."));
            return errors;
        }

        foreach (var field in entity.Fields)
        {
            var hasProperty = payload.TryGetProperty(field.Slug, out var value);

            // Required check
            if (field.IsRequired && (!hasProperty || value.ValueKind == JsonValueKind.Null || (value.ValueKind == JsonValueKind.String && string.IsNullOrWhiteSpace(value.GetString()))))
            {
                errors.Add(new ValidationError(field.Slug, $"'{field.Name}' is required."));
                continue;
            }

            if (!hasProperty || value.ValueKind == JsonValueKind.Null)
                continue;

            // Type validation
            ValidateType(field, value, errors);

            // Options validation (Select / MultiSelect)
            ValidateOptions(field, value, errors);

            // Custom JSON validation
            ValidateCustom(field, value, errors);
        }

        return errors;
    }

    private static void ValidateType(FieldDefinition field, JsonElement value, List<ValidationError> errors)
    {
        var ok = field.FieldType switch
        {
            FieldType.Number or FieldType.Decimal =>
                value.ValueKind == JsonValueKind.Number,
            FieldType.Boolean =>
                value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False,
            FieldType.Date or FieldType.DateTime =>
                value.ValueKind == JsonValueKind.String && DateTime.TryParse(value.GetString(), out _),
            FieldType.Select =>
                value.ValueKind == JsonValueKind.String,
            FieldType.MultiSelect =>
                value.ValueKind == JsonValueKind.Array,
            _ => true // Text, Textarea, File, Relation — accept anything
        };

        if (!ok)
            errors.Add(new ValidationError(field.Slug, $"'{field.Name}' must be of type {field.FieldType}."));
    }

    private static void ValidateOptions(FieldDefinition field, JsonElement value, List<ValidationError> errors)
    {
        if (string.IsNullOrWhiteSpace(field.OptionsJson))
            return;

        List<string>? options = null;
        try { options = JsonSerializer.Deserialize<List<string>>(field.OptionsJson); }
        catch { return; }

        if (options is null || options.Count == 0) return;

        if (field.FieldType == FieldType.Select)
        {
            var str = value.GetString();
            if (str is not null && !options.Contains(str))
                errors.Add(new ValidationError(field.Slug, $"'{str}' is not a valid option for '{field.Name}'. Options: [{string.Join(", ", options)}]"));
        }
        else if (field.FieldType == FieldType.MultiSelect && value.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in value.EnumerateArray())
            {
                var s = item.GetString();
                if (s is not null && !options.Contains(s))
                    errors.Add(new ValidationError(field.Slug, $"'{s}' is not a valid option for '{field.Name}'."));
            }
        }
    }

    private static void ValidateCustom(FieldDefinition field, JsonElement value, List<ValidationError> errors)
    {
        if (string.IsNullOrWhiteSpace(field.ValidationJson))
            return;

        Dictionary<string, JsonElement>? rules = null;
        try { rules = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(field.ValidationJson); }
        catch { return; }

        if (rules is null) return;

        // minLength / maxLength for strings
        if (value.ValueKind == JsonValueKind.String)
        {
            var str = value.GetString() ?? "";
            if (rules.TryGetValue("minLength", out var min) && min.ValueKind == JsonValueKind.Number && str.Length < min.GetInt32())
                errors.Add(new ValidationError(field.Slug, $"'{field.Name}' must be at least {min.GetInt32()} characters."));
            if (rules.TryGetValue("maxLength", out var max) && max.ValueKind == JsonValueKind.Number && str.Length > max.GetInt32())
                errors.Add(new ValidationError(field.Slug, $"'{field.Name}' must be at most {max.GetInt32()} characters."));
        }

        // min / max for numbers
        if (value.ValueKind == JsonValueKind.Number)
        {
            var num = value.GetDecimal();
            if (rules.TryGetValue("min", out var min) && min.ValueKind == JsonValueKind.Number && num < min.GetDecimal())
                errors.Add(new ValidationError(field.Slug, $"'{field.Name}' must be at least {min.GetDecimal()}."));
            if (rules.TryGetValue("max", out var max) && max.ValueKind == JsonValueKind.Number && num > max.GetDecimal())
                errors.Add(new ValidationError(field.Slug, $"'{field.Name}' must be at most {max.GetDecimal()}."));
        }

        // pattern (regex) for strings
        if (value.ValueKind == JsonValueKind.String && rules.TryGetValue("pattern", out var pattern) && pattern.ValueKind == JsonValueKind.String)
        {
            try
            {
                var regex = new System.Text.RegularExpressions.Regex(pattern.GetString()!);
                if (!regex.IsMatch(value.GetString()!))
                    errors.Add(new ValidationError(field.Slug, $"'{field.Name}' does not match pattern '{pattern.GetString()}'."));
            }
            catch { /* invalid regex — skip */ }
        }
    }
}

public record ValidationError(string Field, string Message);
