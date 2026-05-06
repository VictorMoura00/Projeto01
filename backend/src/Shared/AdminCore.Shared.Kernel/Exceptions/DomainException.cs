namespace AdminCore.Shared.Kernel.Exceptions;

public class DomainException(string message) : Exception(message);

public class NotFoundException(string entity, object key)
    : DomainException($"{entity} with key '{key}' was not found.");

public class ForbiddenException(string? message = null)
    : DomainException(message ?? "You do not have permission to perform this action.");

public class ConflictException(string message) : DomainException(message);
