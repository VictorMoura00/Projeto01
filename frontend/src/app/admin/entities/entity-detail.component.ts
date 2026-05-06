import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinitionWithFields, FieldDefinition, FIELD_TYPE_LABELS } from './entity.model';
import { FieldFormComponent } from './field-form.component';

@Component({
  selector: 'app-entity-detail',
  imports: [
    RouterLink, DragDropModule, ButtonModule, TagModule,
    DialogModule, ConfirmDialogModule, TooltipModule, FieldFormComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <a routerLink="/admin/entities" class="back-link">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Entidades
          </a>
          <span class="page-kicker">Campos da entidade</span>
          <h1 class="page-title">{{ entity()?.name ?? 'Carregando entidade' }}</h1>
          <p class="page-description">
            <code>{{ entity()?.slug ?? '...' }}</code>
            <span>Organize a ordem, obrigatoriedade e uso dos campos desta entidade.</span>
          </p>
        </div>
        <div class="page-actions">
          <p-button label="Adicionar campo" icon="pi pi-plus" (onClick)="openAddField()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de campos">
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
            <div>
              <strong class="toolbar-title">Estrutura dos campos</strong>
              <p class="toolbar-meta">Arraste as linhas para reordenar a sequência de apresentação.</p>
            </div>
          </div>

          <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="fields-list" aria-label="Campos reordenáveis">
            @for (field of e.fields; track field.id) {
              <div class="field-card" cdkDrag>
                <button class="drag-handle" type="button" cdkDragHandle aria-label="Arrastar campo">
                  <i class="pi pi-bars" aria-hidden="true"></i>
                </button>
                <div class="field-info">
                  <strong>{{ field.name }}</strong>
                  <code>{{ field.slug }}</code>
                </div>
                <p-tag [value]="fieldTypeLabel(field)" severity="info" />
                <div class="field-badges">
                  @if (field.isRequired) { <p-tag value="Obrigatório" severity="warn" /> }
                  @if (field.isSearchable) { <p-tag value="Buscável" severity="secondary" /> }
                  @if (field.isFilterable) { <p-tag value="Filtrável" severity="secondary" /> }
                </div>
                <div class="row-actions">
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar campo" pTooltip="Editar" (onClick)="openEditField(field)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Excluir campo" pTooltip="Excluir" (onClick)="confirmDeleteField(field)" />
                </div>
              </div>
            }
          </div>

          @if (e.fields.length === 0) {
            <div class="empty-state">
              <strong>Nenhum campo configurado</strong>
              Crie o primeiro campo para começar a estruturar esta entidade.
              <div class="empty-action">
                <p-button label="Adicionar primeiro campo" icon="pi pi-plus" [text]="true" (onClick)="openAddField()" />
              </div>
            </div>
          }
        </div>
      }
    </section>

    <p-dialog [(visible)]="showFieldForm"
              [header]="editingField() ? 'Editar Campo' : 'Novo Campo'"
              [modal]="true" [style]="{width:'34rem'}" [breakpoints]="{'640px': '94vw'}">
      <app-field-form
        [field]="editingField()"
        (saved)="onFieldSaved()"
        (cancelled)="showFieldForm = false"
        [entityId]="id()"
      />
    </p-dialog>
  `,
  styles: [`
    .back-link {
      align-items: center;
      color: var(--p-primary-color);
      display: inline-flex;
      font-size: 0.875rem;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      text-decoration: none;
    }

    .page-description {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
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
export class EntityDetailComponent implements OnInit {
  id = input.required<string>();

  private svc = inject(EntitiesService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  entity = signal<EntityDefinitionWithFields | null>(null);
  fieldCount = computed(() => this.entity()?.fields.length ?? 0);
  requiredCount = computed(() => this.entity()?.fields.filter(field => field.isRequired).length ?? 0);
  searchableCount = computed(() => this.entity()?.fields.filter(field => field.isSearchable).length ?? 0);
  showFieldForm = false;
  editingField = signal<FieldDefinition | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.svc.getById(this.id()).subscribe(e => this.entity.set(e));
  }

  fieldTypeLabel(field: FieldDefinition): string {
    return FIELD_TYPE_LABELS[field.fieldType] ?? 'Desconhecido';
  }

  openAddField() { this.editingField.set(null); this.showFieldForm = true; }
  openEditField(field: FieldDefinition) { this.editingField.set(field); this.showFieldForm = true; }

  onFieldSaved() { this.showFieldForm = false; this.load(); }

  onDrop(event: CdkDragDrop<FieldDefinition[]>) {
    const e = this.entity();
    if (!e) return;
    const fields = [...e.fields];
    moveItemInArray(fields, event.previousIndex, event.currentIndex);
    this.entity.set({ ...e, fields });
    this.svc.reorderFields(this.id(), fields.map(f => f.id)).subscribe({
      error: () => this.load()
    });
  }

  confirmDeleteField(field: FieldDefinition) {
    this.confirm.confirm({
      message: `Excluir o campo "${field.name}"?`,
      header: 'Confirmar',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.deleteField(this.id(), field.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: `Campo "${field.name}" removido.` }); this.load(); }
      })
    });
  }
}
