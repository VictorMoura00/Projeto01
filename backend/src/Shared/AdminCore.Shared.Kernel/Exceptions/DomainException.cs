namespace AdminCore.Shared.Kernel.Exceptions;

public class DomainException(string message) : Exception(message);

public class NotFoundException(string entity, object key)
    : DomainException($"{entity} with key '{key}' was not found.");

public class ForbiddenException(string? message = null)
    : DomainException(message ?? "You do not have permission to perform this action.");

public class ConflictException(string message) : DomainException(message);

public class ValidationException : DomainException
{
    public IReadOnlyList<ValidationErrorDetail> Errors { get; }

    public ValidationException(IEnumerable<ValidationErrorDetail> errors)
        : base($"Validation failed: {errors.First().Message}")
    {
        Errors = errors.ToList();
    }
}

public record ValidationErrorDetail(string Field, string Message);
