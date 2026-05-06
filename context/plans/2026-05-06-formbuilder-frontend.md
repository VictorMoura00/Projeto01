# FormBuilder Frontend — Implementation Plan

> For agentic workers: implement via OpenCode Go CLI.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FormBuilder frontend (Angular 21 + PrimeNG Aura) consuming the existing backend API at `/admin/forms/*`.

**Architecture:** Follow existing Angular patterns from the `entities` module. 5 files to create, 1 to modify. ngx-formly already installed for dynamic form rendering.

**Tech Stack:** Angular 21 standalone, PrimeNG 21, ngx-formly 7, Angular CDK drag-drop, Signals, ReactiveForms

---

## Backend API (existing, do NOT modify)

All endpoints under `/admin/forms` with JWT auth:

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/admin/forms?page=1&pageSize=20&search=` | — | `{ items: FormDefinitionDto[], totalCount, page, pageSize, totalPages }` |
| GET | `/admin/forms/{id}` | — | `FormDefinitionDto` (includes `fields[]`) |
| POST | `/admin/forms` | `{ name, slug, description?, fields[] }` | `FormDefinitionDto` |
| PUT | `/admin/forms/{id}` | `{ name, description?, isActive, fields[] }` | `FormDefinitionDto` |
| DELETE | `/admin/forms/{id}` | — | 204 No Content |
| POST | `/admin/forms/{id}/publish` | — | `FormDefinitionDto` |
| POST | `/admin/forms/{id}/duplicate` | `{ newName, newSlug }` | `FormDefinitionDto` |

### Backend DTOs (C# records → TS interfaces)

```ts
// FormDefinitionDto
interface FormDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: number;
  isPublished: boolean;
  isActive: boolean;
  fields: FormField[];
  createdAt: string;
}

// FormFieldDto
interface FormField {
  id: string;
  label: string;
  key: string;
  type: FormFieldType;
  isRequired: boolean;
  placeholder?: string;
  displayOrder: number;
  optionsJson?: string;
  validationJson?: string;
  layoutJson?: string;
}

enum FormFieldType {
  Text = 0,
  Textarea = 1,
  Number = 2,
  Date = 3,
  Boolean = 4,
  Select = 5,
  MultiSelect = 6,
  File = 7
}
```

### Command/Input shapes

```ts
// CreateFormDefinitionCommand (POST body)
interface CreateFormPayload {
  name: string;
  slug: string;
  description?: string;
  fields: FormFieldInput[];
}

// UpdateFormDefinitionCommand (PUT body) — note: slug is NOT in update
interface UpdateFormPayload {
  name: string;
  description?: string;
  isActive: boolean;
  fields: FormFieldInput[];
}

// FormFieldInput (sub-object in create/update)
interface FormFieldInput {
  label: string;
  key: string;
  type: FormFieldType;
  isRequired: boolean;
  placeholder?: string;
  displayOrder: number;
  optionsJson?: string;
  validationJson?: string;
  layoutJson?: string;
}

