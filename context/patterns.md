# AdminCore — Padrões e Convenções

## Backend

### Wolverine Handler (Command co-locado)
```csharp
// Command e Handler no mesmo arquivo
public record CreateEntityDefinitionCommand(
    Guid TenantId, string Name, string Slug, string? Description, string? Icon
);

public class CreateEntityDefinitionHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinitionDto> Handle(CreateEntityDefinitionCommand cmd, CancellationToken ct)
    {
        var exists = await db.EntityDefinitions
            .AnyAsync(e => e.TenantId == cmd.TenantId && e.Slug == cmd.Slug, ct);
        if (exists) throw new ConflictException($"Entity with slug '{cmd.Slug}' already exists.");

        var entity = new EntityDefinition { TenantId = cmd.TenantId, Name = cmd.Name, Slug = cmd.Slug };
        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync(ct);
        return new EntityDefinitionDto(entity.Id, entity.Name, entity.Slug, ...);
    }
}
```

### Query Handler
```csharp
public record GetEntityDefinitionsQuery(Guid TenantId, int Page = 1, int PageSize = 20, string? Search = null);

public class GetEntityDefinitionsHandler(EntitiesDbContext db)
{
    public async Task<PagedList<EntityDefinitionDto>> Handle(GetEntityDefinitionsQuery q, CancellationToken ct)
    {
        var query = db.EntityDefinitions.AsNoTracking().Where(e => e.TenantId == q.TenantId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(e => e.Name).Skip((q.Page-1)*q.PageSize).Take(q.PageSize).ToListAsync(ct);
        return new PagedList<EntityDefinitionDto> { Items = items.Select(ToDto).ToList(), TotalCount = total, Page = q.Page, PageSize = q.PageSize };
    }
}
```

> **PagedList usa object initializer** (não construtor):
> `new PagedList<T> { Items = ..., TotalCount = ..., Page = ..., PageSize = ... }`

### MVC Controller (padrão atual — não Wolverine.Http)
```csharp
[ApiController]
[Route("admin/entities")]
public class EntitiesController(IMessageBus bus) : ControllerBase
{
    private static readonly Guid DevTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public Task<object> GetAll([FromQuery] int page = 1) =>
        bus.InvokeAsync<object>(new GetEntityDefinitionsQuery(DevTenantId, page));

    [HttpPost]
    public Task<object> Create([FromBody] CreateEntityDefinitionCommand cmd) =>
        bus.InvokeAsync<object>(cmd with { TenantId = DevTenantId });

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bus.InvokeAsync(new DeleteEntityDefinitionCommand(DevTenantId, id));
        return NoContent();
    }
}
```

### Exceções
```csharp
// Construtores obrigatórios:
throw new NotFoundException("Entity", entityId);       // (string entity, object key)
throw new ConflictException("Slug already exists.");   // (string message)
throw new ForbiddenException("Read-only param.");      // (string? message = null)
```

### Program.cs — APENAS extension methods
```csharp
// ✅ Correto
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddModules(builder.Configuration);
builder.Host.AddWolverineModules();

// ❌ Proibido — config inline no Program.cs
builder.Services.AddCors(opt => opt.AddPolicy(...));
```

### Migrations por módulo
```bash
# Via Makefile (recomendado):
make migrate-add NAME=AddAlgumaCoisa CTX=TenantsDbContext MOD=backend/src/Modules/Tenants/AdminCore.Modules.Tenants

# Manual:
dotnet ef migrations add NomeMigration --context TenantsDbContext \
  -p backend/src/Modules/Tenants/AdminCore.Modules.Tenants \
  -s backend/src/AdminCore.API \
  --output-dir Infrastructure/Migrations
```

---

## Frontend Angular 21

### Componente standalone padrão
```typescript
@Component({
  selector: 'app-example',
  imports: [ReactiveFormsModule, ButtonModule, TableModule, DialogModule],
  providers: [ConfirmationService],   // SÓ services locais — nunca MessageService aqui
  template: `...`
})
export class ExampleComponent implements OnInit {
  private svc = inject(ExampleService);
  private msg = inject(MessageService);       // vem do root (app.config.ts)
  private confirm = inject(ConfirmationService);

  items = signal<Item[]>([]);
  loading = signal(false);
  saving = signal(false);
  ...
}
```

### MessageService — provido no ROOT
```typescript
// app.config.ts — única fonte de verdade
providers: [
  MessageService,    // ← aqui, não no layout nem nos componentes
  ...
]
```
O `errorInterceptor` e todos os componentes injetam a mesma instância. O `<p-toast />` está no `AdminLayoutComponent` e usa essa instância root.

### Formulários em dialogs — usar (onClick), não type="submit"
PrimeNG dialogs renderizam em portal fora da árvore DOM — `ngSubmit` não propaga.

```html
<!-- ✅ Correto para botões dentro de p-dialog -->
<p-button label="Salvar" (onClick)="submit()" [loading]="saving()" />

<!-- ❌ Não funciona dentro de p-dialog -->
<p-button label="Salvar" type="submit" />
```

Não usar `[disabled]="form.invalid"` — disabilita o botão e bloqueia o `(onClick)`. 
Usar `markAllAsTouched()` no método para mostrar erros:
```typescript
submit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  ...
}
```

### Service padrão
```typescript
@Injectable({ providedIn: 'root' })
export class EntitiesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/entities`;

  getAll(page = 1, pageSize = 20, search?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedList<EntityDefinition>>(this.base, { params });
  }
}
// O apiInterceptor já prefixa environment.apiUrl em URLs relativas
```

### Auto-slug
```typescript
autoSlug() {
  if (this.editingItem()) return;  // não sobrescreve slug no modo edição
  const name = this.form.get('name')?.value ?? '';
  const slug = name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')        // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')           // remove caracteres especiais
    .trim().replace(/\s+/g, '-');            // espaços → hífens
  this.form.get('slug')?.setValue(slug, { emitEvent: false });
}
```

### Convenção de nomenclatura de arquivos
```
{feature}.model.ts        ← interfaces, enums, constantes de label
{feature}.service.ts      ← HTTP calls
{feature}-list.component.ts   ← listagem principal
{feature}-form.component.ts   ← formulário (se separado)
{feature}-detail.component.ts ← detalhe/filhos
{feature}.routes.ts           ← rotas lazy
```

---

## Testes (xUnit + NSubstitute + FluentAssertions)
```csharp
public class CreateEntityHandlerTests
{
    [Fact]
    public async Task Handle_ValidCommand_ReturnsDto()
    {
        // Usar DbContext real com InMemory ou Npgsql TestContainer
        // NSubstitute para interfaces (ICurrentTenant, etc.), não para DbContext
        var options = new DbContextOptionsBuilder<EntitiesDbContext>()
            .UseInMemoryDatabase("test").Options;
        var db = new EntitiesDbContext(options);
        var handler = new CreateEntityDefinitionHandler(db);

        var result = await handler.Handle(new CreateEntityDefinitionCommand(
            Guid.NewGuid(), "Chamado TI", "chamado-ti", null, null), default);

        result.Name.Should().Be("Chamado TI");
        result.Slug.Should().Be("chamado-ti");
    }
}
```
