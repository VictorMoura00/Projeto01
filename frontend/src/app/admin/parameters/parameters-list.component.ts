import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ParametersService } from './parameters.service';
import { SystemParameter, ParameterType, ParameterScope, PARAMETER_TYPE_LABELS } from './parameter.model';

@Component({
  selector: 'app-parameters-list',
  imports: [
    ReactiveFormsModule, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, DialogModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="page-header">
      <h2>Parâmetros do Sistema</h2>
      <p-button label="Novo Parâmetro" icon="pi pi-plus" (onClick)="openCreate()" />
    </div>

    <p-table [value]="parameters()" [loading]="loading()" [rowGroupMode]="'subheader'"
             groupRowsBy="group" [sortField]="'group'" [sortOrder]="1"
             [tableStyle]="{'min-width': '60rem'}">
      <ng-template pTemplate="header">
        <tr>
          <th>Chave</th>
          <th>Valor</th>
          <th>Tipo</th>
          <th>Descrição</th>
          <th style="width:120px"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="rowgroupheader" let-row>
        <tr>
          <td colspan="5">
            <span class="group-header">{{ row.group ?? 'Geral' }}</span>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-param>
        <tr>
          <td><code>{{ param.key }}</code></td>
          <td class="value-cell">{{ param.value }}</td>
          <td><p-tag [value]="typeLabel(param.type)" severity="info" /></td>
          <td class="desc-cell">{{ param.description }}</td>
          <td>
            <div class="row-actions">
              <p-button icon="pi pi-pencil" size="small" [text]="true" [disabled]="param.isReadOnly" (onClick)="openEdit(param)" />
              <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" [disabled]="param.isReadOnly" (onClick)="confirmDelete(param)" />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--p-text-muted-color)">Nenhum parâmetro cadastrado.</td></tr>
      </ng-template>
    </p-table>

    <p-dialog [(visible)]="showForm" [header]="editing() ? 'Editar Parâmetro' : 'Novo Parâmetro'"
              [modal]="true" [style]="{width:'480px'}">
      <form [formGroup]="form" (ngSubmit)="submit()" class="param-form">
        @if (!editing()) {
          <div class="field">
            <label>Chave *</label>
            <input pInputText formControlName="key" placeholder="app.max_users" />
          </div>
          <div class="field">
            <label>Grupo</label>
            <input pInputText formControlName="group" placeholder="email" />
          </div>
          <div class="field">
            <label>Tipo *</label>
            <p-select formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="field">
            <label>Escopo *</label>
            <p-select formControlName="scope" [options]="scopeOptions" optionLabel="label" optionValue="value" />
          </div>
        }
        <div class="field">
          <label>Valor *</label>
          <input pInputText formControlName="value" />
        </div>
        <div class="field">
          <label>Descrição</label>
          <input pInputText formControlName="description" />
        </div>
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showForm = false" />
          <p-button label="Salvar" type="submit" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .group-header { font-weight: 700; color: var(--p-primary-color); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    code { background: var(--p-surface-100); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .value-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .desc-cell { max-width: 240px; color: var(--p-text-muted-color); font-size: 0.875rem; }
    .row-actions { display: flex; gap: 2px; }
    .param-form { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.5rem; }
  `]
})
export class ParametersListComponent implements OnInit {
  private svc = inject(ParametersService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  parameters = signal<SystemParameter[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = false;
  editing = signal<SystemParameter | null>(null);

  typeOptions = Object.entries(PARAMETER_TYPE_LABELS).map(([v, label]) => ({ value: Number(v), label }));
  scopeOptions = [{ value: 0, label: 'Global' }, { value: 1, label: 'Tenant' }];

  form = this.fb.group({
    key: ['', Validators.required],
    value: ['', Validators.required],
    group: [''],
    description: [''],
    type: [ParameterType.String, Validators.required],
    scope: [ParameterScope.Tenant, Validators.required],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: r => { this.parameters.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  typeLabel(t: ParameterType) { return PARAMETER_TYPE_LABELS[t] ?? 'Desconhecido'; }

  openCreate() {
    this.editing.set(null);
    this.form.reset({ type: ParameterType.String, scope: ParameterScope.Tenant });
    this.form.get('key')?.enable();
    this.showForm = true;
  }

  openEdit(p: SystemParameter) {
    this.editing.set(p);
    this.form.patchValue({ value: p.value, description: p.description ?? '' });
    this.form.get('key')?.disable();
    this.showForm = true;
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.getRawValue();
    const p = this.editing();

    const obs = p
      ? this.svc.update(p.id, val.value!, val.description ?? null)
      : this.svc.create({
          key: val.key!,
          value: val.value!,
          type: val.type!,
          group: val.group || null,
          description: val.description || null,
          scope: val.scope!,
          isReadOnly: false
        });

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm = false;
        this.msg.add({ severity: 'success', summary: 'Parâmetro salvo!' });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(p: SystemParameter) {
    this.confirm.confirm({
      message: `Excluir o parâmetro "${p.key}"?`,
      header: 'Confirmar',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(p.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Parâmetro removido.' }); this.load(); }
      })
    });
  }
}