// DuplicateFormDefinitionCommand
interface DuplicatePayload {
  newName: string;
  newSlug: string;
}
```

---

## Files to Create

### Task 1: `form.model.ts`

**Create:** `frontend/src/app/admin/forms/form.model.ts`

TypeScript interfaces matching backend DTOs above. Include:
- `FormDefinition` interface
- `FormField` interface  
- `FormFieldType` enum (0-7)
- `FIELD_TYPE_LABELS` constant (Record<FormFieldType, string>):
  - Text → 'Texto', Textarea → 'Texto Longo', Number → 'Número', Date → 'Data', Boolean → 'Sim/Não', Select → 'Seleção', MultiSelect → 'Múltipla Seleção', File → 'Arquivo'
- `CreateFormPayload`, `UpdateFormPayload`, `FormFieldInput`, `DuplicatePayload` interfaces
- `PagedResult<T>` interface: `{ items: T[], totalCount: number, page: number, pageSize: number, totalPages: number }`
- `CREATE_FIELD_DEFAULTS` constant: default values for new FormFieldInput

---

### Task 2: `forms.service.ts`

**Create:** `frontend/src/app/admin/forms/forms.service.ts`

Injectable service using `providedIn: 'root'`, injects `ApiService`. Methods:

```ts
getAll(page, pageSize, search?): Observable<PagedResult<FormDefinition>>
getById(id): Observable<FormDefinition>
create(data: CreateFormPayload): Observable<FormDefinition>
update(id, data: UpdateFormPayload): Observable<FormDefinition>
delete(id): Observable<void>
publish(id): Observable<FormDefinition>
duplicate(id, data: DuplicatePayload): Observable<FormDefinition>
```

All paths: `/admin/forms` or `/admin/forms/${id}`. Use `this.api.get/post/put/delete<T>(path, body?)`.

---

### Task 3: `forms.routes.ts`

**Create:** `frontend/src/app/admin/forms/forms.routes.ts`

```ts
import { Routes } from '@angular/router';
export const formsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./forms-list.component').then(m => m.FormsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./form-editor.component').then(m => m.FormEditorComponent)
  }
];
```

---

### Task 4: `forms-list.component.ts`

**Create:** `frontend/src/app/admin/forms/forms-list.component.ts`

Standalone component following the pattern of `entities-list.component.ts`. Key differences:

**Template structure:**
- Header with title "Formulários" + description + "Novo formulário" button
- Metric strip: Total, Publicados, Campos (computed signals)
- Search input with pi pi-search
- p-table with lazy loading, paginator, [rows]="20", [rowsPerPageOptions]="[10,20,50]"
- Columns: Nome (with icon + description), Slug (as <code>), Versão, Campos (count), Status (Published/Ativo/Inativo tags), Ações
- Actions column: Edit button, Publish button (only for unpublished), Duplicate button, Delete button
- Empty state message
- p-confirmDialog for delete + duplicate

**Modal dialogs:**
- Create/Edit dialog: contains a form (not inline, as a dialog)
  - For CREATE mode: fields for Name, Slug (auto-generated from name, lowercase+hyphens), Description
  - For EDIT/DUPLICATE mode: Name, Description
  - ToggleSwitch for IsActive (edit mode only)
  - Cancel + Save buttons
  - On create: call service.create(), on success show toast + reload list
  - On edit: call service.update(), show toast + reload

**Publish action:**
- Confirmation dialog: "Publicar formulário X? A versão atual será disponibilizada."
- On confirm: call service.publish(id), show toast + reload

**Duplicate action:**
- Dialog with form: New Name, New Slug (auto-generated). On save: call service.duplicate(id, {newName, newSlug})

**Delete action:**
- Confirmation dialog with danger button
- On confirm: call service.delete(id), show toast + reload

**Component class:**
- Signals: entities (FormDefinition[]), loading, totalCount
- Computed: publishedCount, fieldTotal
- Properties: search, showForm, editingForm, showDuplicate, duplicatingForm, currentPage
- Methods: load(), onSearch(), onPage(event), openCreate(), openEdit(form), onSaved(), confirmDelete(form), confirmPublish(form)

**Imports needed:**
FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, ConfirmDialogModule, DialogModule, TooltipModule, ToggleSwitchModule, ReactiveFormsModule

**Providers:** ConfirmationService

**Styles:** Match entity-list styling. Add `.slug-code { font-family: monospace }` and `.version-badge`.

---

### Task 5: `form-editor.component.ts`

**Create:** `frontend/src/app/admin/forms/form-editor.component.ts`

Standalone component. This is the form BUILDER page (edit mode with field management).

**Route:** `/admin/forms/:id`

**Features:**
- Load form by ID on init using `input()` signal binding with `withComponentInputBinding()`
- Actually, use `ActivatedRoute` since the route param is needed
- Display form metadata: name, slug, version, isPublished, isActive
- Inline editing of form metadata (name, description, isActive) — save button triggers service.update()
- Field list: show existing fields in a table/list
- Add field: form with Label, Key (auto-slug from label), Type (dropdown with FIELD_TYPE_LABELS), IsRequired (toggle), Placeholder, DisplayOrder
- Edit field: same form, pre-filled
- Delete field: confirm and remove from local array (real delete happens on save)
- Drag-and-drop reorder using Angular CDK (like entities)
- Save button: calls service.update() with the full fields array
- Back button: router.navigate(['/admin/forms'])
- Publish button: calls service.publish()
- Version badge showing current version

**Template layout:**
```
<header>
  <button back> ← Voltar
  <h1>{form.name}</h1>
  <span>v{form.version} | {published/not published}</span>
