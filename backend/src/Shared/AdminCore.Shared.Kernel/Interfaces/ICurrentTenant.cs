namespace AdminCore.Shared.Kernel.Interfaces;

public interface ICurrentTenant
{
    Guid? Id { get; }
    string? Slug { get; }
    bool IsSet { get; }
}
