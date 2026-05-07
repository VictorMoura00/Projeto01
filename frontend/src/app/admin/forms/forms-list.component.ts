import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsService } from './forms.service';
import { FormDefinition, FIELD_TYPE_LABELS, CreateFormPayload, UpdateFormPayload, DuplicatePayload } from './form.model';

@Component({
  selector: 'app-forms-list',
  imports: [
    FormsModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule, ToggleSwitchModule,
    MultiSelectModule, RouterLink, RouterLinkActive
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Formulários dinâmicos</span>
          <h1 class="page-title">Formulários</h1>
          <p class="page-description">Crie, edite e publique formulários configuráveis com campos dinâmicos.</p>
        </div>
        <div class="page-actions">
          <p-button label="Importar JSON" icon="pi pi-upload" severity="secondary" [text]="true" (onClick)="fileInput.click()" />
          <input #fileInput type="file" accept=".json" hidden (change)="onFileSelected($event)" />
          <p-button label="Novo formulário" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de formulários">
        <div class="metric-card">
          <span class="metric-label">Total</span>
          <strong class="metric-value">{{ totalCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Publicados</span>
          <strong class="metric-value">{{ publishedCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Campos</span>
          <strong class="metric-value">{{ fieldTotal() }}</strong>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-toolbar">
          <div>
            <strong class="toolbar-title">Catálogo de formulários</strong>
            <p class="toolbar-meta">Linhas paginadas. Arraste colunas para reordenar.</p>
          </div>
          <div class="toolbar-right">
            <p-multiSelect
              [options]="columnOptions"
              [(ngModel)]="visibleColumns"
              placeholder="Colunas"
              styleClass="column-select"
            />
            <label class="search-control">
              <span class="pi pi-search" aria-hidden="true"></span>
              <input pInputText [(ngModel)]="search" placeholder="Buscar por nome ou slug" aria-label="Buscar formulários" (input)="onSearch()" />
            </label>
          </div>
        </div>

        <p-table
          [value]="entities()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="20"
          [totalRecords]="totalCount()"
          [lazy]="true"
          [rowsPerPageOptions]="[10, 20, 50]"
          [reorderableColumns]="true"
          [resizableColumns]="true"
          (onLazyLoad)="onPage($event)"
          rowHover
          styleClass="p-datatable-sm"
          [tableStyle]="{'min-width': '56rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              @if (colVisible('name')) { <th pResizableColumn>Nome</th> }
              @if (colVisible('slug')) { <th>Slug</th> }
              @if (colVisible('version')) { <th>Versão</th> }
              @if (colVisible('fields')) { <th>Campos</th> }
              @if (colVisible('status')) { <th>Status</th> }
              <th class="actions-col">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-form>
            <tr>
              @if (colVisible('name')) {
              <td>
                <a class="form-name" [routerLink]="['/admin/forms', form.id]" routerLinkActive="active">
                  <span class="form-mark"><i class="pi pi-file-edit" aria-hidden="true"></i></span>
                  <span>
                    <strong>{{ form.name }}</strong>
                    @if (form.description) { <small>{{ form.description }}</small> }
                  </span>
                </a>
              </td>
              }
              @if (colVisible('slug')) { <td><code class="slug-code">{{ form.slug }}</code></td> }
              @if (colVisible('version')) { <td><span class="version-badge">v{{ form.version }}</span></td> }
              @if (colVisible('fields')) { <td><span class="field-count">{{ form.fields.length }}</span></td> }
              @if (colVisible('status')) {
              <td>
                <div class="status-tags">
                  @if (form.isPublished) { <p-tag value="Publicado" severity="success" /> }
                  @else { <p-tag value="Rascunho" severity="warn" /> }
                  <p-tag [value]="form.isActive ? 'Ativo' : 'Inativo'" [severity]="form.isActive ? 'info' : 'secondary'" />
                </div>
              </td>
              }
              <td>
                <div class="row-actions">
                  <p-button icon="pi pi-download" size="small" [text]="true" severity="help" ariaLabel="Exportar JSON" pTooltip="Exportar JSON" (onClick)="exportForm(form)" />
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar formulário" pTooltip="Editar" (onClick)="openEdit(form)" />
                  @if (!form.isPublished) {
                    <p-button icon="pi pi-send" size="small" [text]="true" severity="success" ariaLabel="Publicar formulário" pTooltip="Publicar" (onClick)="confirmPublish(form)" />
                  }
                  <p-button icon="pi pi-copy" size="small" [text]="true" ariaLabel="Duplicar formulário" pTooltip="Duplicar" (onClick)="openDuplicate(form)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Excluir formulário" pTooltip="Excluir" (onClick)="confirmDelete(form)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <strong>Nenhum formulário encontrado</strong>
                  Ajuste a busca ou crie um novo formulário para começar.
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <!-- Create / Edit Dialog -->
    <p-dialog [(visible)]="showForm" [header]="dialogTitle()" [modal]="true" [style]="{width: '32rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="form" class="entity-form">
        <div class="field">
          <label for="form-name">Nome *</label>
          <input id="form-name" pInputText formControlName="name" placeholder="Ex: Solicitação de Férias" autocomplete="off" (input)="autoSlug()" />
        </div>
        @if (isCreateMode()) {
          <div class="field">
            <label for="form-slug">Slug *</label>
            <input id="form-slug" pInputText formControlName="slug" placeholder="solicitacao-de-ferias" autocomplete="off" />
            <small>Usado internamente. Apenas letras minúsculas, números e hífens.</small>
          </div>
        }
        <div class="field">
          <label for="form-description">Descrição</label>
          <textarea id="form-description" pInputText formControlName="description" rows="3" placeholder="Descreva o propósito deste formulário"></textarea>
        </div>
        @if (!isCreateMode()) {
          <div class="field field-inline">
            <label>Ativo</label>
            <p-toggleswitch formControlName="isActive" />
          </div>
        }
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showForm = false" />
          <p-button label="Salvar" [loading]="saving" [disabled]="form.invalid" (onClick)="submitForm()" />
        </div>
      </form>
    </p-dialog>

    <!-- Duplicate Dialog -->
    <p-dialog [(visible)]="showDuplicate" header="Duplicar Formulário" [modal]="true" [style]="{width: '32rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="duplicateForm" class="entity-form">
        <div class="field">
          <label for="dup-name">Novo nome *</label>
          <input id="dup-name" pInputText formControlName="newName" placeholder="Ex: Solicitação de Férias 2" autocomplete="off" (input)="autoDuplicateSlug()" />
        </div>
        <div class="field">
          <label for="dup-slug">Novo slug *</label>
          <input id="dup-slug" pInputText formControlName="newSlug" placeholder="solicitacao-de-ferias-2" autocomplete="off" />
          <small>Usado internamente. Apenas letras minúsculas, números e hífens.</small>
        </div>
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showDuplicate = false" />
          <p-button label="Duplicar" [loading]="duplicating" [disabled]="duplicateForm.invalid" (onClick)="submitDuplicate()" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .form-name {
      align-items: center;
      color: inherit;
      display: flex;
      text-decoration: none;
    }

    .form-name:hover strong {
      color: var(--p-primary-color);
      text-decoration: underline;
    }

    .form-name strong,
    .form-name small {
      display: block;
    }

    .form-name small {
      color: var(--app-muted);
      font-size: 0.8125rem;
      margin-top: 0.15rem;
      max-width: 34rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .form-mark {
      align-items: center;
      background: var(--p-surface-100);
      border-radius: 6px;
      color: var(--p-primary-color);
      display: inline-flex;
      height: 2.25rem;
      justify-content: center;
      margin-right: 0.75rem;
      width: 2.25rem;
    }

    .slug-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .version-badge {
      color: var(--app-text);
      font-weight: 700;
    }

    .field-count {
      color: var(--app-text);
      font-weight: 700;
    }

    .status-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .actions-col {
      text-align: right;
      width: 11rem;
    }

    .entity-form {
      display: grid;
      gap: 1rem;
    }
  `]
})
export class FormsListComponent implements OnInit {
  private svc = inject(FormsService);
  private router = inject(Router);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  entities = signal<FormDefinition[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  publishedCount = computed(() => this.entities().filter(f => f.isPublished).length);
  fieldTotal = computed(() => this.entities().reduce((total, f) => total + f.fields.length, 0));

  columnOptions = [
    { label: 'Nome', value: 'name' },
    { label: 'Slug', value: 'slug' },
    { label: 'Versão', value: 'version' },
    { label: 'Campos', value: 'fields' },
    { label: 'Status', value: 'status' }
  ];
  visibleColumns: string[] = ['name', 'slug', 'version', 'fields', 'status'];

  search = '';
  showForm = false;
  saving = false;
  showDuplicate = false;
  duplicating = false;
  private currentPage = 1;

  editingForm = signal<FormDefinition | null>(null);
  isCreateMode = computed(() => !this.editingForm());
  dialogTitle = computed(() => this.editingForm() ? 'Editar Formulário' : 'Novo Formulário');

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(50)]],
    description: [''],
    isActive: [true]
  });

  duplicatingForm = signal<FormDefinition | null>(null);
  duplicateForm: FormGroup = this.fb.group({
    newName: ['', [Validators.required, Validators.maxLength(100)]],
    newSlug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(50)]]
  });

  ngOnInit() { this.load(); }

  colVisible(field: string) { return this.visibleColumns.includes(field); }

  exportForm(form: FormDefinition) {
    this.svc.export(form.id).subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${form.slug}.json`;
        a.click(); URL.revokeObjectURL(url);
        this.msg.add({ severity: 'success', summary: 'Exportado', detail: `${form.name}.json` });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao exportar.' })
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.svc.import(data).subscribe({
          next: (result) => {
            this.msg.add({ severity: 'success', summary: 'Importado', detail: `Formulário "${result.name}" criado.` });
            this.load(this.currentPage);
          },
          error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Falha ao importar.' })
        });
      } catch {
        this.msg.add({ severity: 'error', summary: 'JSON inválido' });
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  load(page = 1) {
    this.loading.set(true);
    this.currentPage = page;
    this.svc.getAll(page, 20, this.search || undefined).subscribe({
      next: res => { this.entities.set(res.items); this.totalCount.set(res.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.load(1); }
  onPage(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? 20;
    this.load(Math.floor(first / rows) + 1);
  }

  openCreate() {
    this.editingForm.set(null);
    this.form.reset({ isActive: true });
    this.form.get('slug')?.enable();
    this.showForm = true;
  }

  openEdit(form: FormDefinition) {
    this.editingForm.set(form);
    this.form.patchValue({
      name: form.name,
      description: form.description ?? '',
      isActive: form.isActive
    });
    this.form.get('slug')?.disable();
    this.showForm = true;
  }

  autoSlug() {
    if (this.editingForm()) return;
    const name = this.form.get('name')?.value ?? '';
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.form.get('slug')?.setValue(slug, { emitEvent: false });
  }

  submitForm() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.getRawValue();
    const editing = this.editingForm();

    const obs = editing
      ? this.svc.update(editing.id, {
          name: val.name!,
          description: val.description ?? undefined,
          isActive: val.isActive!,
          fields: editing.fields.map(f => ({
            label: f.label,
            key: f.key,
            type: f.type,
            isRequired: f.isRequired,
            placeholder: f.placeholder,
            displayOrder: f.displayOrder,
            optionsJson: f.optionsJson,
            validationJson: f.validationJson,
            layoutJson: f.layoutJson
          }))
        })
      : this.svc.create({
          name: val.name!,
          slug: val.slug!,
          description: val.description ?? undefined,
          fields: []
        });

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.msg.add({ severity: 'success', summary: 'Salvo!', detail: editing ? 'Formulário atualizado.' : 'Formulário criado.' });
        this.load(this.currentPage);
      },
      error: () => { this.saving = false; }
    });
  }

  confirmPublish(form: FormDefinition) {
    this.confirm.confirm({
      message: `Publicar formulário "${form.name}"? A versão atual será disponibilizada.`,
      header: 'Confirmar publicação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Publicar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.svc.publish(form.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Publicado', detail: `Formulário "${form.name}" publicado.` }); this.load(this.currentPage); }
      })
    });
  }

  openDuplicate(form: FormDefinition) {
    this.duplicatingForm.set(form);
    this.duplicateForm.reset();
    this.showDuplicate = true;
  }

  autoDuplicateSlug() {
    const name = this.duplicateForm.get('newName')?.value ?? '';
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.duplicateForm.get('newSlug')?.setValue(slug, { emitEvent: false });
  }

  submitDuplicate() {
    if (this.duplicateForm.invalid) return;
    this.duplicating = true;
    const val = this.duplicateForm.value;
    const form = this.duplicatingForm()!;

    this.svc.duplicate(form.id, { newName: val.newName!, newSlug: val.newSlug! }).subscribe({
      next: () => {
        this.duplicating = false;
        this.showDuplicate = false;
        this.msg.add({ severity: 'success', summary: 'Duplicado', detail: `Formulário "${form.name}" duplicado.` });
        this.load(this.currentPage);
      },
      error: () => { this.duplicating = false; }
    });
  }

  confirmDelete(form: FormDefinition) {
    this.confirm.confirm({
      message: `Deseja excluir o formulário "${form.name}"? Esta ação não pode ser desfeita.`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(form.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Excluído', detail: `Formulário "${form.name}" removido.` }); this.load(this.currentPage); }
      })
    });
  }
}
