import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinition } from './entity.model';
import { EntityFormComponent } from './entity-form.component';

@Component({
  selector: 'app-entities-list',
  imports: [
    FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule, EntityFormComponent
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
          <p class="page-description">Defina os objetos centrais do sistema, seus slugs e a quantidade de campos configurados.</p>
        </div>
        <div class="page-actions">
          <p-button label="Nova entidade" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de entidades">
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

      <div class="table-shell">
        <div class="table-toolbar">
          <div>
            <strong class="toolbar-title">Catálogo de entidades</strong>
            <p class="toolbar-meta">Linhas paginadas com ações rápidas de campos, edição e exclusão.</p>
          </div>
          <label class="search-control">
            <span class="pi pi-search" aria-hidden="true"></span>
            <input pInputText [(ngModel)]="search" placeholder="Buscar por nome ou slug" aria-label="Buscar entidades" (input)="onSearch()" />
          </label>
        </div>

        <p-table
          [value]="entities()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="20"
          [totalRecords]="totalCount()"
          [lazy]="true"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onLazyLoad)="onPage($event)"
          rowHover
          styleClass="p-datatable-sm"
          [tableStyle]="{'min-width': '56rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Campos</th>
              <th>Status</th>
              <th class="actions-col">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-entity>
            <tr>
              <td>
                <span class="entity-name">
                  <span class="entity-mark"><i class="pi pi-database" aria-hidden="true"></i></span>
                  <span>
                    <strong>{{ entity.name }}</strong>
                    @if (entity.description) {
                      <small>{{ entity.description }}</small>
                    }
                  </span>
                </span>
              </td>
              <td><code>{{ entity.slug }}</code></td>
              <td><span class="field-count">{{ entity.fieldCount }}</span></td>
              <td>
                <p-tag [value]="entity.isActive ? 'Ativo' : 'Inativo'"
                       [severity]="entity.isActive ? 'success' : 'secondary'" />
              </td>
              <td>
                <div class="row-actions">
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar entidade" pTooltip="Editar" (onClick)="openEdit(entity)" />
                  <p-button icon="pi pi-table" size="small" [text]="true" ariaLabel="Gerenciar campos" pTooltip="Gerenciar campos" (onClick)="openFields(entity)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Excluir entidade" pTooltip="Excluir" (onClick)="confirmDelete(entity)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <strong>Nenhuma entidade encontrada</strong>
                  Ajuste a busca ou crie uma nova entidade para começar.
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <p-dialog [(visible)]="showForm" [header]="editingEntity() ? 'Editar Entidade' : 'Nova Entidade'"
              [modal]="true" [style]="{width: '32rem'}" [breakpoints]="{'640px': '94vw'}">
      <app-entity-form
        [entity]="editingEntity()"
        (saved)="onSaved()"
        (cancelled)="showForm = false"
      />
    </p-dialog>
  `,
  styles: [`
    .entity-name {
      align-items: center;
      display: flex;
    }

    .entity-name strong,
    .entity-name small {
      display: block;
    }

    .entity-name small {
      color: var(--app-muted);
      font-size: 0.8125rem;
      margin-top: 0.15rem;
      max-width: 34rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .field-count {
      color: var(--app-text);
      font-weight: 700;
    }

    .actions-col {
      text-align: right;
      width: 9rem;
    }
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
  activeCount = computed(() => this.entities().filter(entity => entity.isActive).length);
  fieldTotal = computed(() => this.entities().reduce((total, entity) => total + entity.fieldCount, 0));
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
  onPage(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? 20;
    this.load(Math.floor(first / rows) + 1);
  }

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
