import { Component, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinitionWithFields, FieldDefinition, FIELD_TYPE_LABELS } from './entity.model';
import { FieldFormComponent } from './field-form.component';

@Component({
  selector: 'app-entity-detail',
  imports: [
    RouterLink, DragDropModule, ButtonModule, TagModule,
    DialogModule, ConfirmDialogModule, FieldFormComponent
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="page-header">
      <div>
        <a routerLink="/admin/entities" class="back-link">← Entidades</a>
        <h2>{{ entity()?.icon }} {{ entity()?.name }}</h2>
        <code>{{ entity()?.slug }}</code>
      </div>
      <p-button label="Adicionar Campo" icon="pi pi-plus" (onClick)="openAddField()" />
    </div>

    @if (entity(); as e) {
      <div class="fields-panel">
        <div class="fields-header">
          <span>{{ e.fields.length }} campo(s) — arraste para reordenar</span>
        </div>

        <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="fields-list">
          @for (field of e.fields; track field.id) {
            <div class="field-card" cdkDrag>
              <span class="drag-handle" cdkDragHandle>⠿</span>
              <div class="field-info">
                <strong>{{ field.name }}</strong>
                <code>{{ field.slug }}</code>
              </div>
              <p-tag [value]="fieldTypeLabel(field)" severity="info" />
              <div class="field-badges">
                @if (field.isRequired) { <p-tag value="Obrigatório" severity="warn" /> }
                @if (field.isSearchable) { <p-tag value="Buscável" severity="secondary" /> }
              </div>
              <div class="field-actions">
                <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="openEditField(field)" />
                <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="confirmDeleteField(field)" />
              </div>
            </div>
          }
        </div>

        @if (e.fields.length === 0) {
          <div class="empty-fields">
            <p>Nenhum campo configurado ainda.</p>
            <p-button label="Adicionar primeiro campo" [text]="true" (onClick)="openAddField()" />
          </div>
        }
      </div>
    }

    <p-dialog [(visible)]="showFieldForm"
              [header]="editingField() ? 'Editar Campo' : 'Novo Campo'"
              [modal]="true" [style]="{width:'520px'}">
      <app-field-form
        [field]="editingField()"
        (saved)="onFieldSaved()"
        (cancelled)="showFieldForm = false"
        [entityId]="id()"
      />
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .back-link { font-size: 0.875rem; color: var(--p-primary-color); text-decoration: none; display: block; margin-bottom: 0.25rem; }
    code { background: var(--p-surface-100); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .fields-panel { background: white; border-radius: 8px; border: 1px solid var(--p-surface-200); }
    .fields-header { padding: 0.75rem 1rem; border-bottom: 1px solid var(--p-surface-200); font-size: 0.875rem; color: var(--p-text-muted-color); }
    .fields-list { padding: 0.5rem; display: flex; flex-direction: column; gap: 4px; }
    .field-card { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--p-surface-50); border-radius: 6px; border: 1px solid var(--p-surface-200); }
    .drag-handle { cursor: grab; color: var(--p-text-muted-color); font-size: 1.2rem; }
    .field-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .field-badges { display: flex; gap: 4px; flex-wrap: wrap; }
    .field-actions { display: flex; gap: 2px; }
    .empty-fields { padding: 2rem; text-align: center; color: var(--p-text-muted-color); }
    .cdk-drag-preview { box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 6px; }
    .cdk-drag-placeholder { opacity: 0.4; }
  `]
})
export class EntityDetailComponent implements OnInit {
  id = input.required<string>();

  private svc = inject(EntitiesService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  entity = signal<EntityDefinitionWithFields | null>(null);
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
