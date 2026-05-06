using AdminCore.Shared.Kernel.Interfaces;

namespace AdminCore.API.Infrastructure;

public class CurrentTenant : ICurrentTenant
{
    public Guid? Id { get; private set; }
    public string? Slug { get; private set; }
    public bool IsSet => Id.HasValue;

    public void Set(Guid id, string? slug = null)
    {
        Id = id;
        Slug = slug;
    }
}
