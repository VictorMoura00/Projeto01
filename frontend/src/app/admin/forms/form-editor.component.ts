import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsService } from './forms.service';
import { FormDefinition, FormField, FormFieldType, FIELD_TYPE_LABELS, FormFieldInput } from './form.model';

const FIELD_TYPE_OPTIONS = Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => ({ value: Number(value), label }));

@Component({
  selector: 'app-form-editor',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule,
    ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule,
    SelectModule, DialogModule, TagModule, TooltipModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <button type="button" class="back-link" (click)="goBack()">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Formulários
          </button>
          <span class="page-kicker">Editor de formulário</span>
          <h1 class="page-title">{{ form()?.name ?? 'Carregando formulário' }}</h1>
          <p class="page-description">
            <code class="slug-code">{{ form()?.slug ?? '...' }}</code>
            <span>Versão <strong class="version-badge">v{{ form()?.version ?? 0 }}</strong></span>
            @if (form()?.isPublished) {
              <p-tag value="Publicado" severity="success" />
            } @else {
              <p-tag value="Rascunho" severity="warn" />
            }
          </p>
        </div>
        <div class="page-actions">
          <p-button label="Publicar" icon="pi pi-send" severity="success" [disabled]="!form() || form()!.isPublished" (onClick)="publish()" />
        </div>
      </div>

      @if (form(); as f) {
        <!-- Metadata Section -->
        <div class="metadata-panel">
          <div class="panel-header">
            <strong class="toolbar-title">Detalhes do formulário</strong>
            <p class="toolbar-meta">Edite o nome, descrição e status do formulário.</p>
          </div>
          <form [formGroup]="metadataForm" class="metadata-form">
            <div class="field">
              <label for="meta-name">Nome</label>
              <input id="meta-name" pInputText formControlName="name" placeholder="Nome do formulário" />
            </div>
            <div class="field">
              <label for="meta-description">Descrição</label>
              <textarea id="meta-description" pTextarea formControlName="description" rows="2" placeholder="Descreva o propósito deste formulário"></textarea>
            </div>
            <div class="field field-inline">
              <label>Ativo</label>
              <p-toggleswitch formControlName="isActive" />
            </div>
            <div class="form-actions">
              <p-button label="Salvar detalhes" icon="pi pi-save" [loading]="savingMeta" [disabled]="metadataForm.invalid" (onClick)="saveMetadata()" />
            </div>
          </form>
        </div>

        <!-- Fields Section -->
        <div class="fields-panel">
          <div class="fields-header">
            <div>
              <strong class="toolbar-title">Campos do formulário</strong>
              <p class="toolbar-meta">Adicione, edite e reordene os campos. Arraste as linhas para reordenar.</p>
            </div>
            <p-button label="Adicionar campo" icon="pi pi-plus" (onClick)="addField()" />
          </div>

          <div cdkDropList (cdkDropListDropped)="reorderFields($event)" class="fields-list" aria-label="Campos reordenáveis">
            @for (field of fields(); track field.id) {
              <div class="field-card" cdkDrag>
                <button class="drag-handle" type="button" cdkDragHandle aria-label="Arrastar campo">
                  <i class="pi pi-bars" aria-hidden="true"></i>
                </button>
                <div class="field-info">
                  <strong>{{ field.label }}</strong>
                  <code class="slug-code">{{ field.key }}</code>
                </div>
                <p-tag [value]="fieldTypeLabel(field.type)" severity="info" />
                <div class="field-badges">
                  @if (field.isRequired) { <p-tag value="Obrigatório" severity="warn" /> }
                  @if (field.placeholder) { <p-tag value="Placeholder" severity="secondary" /> }
                </div>
                <div class="row-actions">
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar campo" pTooltip="Editar" (onClick)="editField(field)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Excluir campo" pTooltip="Excluir" (onClick)="deleteField(field)" />
                </div>
              </div>
            }
          </div>

          @if (fields().length === 0) {
            <div class="empty-state">
              <strong>Nenhum campo configurado</strong>
              Crie o primeiro campo para começar a estruturar este formulário.
              <div class="empty-action">
                <p-button label="Adicionar primeiro campo" icon="pi pi-plus" [text]="true" (onClick)="addField()" />
              </div>
            </div>
          }
        </div>

        <!-- Footer Actions -->
        <div class="form-footer">
          <p-button label="Voltar" icon="pi pi-arrow-left" [text]="true" (onClick)="goBack()" />
          <p-button label="Salvar todos os campos" icon="pi pi-save" [loading]="saving" (onClick)="saveAllFields()" />
        </div>
      }
    </section>

    <!-- Add/Edit Field Dialog -->
    <p-dialog [(visible)]="showFieldDialog" [header]="editingField() ? 'Editar Campo' : 'Novo Campo'"
              [modal]="true" [style]="{width: '34rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="fieldForm" class="entity-form">
        <div class="field">
          <label for="field-label">Label *</label>
          <input id="field-label" pInputText formControlName="label" placeholder="Ex: Nome completo" autocomplete="off" (input)="autoFieldKey()" />
        </div>
        <div class="field">
          <label for="field-key">Key *</label>
          <input id="field-key" pInputText formControlName="key" placeholder="nome-completo" autocomplete="off" />
          <small>Identificador interno do campo. Apenas letras minúsculas, números e hífens.</small>
        </div>
        <div class="field">
          <label for="field-type">Tipo *</label>
          <p-select id="field-type" formControlName="type" [options]="fieldTypeOptions" optionLabel="label" optionValue="value" placeholder="Selecione um tipo" />
        </div>
        <div class="field field-inline">
          <label>Obrigatório</label>
          <p-toggleswitch formControlName="isRequired" />
        </div>
        <div class="field">
          <label for="field-placeholder">Placeholder</label>
          <input id="field-placeholder" pInputText formControlName="placeholder" placeholder="Digite aqui..." autocomplete="off" />
        </div>
        <div class="field">
          <label for="field-order">Ordem de exibição</label>
          <input id="field-order" pInputText type="number" formControlName="displayOrder" placeholder="0" />
        </div>
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showFieldDialog = false" />
          <p-button label="Salvar" [loading]="savingField" [disabled]="fieldForm.invalid" (onClick)="saveField()" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .back-link {
      align-items: center;
      background: transparent;
      border: 0;
      color: var(--p-primary-color);
      cursor: pointer;
      display: inline-flex;
      font-size: 0.875rem;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      padding: 0;
      text-decoration: none;
    }

    .page-description {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .slug-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .version-badge {
      color: var(--app-text);
    }

    .metadata-panel {
      background: var(--p-surface-0);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .panel-header {
      border-bottom: 1px solid var(--app-panel-border);
      padding: 0.875rem 1rem;
    }

    .metadata-form {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }

    .fields-panel {
      background: var(--p-surface-0);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .fields-header {
      align-items: center;
      border-bottom: 1px solid var(--app-panel-border);
      display: flex;
      justify-content: space-between;
      padding: 0.875rem 1rem;
    }

    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .field-card {
      align-items: center;
      background: var(--p-surface-50);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      display: grid;
      gap: 0.875rem;
      grid-template-columns: auto minmax(12rem, 1fr) auto minmax(9rem, auto) auto;
      padding: 0.75rem;
      transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
    }

    .field-card:hover {
      background: white;
      border-color: color-mix(in srgb, var(--p-primary-color) 28%, var(--app-panel-border));
    }

    .drag-handle {
      align-items: center;
      background: transparent;
      border: 0;
      color: var(--app-muted);
      cursor: grab;
      display: inline-flex;
      height: 2rem;
      justify-content: center;
      width: 2rem;
    }

    .field-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .field-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .empty-action {
      margin-top: 0.75rem;
    }

    .form-footer {
      align-items: center;
      display: flex;
      gap: 0.75rem;
      justify-content: space-between;
    }

    .entity-form {
      display: grid;
      gap: 1rem;
    }

    .cdk-drag-preview { box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 6px; }
    .cdk-drag-placeholder { opacity: 0.4; }

    @media (max-width: 860px) {
      .field-card {
        align-items: flex-start;
        grid-template-columns: auto 1fr auto;
      }

      .field-badges {
        grid-column: 2 / -1;
      }
    }
  `]
})
export class FormEditorComponent implements OnInit {
  private svc = inject(FormsService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form = signal<FormDefinition | null>(null);
  fields = computed(() => this.form()?.fields ?? []);
  loading = signal(false);
  saving = false;
  savingMeta = false;
  savingField = false;
  showFieldDialog = false;
  editingField = signal<FormField | null>(null);

  fieldTypeOptions = FIELD_TYPE_OPTIONS;

  metadataForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    isActive: [true]
  });

  fieldForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(100)]],
    key: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(50)]],
    type: [FormFieldType.Text, Validators.required],
    isRequired: [false],
    placeholder: [''],
    displayOrder: [0]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadForm(id);
    }
  }

  loadForm(id: string) {
    this.loading.set(true);
    this.svc.getById(id).subscribe({
      next: f => {
        this.form.set(f);
        this.metadataForm.patchValue({
          name: f.name,
          description: f.description ?? '',
          isActive: f.isActive
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goBack() {
    this.router.navigate(['/admin/forms']);
  }

  saveMetadata() {
    if (this.metadataForm.invalid) return;
    const f = this.form();
    if (!f) return;

    this.savingMeta = true;
    const val = this.metadataForm.value;

    this.svc.update(f.id, {
      name: val.name!,
      description: val.description ?? undefined,
      isActive: val.isActive!,
      fields: f.fields.map(field => this.toFieldInput(field))
    }).subscribe({
      next: updated => {
        this.savingMeta = false;
        this.form.set(updated);
        this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Detalhes do formulário atualizados.' });
      },
      error: () => { this.savingMeta = false; }
    });
  }

  addField() {
    this.editingField.set(null);
    this.fieldForm.reset({
      type: FormFieldType.Text,
      isRequired: false,
      displayOrder: this.fields().length
    });
    this.showFieldDialog = true;
  }

  editField(field: FormField) {
    this.editingField.set(field);
    this.fieldForm.patchValue({
      label: field.label,
      key: field.key,
      type: field.type,
      isRequired: field.isRequired,
      placeholder: field.placeholder ?? '',
      displayOrder: field.displayOrder
    });
    this.showFieldDialog = true;
  }

  autoFieldKey() {
    if (this.editingField()) return;
    const label = this.fieldForm.get('label')?.value ?? '';
    const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.fieldForm.get('key')?.setValue(key, { emitEvent: false });
  }

  saveField() {
    if (this.fieldForm.invalid) return;
    this.savingField = true;
    const val = this.fieldForm.value;
    const f = this.form();
    if (!f) return;

    const existing = this.editingField();
    const updatedFields: FormField[] = existing
      ? f.fields.map(field =>
          field.id === existing.id
            ? { ...field, label: val.label!, key: val.key!, type: val.type!, isRequired: val.isRequired!, placeholder: val.placeholder || undefined, displayOrder: val.displayOrder! }
            : field
        )
      : [
          ...f.fields,
          {
            id: crypto.randomUUID(),
            label: val.label!,
            key: val.key!,
            type: val.type!,
            isRequired: val.isRequired!,
            placeholder: val.placeholder || undefined,
            displayOrder: val.displayOrder!,
            optionsJson: undefined,
            validationJson: undefined,
            layoutJson: undefined
          }
        ];

    this.svc.update(f.id, {
      name: f.name,
      description: f.description,
      isActive: f.isActive,
      fields: updatedFields.map(field => this.toFieldInput(field))
    }).subscribe({
      next: updated => {
        this.savingField = false;
        this.showFieldDialog = false;
        this.form.set(updated);
        this.msg.add({ severity: 'success', summary: 'Salvo!', detail: existing ? 'Campo atualizado.' : 'Campo adicionado.' });
      },
      error: () => { this.savingField = false; }
    });
  }

  deleteField(field: FormField) {
    this.confirm.confirm({
      message: `Excluir o campo "${field.label}"?`,
      header: 'Confirmar',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const f = this.form();
        if (!f) return;
        const updatedFields = f.fields.filter(ff => ff.id !== field.id);
        this.svc.update(f.id, {
          name: f.name,
          description: f.description,
          isActive: f.isActive,
          fields: updatedFields.map(ff => this.toFieldInput(ff))
        }).subscribe({
          next: updated => {
            this.form.set(updated);
            this.msg.add({ severity: 'success', summary: `Campo "${field.label}" removido.` });
          }
        });
      }
    });
  }

  reorderFields(event: CdkDragDrop<FormField[]>) {
    const f = this.form();
    if (!f) return;
    const updatedFields = [...f.fields];
    moveItemInArray(updatedFields, event.previousIndex, event.currentIndex);
    // Update displayOrder to match new order
    const reordered = updatedFields.map((field, index) => ({ ...field, displayOrder: index }));
    this.form.set({ ...f, fields: reordered });
  }

  saveAllFields() {
    const f = this.form();
    if (!f) return;
    this.saving = true;

    this.svc.update(f.id, {
      name: f.name,
      description: f.description,
      isActive: f.isActive,
      fields: f.fields.map(field => this.toFieldInput(field))
    }).subscribe({
      next: updated => {
        this.saving = false;
        this.form.set(updated);
        this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Todos os campos foram salvos.' });
      },
      error: () => { this.saving = false; }
    });
  }

  publish() {
    const f = this.form();
    if (!f) return;
    this.svc.publish(f.id).subscribe({
      next: updated => {
        this.form.set(updated);
        this.msg.add({ severity: 'success', summary: 'Publicado!', detail: `Formulário "${updated.name}" publicado.` });
      }
    });
  }

  fieldTypeLabel(type: FormFieldType): string {
    return FIELD_TYPE_LABELS[type] ?? 'Desconhecido';
  }

  private toFieldInput(field: FormField): FormFieldInput {
    return {
      label: field.label,
      key: field.key,
      type: field.type,
      isRequired: field.isRequired,
      placeholder: field.placeholder,
      displayOrder: field.displayOrder,
      optionsJson: field.optionsJson,
      validationJson: field.validationJson,
      layoutJson: field.layoutJson
    };
  }
}
