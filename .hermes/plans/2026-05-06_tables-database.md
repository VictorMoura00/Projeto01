# Plano: Tabelas Configuráveis + Bancos Multi-Provedor

> **Para OpenCode:** implementar tarefa por tarefa, rodando build + testes após cada uma.

**Meta:** (A) Criar componente de tabela reutilizável com colunas configuráveis, edição inline e export. (B) Adicionar suporte a SQLite como alternativa ao PostgreSQL para dev local sem Docker.

---

## Parte A — Tabela Configurável (Frontend)

### Task A1: Criar modelo de coluna configurável

**Arquivo:** `frontend/src/app/shared/table/column.model.ts`

```typescript
export interface TableColumn {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  visible?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'tag';
  tagSeverity?: (value: any) => 'success' | 'info' | 'warn' | 'danger' | 'secondary';
  template?: 'default' | 'code' | 'actions';
}
```

### Task A2: Criar DataTableComponent reutilizável

**Arquivo:** `frontend/src/app/shared/table/data-table.component.ts`

Standalone component envolvendo p-table com:
- `[columns]` input — array de `TableColumn`
- `[data]` input — array de dados
- `[loading]` input
- `[totalRecords]` input
- `[lazy]` input + `(onLazyLoad)` output
- Colunas reordenáveis (pReorderableColumns)
- Colunas redimensionáveis (pResizableColumns)
- Seleção de colunas visíveis (p-multiSelect no toolbar)
- Suporte a edição inline via `[editable]="true"` + `(cellEditSave)` output
- Template de ações customizável via `<ng-template pTemplate="actions">`
- Export CSV via p-table `csv` export
- Estilo consistente com o design system (`.table-shell`, `.table-toolbar`)

### Task A3: Migrar EntitiesList para usar DataTableComponent

**Arquivo:** `frontend/src/app/admin/entities/entities-list.component.ts`

Substituir `<p-table>` inline pelo `<app-data-table>`. Manter métricas, busca, dialogs.

### Task A4: Migrar ParametersList para DataTableComponent

**Arquivo:** `frontend/src/app/admin/parameters/parameters-list.component.ts`

### Task A5: Migrar AccessList para DataTableComponent

**Arquivo:** `frontend/src/app/admin/access/access-list.component.ts`

### Task A6: Migrar FormsList para DataTableComponent

**Arquivo:** `frontend/src/app/admin/forms/forms-list.component.ts`

---

## Parte B — Bancos Multi-Provedor (Backend)

### Task B1: Adicionar DB_PROVIDER ao .env

**Arquivo:** `.env` (já existe)

```env
DB_PROVIDER=postgres
# DB_PROVIDER=sqlite   # alternar para dev sem Docker
```

Mapear em Program.cs: `MapEnvToDotNet("DB_PROVIDER", "Database__Provider")`

### Task B2: Criar DatabaseExtensions para configurar provider-aware

**Arquivo:** `backend/src/AdminCore.API/Extensions/DatabaseExtensions.cs`

Classe estática com método auxiliar que cada módulo chama no `RegisterModule`:
```csharp
public static class DatabaseExtensions
{
    public static DbContextOptionsBuilder UseProvider(
        this DbContextOptionsBuilder options, IConfiguration config)
    {
        var provider = config["Database:Provider"] ?? "postgres";
        var connString = config.GetConnectionString("DefaultConnection");
        
        if (provider == "sqlite")
            return options.UseSqlite(connString);
        return options.UseNpgsql(connString);
    }
}
```

Adicionar pacote `Microsoft.EntityFrameworkCore.Sqlite` ao AdminCore.API.

### Task B3: Atualizar todos os módulos para usar UseProvider

**Arquivos a modificar:**
- `AuthModule.cs` — trocar `.UseNpgsql(...)` por `.UseProvider(configuration)`
- `TenantsModule.cs`
- `EntitiesModule.cs`
- `AccessModule.cs`
- `ParametersModule.cs`
- `FormBuilderModule.cs`

### Task B4: Atualizar módulos de teste para InMemory (já estão corretos — verificar)

Os testes já usam InMemory, então não precisam de alteração. Apenas verificar que os testes passam com a mudança.

### Task B5: Build + testes

```bash
cd backend && dotnet build AdminCore.slnx && dotnet test AdminCore.slnx
```

---

## Verificação Final

```bash
# Frontend
cd frontend && npx ng build --configuration development

# Backend (com SQLite)
DB_PROVIDER=sqlite DATABASE_URL="Data Source=admincore_dev.db" dotnet run
```
