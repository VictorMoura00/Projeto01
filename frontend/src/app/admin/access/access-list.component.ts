import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccessService } from './access.service';
import { AppRole, PERMISSION_OPERATIONS, PERMISSION_LABELS } from './access.model';

interface PermissionRow { entitySlug: string; create: boolean; read: boolean; update: boolean; delete: boolean; }

@Component({
  selector: 'app-access-list',
  imports: [
    ReactiveFormsModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, DialogModule, ToggleSwitchModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="page-header">
      <h2>Controle de Acesso — Roles</h2>
      <p-button label="Nova Role" icon="pi pi-plus" (onClick)="openCreate()" />
    </div>

    <p-table [value]="roles()" [loading]="loading()" [tableStyle]="{'min-width':'50rem'}">
      <ng-template pTemplate="header">
        <tr>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Permissões</th>
          <th>Status</th>
          <th style="width:120px"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-role>
        <tr>
          <td><strong>{{ role.name }}</strong></td>
          <td class="desc-cell">{{ role.description }}</td>
          <td>
            <span class="perm-count">{{ role.permissions.length }} entidade(s)</span>
          </td>
          <td>
            @if (role.isSystemRole) {
              <p-tag value="Sistema" severity="info" />
            } @else if (role.isActive) {
              <p-tag value="Ativo" severity="success" />
            } @else {
              <p-tag value="Inativo" severity="secondary" />
            }
          </td>
          <td>
            <div class="row-actions">
              <p-button icon="pi pi-shield" size="small" [text]="true" title="Permissões" (onClick)="openPermissions(role)" />
              <p-button icon="pi pi-pencil" size="small" [text]="true" [disabled]="role.isSystemRole" (onClick)="openEdit(role)" />
              <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" [disabled]="role.isSystemRole" (onClick)="confirmDelete(role)" />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--p-text-muted-color)">Nenhuma role cadastrada.</td></tr>
      </ng-template>
    </p-table>

    <!-- Role Form Dialog -->
    <p-dialog [(visible)]="showRoleForm" [header]="editingRole() ? 'Editar Role' : 'Nova Role'"
              [modal]="true" [style]="{width:'420px'}">
      <form [formGroup]="roleForm" (ngSubmit)="submitRole()" class="role-form">
        <div class="field">
          <label>Nome *</label>
          <input pInputText formControlName="name" placeholder="Ex: Gestor" />
        </div>
        <div class="field">
          <label>Descrição</label>
          <input pInputText formControlName="description" />
        </div>
        @if (editingRole()) {
          <div class="field field-inline">
            <label>Ativo</label>
            <p-toggleswitch formControlName="isActive" />
          </div>
        }
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showRoleForm = false" />
          <p-button label="Salvar" (onClick)="submitRole()" [loading]="saving()" [disabled]="roleForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <!-- Permissions Dialog -->
    <p-dialog [(visible)]="showPermissions" header="Permissões da Role"
              [modal]="true" [style]="{width:'640px'}">
      @if (permissionRole()) {
        <div class="perm-header">
          <strong>{{ permissionRole()!.name }}</strong>
          <p-button label="Adicionar Entidade" icon="pi pi-plus" size="small" [text]="true" (onClick)="addPermissionRow()" />
        </div>
        <p-table [value]="permissionRows()" [tableStyle]="{'min-width':'500px'}">
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
              <td><input pInputText [(ngModel)]="permissionRows()[i].entitySlug" placeholder="ex: ticket" style="width:100%" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].create" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].read" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].update" /></td>
              <td style="text-align:center"><p-toggleswitch [(ngModel)]="permissionRows()[i].delete" /></td>
              <td><p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="removePermissionRow(i)" /></td>
            </tr>
          </ng-template>
        </p-table>
        <div class="form-actions" style="margin-top:1rem">
          <p-button label="Cancelar" [text]="true" (onClick)="showPermissions = false" />
          <p-button label="Salvar Permissões" [loading]="savingPerms()" (onClick)="savePermissions()" />
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .desc-cell { color: var(--p-text-muted-color); font-size: 0.875rem; }
    .perm-count { font-size: 0.875rem; color: var(--p-text-muted-color); }
    .row-actions { display: flex; gap: 2px; }
    .role-form { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .field-inline { flex-direction: row; align-items: center; justify-content: space-between; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .perm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  `]
})
export class AccessListComponent implements OnInit {
  private svc = inject(AccessService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  roles = signal<AppRole[]>([]);
  loading = signal(false);
  saving = signal(false);
  savingPerms = signal(false);

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
