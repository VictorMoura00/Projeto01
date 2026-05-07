import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DataTableComponent } from '../../shared/table/data-table.component';
import { TableColumn } from '../../shared/table/column.model';
import { EntitiesService } from './entities.service';
import { EntityDefinition } from './entity.model';
import { EntityFormComponent } from './entity-form.component';

@Component({
  selector: 'app-entities-list',
  imports: [
    FormsModule, ButtonModule, InputTextModule, TagModule,
    ConfirmDialogModule, DialogModule, TooltipModule,
    DataTableComponent, EntityFormComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Modelo de dados</span>
          <h1 class="page-title">Entidades</h1>
          <p class="page-description">Defina os objetos centrais do sistema. Exporte e importe estruturas como JSON.</p>
        </div>
        <div class="page-actions">
          <p-button label="Importar JSON" icon="pi pi-upload" severity="secondary" [text]="true" (onClick)="fileInput.click()" />
          <input #fileInput type="file" accept=".json" hidden (change)="onFileSelected($event)" />
          <p-button label="Nova entidade" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip">
        <div class="metric-card">
          <span class="metric-label">Total</span>
          <strong class="metric-value">{{ totalCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Ativas na página</span>
          <strong class="metric-value">{{ activeCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Campos na página</span>
          <strong class="metric-value">{{ fieldTotal() }}</strong>
        </div>
      </div>

      <app-data-table
        title="Catálogo de entidades"
        subtitle="Linhas paginadas. Arraste colunas para reordenar. Exporte estruturas como JSON."
        [columns]="columns"
        [data]="entities()"
        [loading]="loading()"
        [totalRecords]="totalCount()"
        [lazy]="true"
        [globalSearch]="true"
        [exportable]="true"
        [columnToggle]="true"
        [actionsTemplate]="actionsTpl"
        (onPage)="onPage($event)"
        (onSearch)="onSearch()"
      />

      <ng-template #actionsTpl let-entity>
        <p-button icon="pi pi-download" size="small" [text]="true" severity="help" ariaLabel="Exportar JSON" pTooltip="Exportar JSON" (onClick)="exportEntity(entity)" />
        <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar entidade" pTooltip="Editar" (onClick)="openEdit(entity)" />
        <p-button icon="pi pi-table" size="small" [text]="true" ariaLabel="Gerenciar campos" pTooltip="Gerenciar campos" (onClick)="openFields(entity)" />
        <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Excluir entidade" pTooltip="Excluir" (onClick)="confirmDelete(entity)" />
      </ng-template>
    </section>

    <p-dialog [(visible)]="showForm" [header]="editingEntity() ? 'Editar Entidade' : 'Nova Entidade'"
              [modal]="true" [style]="{width: '32rem'}" [breakpoints]="{'640px': '94vw'}">
      <app-entity-form [entity]="editingEntity()" (saved)="onSaved()" (cancelled)="showForm = false" />
    </p-dialog>
  `
})
export class EntitiesListComponent implements OnInit {
  private svc = inject(EntitiesService);
  private router = inject(Router);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  entities = signal<EntityDefinition[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  activeCount = computed(() => this.entities().filter(e => e.isActive).length);
  fieldTotal = computed(() => this.entities().reduce((t, e) => t + e.fieldCount, 0));
  showForm = false;
  editingEntity = signal<EntityDefinition | null>(null);
  private currentPage = 1;

  columns: TableColumn[] = [
    { field: 'name', header: 'Nome', sortable: true },
    { field: 'slug', header: 'Slug', type: 'code', sortable: true },
    { field: 'fieldCount', header: 'Campos', type: 'number' },
    { field: 'isActive', header: 'Status', type: 'tag' }
  ];

  ngOnInit() { this.load(); }

  load(page = 1) {
    this.loading.set(true);
    this.currentPage = page;
    this.svc.getAll(page, 20).subscribe({
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

  exportEntity(entity: EntityDefinition) {
    this.svc.export(entity.id).subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${entity.slug}.json`;
        a.click(); URL.revokeObjectURL(url);
        this.msg.add({ severity: 'success', summary: 'Exportado', detail: `${entity.name} salvo como ${entity.slug}.json` });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao exportar entidade.' })
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
            this.msg.add({ severity: 'success', summary: 'Importado', detail: `Entidade "${result.name}" criada.` });
            this.load(this.currentPage);
          },
          error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Falha ao importar.' })
        });
      } catch {
        this.msg.add({ severity: 'error', summary: 'JSON inválido', detail: 'O arquivo não é um JSON válido.' });
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  openCreate() { this.editingEntity.set(null); this.showForm = true; }
  openEdit(entity: EntityDefinition) { this.editingEntity.set(entity); this.showForm = true; }
  openFields(entity: EntityDefinition) { this.router.navigate(['/admin/entities', entity.id]); }
  onSaved() { this.showForm = false; this.load(this.currentPage); }

  confirmDelete(entity: EntityDefinition) {
    this.confirm.confirm({
      message: `Deseja excluir a entidade "${entity.name}"?`,
      header: 'Confirmar exclusão', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir', rejectLabel: 'Cancelar', acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(entity.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Excluído', detail: `Entidade "${entity.name}" removida.` }); this.load(this.currentPage); }
      })
    });
  }
}
