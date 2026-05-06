import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinition } from './entity.model';
import { EntityFormComponent } from './entity-form.component';

@Component({
  selector: 'app-entities-list',
  imports: [
    FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, EntityFormComponent
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="page-header">
      <h2>Entidades</h2>
      <p-button label="Nova Entidade" icon="pi pi-plus" (onClick)="openCreate()" />
    </div>

    <div class="search-bar">
      <input pInputText [(ngModel)]="search" placeholder="Buscar entidades..." (input)="onSearch()" />
    </div>

    <p-table
      [value]="entities()"
      [loading]="loading()"
      [paginator]="true"
      [rows]="20"
      [totalRecords]="totalCount()"
      [lazy]="true"
      (onLazyLoad)="onPage($event)"
      rowHover
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Nome</th>
          <th>Slug</th>
          <th>Campos</th>
          <th>Status</th>
          <th style="width:120px"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-entity>
        <tr>
          <td>
            <span class="entity-icon">{{ entity.icon || '📋' }}</span>
            {{ entity.name }}
          </td>
          <td><code>{{ entity.slug }}</code></td>
          <td>{{ entity.fieldCount }}</td>
          <td>
            <p-tag [value]="entity.isActive ? 'Ativo' : 'Inativo'"
                   [severity]="entity.isActive ? 'success' : 'secondary'" />
          </td>
          <td>
            <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="openEdit(entity)" />
            <p-button icon="pi pi-table" size="small" [text]="true" (onClick)="openFields(entity)" pTooltip="Gerenciar Campos" />
            <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="confirmDelete(entity)" />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="5" style="text-align:center">Nenhuma entidade encontrada.</td></tr>
      </ng-template>
    </p-table>

    <p-dialog [(visible)]="showForm" [header]="editingEntity() ? 'Editar Entidade' : 'Nova Entidade'"
              [modal]="true" [style]="{width: '480px'}">
      <app-entity-form
        [entity]="editingEntity()"
        (saved)="onSaved()"
        (cancelled)="showForm = false"
      />
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .search-bar { margin-bottom: 1rem; }
    .search-bar input { width: 320px; }
    .entity-icon { margin-right: 6px; }
    code { background: var(--p-surface-100); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  `]
})
export class EntitiesListComponent implements OnInit {
  private svc = inject(EntitiesService);
  private router = inject(Router);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  entities = signal<EntityDefinition[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  search = '';
  showForm = false;
  editingEntity = signal<EntityDefinition | null>(null);
  private currentPage = 1;

  ngOnInit() { this.load(); }

  load(page = 1) {
    this.loading.set(true);
    this.currentPage = page;
    this.svc.getAll(page, 20, this.search || undefined).subscribe({
      next: res => { this.entities.set(res.items); this.totalCount.set(res.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.load(1); }
  onPage(event: any) { this.load(Math.floor(event.first / event.rows) + 1); }

  openCreate() { this.editingEntity.set(null); this.showForm = true; }
  openEdit(entity: EntityDefinition) { this.editingEntity.set(entity); this.showForm = true; }
  openFields(entity: EntityDefinition) { this.router.navigate(['/admin/entities', entity.id]); }

  onSaved() { this.showForm = false; this.load(this.currentPage); }

  confirmDelete(entity: EntityDefinition) {
    this.confirm.confirm({
      message: `Deseja excluir a entidade "${entity.name}"? Esta ação não pode ser desfeita.`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(entity.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Excluído', detail: `Entidade "${entity.name}" removida.` }); this.load(this.currentPage); },
      })
    });
  }
}