</header>

<section>Form Details (name, description, isActive edit form)</section>

<section>Fields
  <button>Add Field</button>
  <div cdkDropList>
    <div *cdkDrag> field row with edit/delete/type/label/required </div>
  </div>
</section>

<footer>
  <save button>
  <publish button>
</footer>

<!-- Add/Edit Field Dialog -->
<p-dialog>
  <form: label, key, type, isRequired, placeholder, displayOrder>
</p-dialog>
```

**Imports:** CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule, SelectModule, DialogModule, TagModule, TooltipModule, ConfirmDialogModule, DragDropModule (@angular/cdk/drag-drop)

**Component class:**
- Input signal: `id` (from route)
- Signal: `form` (FormDefinition | null), `loading`, `saving`, `editingField` (FormField | null), `showFieldDialog`
- FormGroup: `metadataForm` for name/description/isActive
- FormGroup: `fieldForm` for label/key/type/isRequired/placeholder/displayOrder
- On init: load form by id
- Methods: loadForm(), saveMetadata(), addField(), editField(f), deleteField(f), saveField(), reorderFields(event: CdkDragDrop), publish(), saveAllFields()
- Save logic: collect all fields from local array + current metadata, call service.update(id, {name, description, isActive, fields})

**ngx-formly integration (optional/future):**
- The form editor can show a live preview using ngx-formly. Add a tab "Preview" that renders the fields using `<formly-form>` with the current field definitions. This is nice-to-have but not required.

---

### Task 6: Update `admin.routes.ts`

**Modify:** `frontend/src/app/admin/admin.routes.ts`

Add a new route entry for forms BEFORE the existing routes (after overview):

```ts
{
  path: 'forms',
  loadChildren: () => import('./forms/forms.routes').then(m => m.formsRoutes)
},
```

Also add `data` with title/description/icon/features similar to other placeholder entries, but since this is a real route, just use the lazy load.

**Position in children array:** After the `overview` route, before `entities`. Keep alphabetical-ish ordering.

---

## Verification Steps

1. `cd frontend && npx ng build` — must pass with zero errors
2. Check that all imports resolve correctly
3. Check that API paths match the backend controller exactly (`/admin/forms` not `/admin/forms/`)
4. Ensure `(onClick)` is used on PrimeNG buttons, NOT `type="submit"`
5. Ensure no `MessageService` provided in components (it's at ROOT in app.config.ts)
6. Ensure `confirmationService` is provided in the list component

## Pitfalls

- Backend UPDATE command does NOT accept `slug` — only create does
- PrimeNG dialog buttons use `(onClick)`, not `type="submit"` (CRITICAL RULE)
- `PagedList` items come as `items` (not `data` or `results`)
- Auto-slug: normalize('NFD'), remove accents, lowercase, spaces→hyphens
- FormField `type` uses enum numbers (0-7), display labels come from FIELD_TYPE_LABELS
- Service paths: `/admin/forms` for list/create, `/admin/forms/${id}` for get/update/delete, `/admin/forms/${id}/publish`, `/admin/forms/${id}/duplicate`
- Use `inject()` for DI, not constructor injection (existing pattern)
- ChangeDetectionStrategy.OnPush for all components
