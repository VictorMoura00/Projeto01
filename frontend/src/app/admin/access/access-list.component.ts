import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccessService } from './access.service';
import { AppRole } from './access.model';

interface PermissionRow { entitySlug: string; create: boolean; read: boolean; update: boolean; delete: boolean; }

@Component({
  selector: 'app-access-list',
  imports: [
    FormsModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, DialogModule, ToggleSwitchModule, ConfirmDialogModule, MultiSelectModule
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Segurança</span>
          <h1 class="page-title">Controle de acesso</h1>
          <p class="page-description">Gerencie roles e permissões por entidade com leitura rápida de status e escopo.</p>
        </div>
        <div class="page-actions">
          <p-button label="Nova role" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de roles">
        <div class="metric-card">
          <span class="metric-label">Roles</span>
          <strong class="metric-value">{{ roles().length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Sistema</span>
          <strong class="metric-value">{{ systemRoleCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Permissões</span>
          <strong class="metric-value">{{ permissionCount() }}</strong>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-toolbar">
          <div>
            <strong class="toolbar-title">Roles cadastradas</strong>
            <p class="toolbar-meta">Roles de sistema ficam protegidas. Arraste colunas para reordenar.</p>
          </div>
          <p-multiSelect
            [options]="columnOptions"
            [(ngModel)]="visibleColumns"
            placeholder="Colunas"
            styleClass="column-select"
          />
        </div>

        <p-table [value]="roles()" [loading]="loading()" [reorderableColumns]="true" [resizableColumns]="true"
                 [tableStyle]="{'min-width':'50rem'}" rowHover styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              @if (colVisible('name')) { <th pResizableColumn>Nome</th> }
              @if (colVisible('description')) { <th>Descrição</th> }
              @if (colVisible('permissions')) { <th>Permissões</th> }
              @if (colVisible('status')) { <th>Status</th> }
              <th class="actions-col">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-role>
            <tr>
              @if (colVisible('name')) { <td><strong>{{ role.name }}</strong></td> }
              @if (colVisible('description')) { <td class="desc-cell">{{ role.description || 'Sem descrição' }}</td> }
              @if (colVisible('permissions')) { <td><span class="perm-count">{{ role.permissions.length }} entidade(s)</span></td> }
              @if (colVisible('status')) {
              <td>
                @if (role.isSystemRole) {
                  <p-tag value="Sistema" severity="info" />
                } @else if (role.isActive) {
                  <p-tag value="Ativo" severity="success" />
                } @else {
                  <p-tag value="Inativo" severity="secondary" />
                }
              </td>
              }
              <td>
                <div class="row-actions">
                  <p-button icon="pi pi-shield" size="small" [text]="true" ariaLabel="Editar permissões" title="Permissões" (onClick)="openPermissions(role)" />
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar role" [disabled]="role.isSystemRole" (onClick)="openEdit(role)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" ariaLabel="Excluir role" severity="danger" [disabled]="role.isSystemRole" (onClick)="confirmDelete(role)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <strong>Nenhuma role cadastrada</strong>
                  Crie roles para segmentar permissões por operação.
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <!-- Role Form Dialog -->
    <p-dialog [(visible)]="showRoleForm" [header]="editingRole() ? 'Editar Role' : 'Nova Role'"
              [modal]="true" [style]="{width:'30rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="roleForm" (ngSubmit)="submitRole()" class="role-form">
        <div class="field">
          <label for="role-name">Nome *</label>
          <input id="role-name" pInputText formControlName="name" placeholder="Ex: Gestor" autocomplete="off" />
        </div>
        <div class="field">
          <label for="role-description">Descrição</label>
          <input id="role-description" pInputText formControlName="description" autocomplete="off" />
        </div>
        @if (editingRole()) {
          <div class="field field-inline">
            <label>Ativo</label>
            <p-toggleswitch formControlName="isActive" />
          </div>
        }
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showRoleForm = false" />
          <p-button label="Salvar" type="submit" [loading]="saving()" [disabled]="roleForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <!-- Permissions Dialog -->
    <p-dialog [(visible)]="showPermissions" header="Permissões da Role"
              [modal]="true" [style]="{width:'44rem'}" [breakpoints]="{'760px': '94vw'}">
      @if (permissionRole()) {
        <div class="perm-header">
          <div>
            <strong>{{ permissionRole()!.name }}</strong>
            <p>Defina operações permitidas por slug de entidade.</p>
          </div>
          <p-button label="Adicionar Entidade" icon="pi pi-plus" size="small" [text]="true" (onClick)="addPermissionRow()" />
        </div>
        <div class="table-shell permission-table">
        <p-table [value]="permissionRows()" [tableStyle]="{'min-width':'500px'}" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Slug da Entidade</th>
              <th style="text-align:center">Criar</th>
              <th style="text-align:center">Ler</th>
              <th style="text-align:center">Editar</th>
              <th style="text-align:center">Excluir</th>
              <th style="width:40px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row let-i="rowIndex">
            <tr>
              <td><input pInputText [(ngModel)]="permissionRows()[i].entitySlug" placeholder="ex: ticket" aria-label="Slug da entidade" style="width:100%" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].create" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].read" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].update" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].delete" /></td>
              <td><p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" ariaLabel="Remover linha de permissão" (onClick)="removePermissionRow(i)" /></td>
            </tr>
          </ng-template>
        </p-table>
        </div>
        <div class="form-actions permissions-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showPermissions = false" />
          <p-button label="Salvar Permissões" [loading]="savingPerms()" (onClick)="savePermissions()" />
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    .desc-cell { color: var(--p-text-muted-color); font-size: 0.875rem; }
    .perm-count { font-size: 0.875rem; color: var(--p-text-muted-color); }
    .role-form { display: grid; gap: 1rem; }
    .perm-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; }
    .perm-header p { color: var(--app-muted); font-size: 0.875rem; margin-top: 0.25rem; }
    .permission-table { overflow-x: auto; }
    .permissions-actions { margin-top: 1rem; }
    .actions-col { text-align: right; width: 8rem; }
  `]
})
export class AccessListComponent implements OnInit {
  private svc = inject(AccessService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  roles = signal<AppRole[]>([]);
  systemRoleCount = computed(() => this.roles().filter(role => role.isSystemRole).length);
  permissionCount = computed(() => this.roles().reduce((total, role) => total + role.permissions.length, 0));
  loading = signal(false);
  saving = signal(false);
  savingPerms = signal(false);

  columnOptions = [
    { label: 'Nome', value: 'name' },
    { label: 'Descrição', value: 'description' },
    { label: 'Permissões', value: 'permissions' },
    { label: 'Status', value: 'status' }
  ];
  visibleColumns: string[] = ['name', 'description', 'permissions', 'status'];

  showRoleForm = false;
  editingRole = signal<AppRole | null>(null);

  showPermissions = false;
  permissionRole = signal<AppRole | null>(null);
  permissionRows = signal<PermissionRow[]>([]);

  roleForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true]
  });

  ngOnInit() { this.load(); }

  colVisible(field: string) { return this.visibleColumns.includes(field); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: r => { this.roles.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingRole.set(null);
    this.roleForm.reset({ isActive: true });
    this.showRoleForm = true;
  }

  openEdit(role: AppRole) {
    this.editingRole.set(role);
    this.roleForm.patchValue({ name: role.name, description: role.description ?? '', isActive: role.isActive });
    this.showRoleForm = true;
  }

  submitRole() {
    if (this.roleForm.invalid) return;
    this.saving.set(true);
    const val = this.roleForm.getRawValue();
    const r = this.editingRole();

    const obs = r
      ? this.svc.update(r.id, { name: val.name!, description: val.description ?? null, isActive: val.isActive! })
      : this.svc.create({ name: val.name!, description: val.description ?? null });

    obs.subscribe({
      next: () => { this.saving.set(false); this.showRoleForm = false; this.msg.add({ severity: 'success', summary: 'Role salva!' }); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  openPermissions(role: AppRole) {
    this.permissionRole.set(role);
    this.permissionRows.set(role.permissions.map(p => ({
      entitySlug: p.entitySlug,
      create: (p.operations & 1) !== 0,
      read: (p.operations & 2) !== 0,
      update: (p.operations & 4) !== 0,
      delete: (p.operations & 8) !== 0,
    })));
    this.showPermissions = true;
  }

  addPermissionRow() {
    this.permissionRows.update(rows => [...rows, { entitySlug: '', create: false, read: true, update: false, delete: false }]);
  }

  removePermissionRow(i: number) {
    this.permissionRows.update(rows => rows.filter((_, idx) => idx !== i));
  }

  savePermissions() {
    const role = this.permissionRole();
    if (!role) return;
    this.savingPerms.set(true);
    const permissions = this.permissionRows()
      .filter(r => r.entitySlug.trim())
      .map(r => ({
        entitySlug: r.entitySlug,
        operations: (r.create ? 1 : 0) | (r.read ? 2 : 0) | (r.update ? 4 : 0) | (r.delete ? 8 : 0)
      }));

    this.svc.setPermissions(role.id, permissions).subscribe({
      next: () => { this.savingPerms.set(false); this.showPermissions = false; this.msg.add({ severity: 'success', summary: 'Permissões salvas!' }); this.load(); },
      error: () => this.savingPerms.set(false)
    });
  }

  confirmDelete(role: AppRole) {
    this.confirm.confirm({
      message: `Excluir a role "${role.name}"?`,
      header: 'Confirmar',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(role.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Role removida.' }); this.load(); }
      })
    });
  }
}
