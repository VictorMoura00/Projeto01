import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinitionWithFields, FieldDefinition, FieldType, FIELD_TYPE_LABELS } from './entity.model';

@Component({
  selector: 'app-entity-detail',
  imports: [
    RouterLink, DragDropModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, SelectModule, TagModule,
    ToggleSwitchModule, DialogModule, ConfirmDialogModule, TooltipModule
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <a routerLink="/admin/entities" class="back-link">
            <i class="pi pi-arrow-left" aria-hidden="true"></i> Entidades
          </a>
          <span class="page-kicker">Campos da entidade</span>
          <h1 class="page-title">{{ entity()?.name ?? 'Carregando...' }}</h1>
          <p class="page-description">
            <code>{{ entity()?.slug }}</code>
            <span>Edite inline ou expanda para opções avançadas. Arraste para reordenar.</span>
          </p>
        </div>
        <div class="page-actions">
          <p-button label="Adicionar campo" icon="pi pi-plus" (onClick)="addQuickRow()" />
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-card">
          <span class="metric-label">Campos</span>
          <strong class="metric-value">{{ fieldCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Obrigatórios</span>
          <strong class="metric-value">{{ requiredCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Buscáveis</span>
          <strong class="metric-value">{{ searchableCount() }}</strong>
        </div>
      </div>

      @if (entity(); as e) {
        <div class="fields-panel">
          <div class="fields-header">
            <strong>Estrutura dos campos</strong>
            <span class="hint">Clique para editar inline. Expanda para opções avançadas.</span>
          </div>

          <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="fields-table-shell">
            <!-- header -->
            <div class="ft-row ft-header">
              <span class="ft-drag"></span>
              <span class="ft-name">Nome</span>
              <span class="ft-slug">Slug</span>
              <span class="ft-type">Tipo</span>
              <span class="ft-toggle">Obrig.</span>
              <span class="ft-toggle">Busca</span>
              <span class="ft-toggle">Filtro</span>
              <span class="ft-actions">Ações</span>
            </div>

            @for (field of e.fields; track field.id; let i = $index) {
              <div class="ft-row" cdkDrag [class.expanded]="expandedField() === field.id">
                <button class="drag-handle" type="button" cdkDragHandle aria-label="Arrastar">
                  <i class="pi pi-bars"></i>
                </button>

                <!-- Nome -->
                @if (editingInline() === field.id) {
                  <input class="ft-name ft-input" [(ngModel)]="editName" (keydown.enter)="saveInline(field)" (keydown.escape)="cancelInline()" />
                } @else {
                  <span class="ft-name" (click)="startInlineEdit(field)">{{ field.name }}</span>
                }

                <!-- Slug -->
                <code class="ft-slug">{{ field.slug }}</code>

                <!-- Tipo -->
                <p-select class="ft-type"
                  [ngModel]="field.fieldType"
                  (ngModelChange)="updateFieldType(field, $event)"
                  [options]="fieldTypeOptions"
                  optionLabel="label" optionValue="value"
                  appendTo="body" />

                <!-- Toggles inline -->
                <p-toggleswitch class="ft-toggle" [ngModel]="field.isRequired" (ngModelChange)="toggleField(field, 'isRequired', $event)" />
                <p-toggleswitch class="ft-toggle" [ngModel]="field.isSearchable" (ngModelChange)="toggleField(field, 'isSearchable', $event)" />
                <p-toggleswitch class="ft-toggle" [ngModel]="field.isFilterable" (ngModelChange)="toggleField(field, 'isFilterable', $event)" />

                <!-- Ações -->
                <div class="ft-actions row-actions">
                  <p-button icon="pi pi-cog" size="small" [text]="true" severity="help"
                    pTooltip="Opções avançadas" (onClick)="toggleExpand(field)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger"
                    pTooltip="Excluir" (onClick)="confirmDeleteField(field)" />
                </div>
              </div>

              <!-- Expanded: advanced options -->
              @if (expandedField() === field.id) {
                <div class="ft-advanced">
                  <div class="advanced-grid">
                    <div class="field">
                      <label>Valor padrão</label>
                      <input pInputText [ngModel]="field.defaultValue ?? ''"
                        (ngModelChange)="updateAdvanced(field, 'defaultValue', $event)" placeholder="Ex: Pendente" />
                    </div>
                    <div class="field">
                      <label>Opções (JSON)</label>
                      <input pInputText [ngModel]="field.optionsJson ?? ''"
                        (ngModelChange)="updateAdvanced(field, 'optionsJson', $event)" placeholder='["Alta","Média","Baixa"]' />
                    </div>
                    <div class="field full-width">
                      <label>Validação (JSON)</label>
                      <input pInputText [ngModel]="field.validationJson ?? ''"
                        (ngModelChange)="updateAdvanced(field, 'validationJson', $event)" placeholder='{"minLength":3,"maxLength":100}' />
                    </div>
                  </div>
                </div>
              }

              <!-- Divider between rows -->
              @if (i < e.fields.length - 1 || quickAddActive()) {
                <hr class="ft-divider" />
              }
            }

            <!-- Quick-add row -->
            @if (quickAddActive()) {
              <div class="ft-row ft-quick-add">
                <span class="drag-handle" style="visibility:hidden"><i class="pi pi-bars"></i></span>
                <input class="ft-name ft-input" [(ngModel)]="newFieldName" placeholder="Nome do campo" (keydown.enter)="saveQuickAdd()" (keydown.escape)="cancelQuickAdd()" />
                <input class="ft-slug ft-input" [(ngModel)]="newFieldSlug" placeholder="slug" (keydown.enter)="saveQuickAdd()" />
                <p-select class="ft-type" [(ngModel)]="newFieldType" [options]="fieldTypeOptions" optionLabel="label" optionValue="value" appendTo="body" />
                <span class="ft-toggle"></span>
                <span class="ft-toggle"></span>
                <span class="ft-toggle"></span>
                <div class="ft-actions row-actions">
                  <p-button icon="pi pi-check" size="small" [text]="true" severity="success" pTooltip="Salvar" (onClick)="saveQuickAdd()" />
                  <p-button icon="pi pi-times" size="small" [text]="true" severity="secondary" pTooltip="Cancelar" (onClick)="cancelQuickAdd()" />
                </div>
              </div>
            }

            @if (e.fields.length === 0 && !quickAddActive()) {
              <div class="empty-state">
                <strong>Nenhum campo configurado</strong>
                Clique em "Adicionar campo" para criar o primeiro.
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .fields-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--app-panel-border); }
    .hint { color: var(--app-muted); font-size: 0.8125rem; }

    .fields-table-shell { border: 1px solid var(--app-panel-border); border-radius: 8px; }
    .ft-row { display: grid; grid-template-columns: 2rem minmax(7rem,1.5fr) minmax(5rem,1fr) 9rem 3rem 3rem 3rem 5.5rem; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; transition: background 150ms; }
    .ft-row:hover { background: var(--p-surface-50); }
    .ft-header { background: var(--p-surface-100); font-size: 0.75rem; font-weight: 700; color: var(--app-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 0.5rem 0.75rem; }
    .ft-quick-add { background: color-mix(in srgb, var(--p-primary-color) 5%, transparent); }
    .ft-drag { text-align: center; }
    .ft-name { font-weight: 600; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ft-slug { font-size: 0.8125rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ft-type { font-size: 0.8125rem; }
    .ft-toggle { display: flex; justify-content: center; }
    .ft-actions { display: flex; justify-content: flex-end; }
    .ft-input { width: 100%; padding: 0.25rem 0.5rem; border: 1px solid var(--p-primary-color); border-radius: 4px; font-size: 0.875rem; outline: none; }
    .ft-divider { margin: 0; border: 0; border-top: 1px solid var(--app-panel-border); }

    .ft-row:first-child { border-radius: 8px 8px 0 0; }
    .fields-table-shell > :last-child:not(.ft-advanced) { border-radius: 0 0 8px 8px; }
    .ft-advanced { padding: 0.75rem 1rem 0.75rem 2.5rem; background: var(--p-surface-50); border-radius: 0 0 8px 8px; }
    .advanced-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .advanced-grid .full-width { grid-column: 1 / -1; }
    .advanced-grid label { display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.25rem; color: var(--app-muted); text-transform: uppercase; }

    .back-link { align-items: center; color: var(--p-primary-color); display: inline-flex; font-size: 0.875rem; gap: 0.4rem; margin-bottom: 0.75rem; text-decoration: none; }
    .drag-handle { align-items: center; background: transparent; border: 0; color: var(--app-muted); cursor: grab; display: inline-flex; height: 2rem; justify-content: center; width: 2rem; }
    .cdk-drag-preview { box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 6px; background: white; }
    .cdk-drag-placeholder { opacity: 0.4; }
    .page-description { align-items: center; display: flex; flex-wrap: wrap; gap: 0.5rem; }

    @media (max-width: 860px) {
      .ft-row, .ft-header { grid-template-columns: 2rem 1fr 5rem 3.5rem; }
      .ft-slug, .ft-type, .ft-toggle { display: none; }
      .ft-header .ft-slug, .ft-header .ft-type, .ft-header .ft-toggle { display: none; }
    }
  `]
})
export class EntityDetailComponent implements OnInit {
  id = input.required<string>();

  private svc = inject(EntitiesService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  entity = signal<EntityDefinitionWithFields | null>(null);
  fieldCount = computed(() => this.entity()?.fields.length ?? 0);
  requiredCount = computed(() => this.entity()?.fields.filter(f => f.isRequired).length ?? 0);
  searchableCount = computed(() => this.entity()?.fields.filter(f => f.isSearchable).length ?? 0);

  fieldTypeOptions = Object.entries(FIELD_TYPE_LABELS).map(([v, label]) => ({ value: Number(v), label }));

  // Inline edit
  editingInline = signal<string | null>(null);
  editName = '';

  // Expand
  expandedField = signal<string | null>(null);

  // Quick add
  quickAddActive = signal(false);
  newFieldName = '';
  newFieldSlug = '';
  newFieldType: FieldType = FieldType.Text;

  ngOnInit() { this.load(); }

  load() {
    this.svc.getById(this.id()).subscribe(e => this.entity.set(e));
  }

  // ── Inline edit ──
  startInlineEdit(field: FieldDefinition) {
    this.editingInline.set(field.id);
    this.editName = field.name;
    setTimeout(() => {
      const input = document.querySelector('.ft-row .ft-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  saveInline(field: FieldDefinition) {
    if (!this.editName.trim()) { this.cancelInline(); return; }
    this.svc.updateField(this.id(), field.id, { name: this.editName.trim() }).subscribe({
      next: () => { this.editingInline.set(null); this.load(); },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao salvar nome.' })
    });
  }

  cancelInline() { this.editingInline.set(null); }

  // ── Inline toggles ──
  toggleField(field: FieldDefinition, prop: 'isRequired' | 'isSearchable' | 'isFilterable', value: boolean) {
    this.svc.updateField(this.id(), field.id, { [prop]: value }).subscribe({
      next: () => this.load(),
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao atualizar.' })
    });
  }

  updateFieldType(field: FieldDefinition, value: FieldType) {
    this.svc.updateField(this.id(), field.id, { fieldType: value }).subscribe({
      next: () => this.load()
    });
  }

  // ── Advanced options ──
  toggleExpand(field: FieldDefinition) {
    this.expandedField.set(this.expandedField() === field.id ? null : field.id);
  }

  updateAdvanced(field: FieldDefinition, prop: 'defaultValue' | 'optionsJson' | 'validationJson', value: string) {
    this.svc.updateField(this.id(), field.id, { [prop]: value || null }).subscribe({
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao salvar.' })
    });
  }

  // ── Quick add ──
  addQuickRow() { this.quickAddActive.set(true); }

  saveQuickAdd() {
    if (!this.newFieldName.trim() || !this.newFieldSlug.trim()) return;
    this.svc.createField(this.id(), {
      name: this.newFieldName.trim(),
      slug: this.newFieldSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      fieldType: this.newFieldType,
      isRequired: false,
      isSearchable: false,
      isFilterable: false
    }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Campo adicionado.' });
        this.newFieldName = ''; this.newFieldSlug = ''; this.newFieldType = FieldType.Text;
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro ao criar campo.' })
    });
  }

  cancelQuickAdd() { this.quickAddActive.set(false); this.newFieldName = ''; this.newFieldSlug = ''; }

  // ── Drag & drop ──
  onDrop(event: CdkDragDrop<FieldDefinition[]>) {
    const e = this.entity();
    if (!e) return;
    const fields = [...e.fields];
    moveItemInArray(fields, event.previousIndex, event.currentIndex);
    this.entity.set({ ...e, fields });
    this.svc.reorderFields(this.id(), fields.map(f => f.id)).subscribe({ error: () => this.load() });
  }

  // ── Delete ──
  confirmDeleteField(field: FieldDefinition) {
    this.confirm.confirm({
      message: `Excluir o campo "${field.name}"?`,
      header: 'Confirmar', acceptLabel: 'Excluir', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.deleteField(this.id(), field.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: `Campo removido.` }); this.load(); }
      })
    });
  }
}
