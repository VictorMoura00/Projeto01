import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Configuração</span>
          <h1 class="page-title">Parâmetros do sistema</h1>
          <p class="page-description">Centralize valores de configuração, escopo e tipos para ajustes operacionais controlados.</p>
        </div>
        <div class="page-actions">
          <p-button label="Novo parâmetro" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de parâmetros">
        <div class="metric-card">
          <span class="metric-label">Total</span>
          <strong class="metric-value">{{ parameters().length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Grupos</span>
          <strong class="metric-value">{{ groupCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Somente leitura</span>
          <strong class="metric-value">{{ readOnlyCount() }}</strong>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-toolbar">
          <div>
            <strong class="toolbar-title">Parâmetros cadastrados</strong>
            <p class="toolbar-meta">Agrupados por contexto para facilitar auditoria e manutenção.</p>
          </div>
        </div>

        <p-table [value]="parameters()" [loading]="loading()" [rowGroupMode]="'subheader'"
                 groupRowsBy="group" [sortField]="'group'" [sortOrder]="1"
                 [tableStyle]="{'min-width': '60rem'}" rowHover styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Chave</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th class="actions-col">Ações</th>
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
              <td class="desc-cell">{{ param.description || 'Sem descrição' }}</td>
              <td>
                <div class="row-actions">
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar parâmetro" [disabled]="param.isReadOnly" (onClick)="openEdit(param)" />
                  <p-button icon="pi pi-trash" size="small" [text]="true" ariaLabel="Excluir parâmetro" severity="danger" [disabled]="param.isReadOnly" (onClick)="confirmDelete(param)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <strong>Nenhum parâmetro cadastrado</strong>
                  Crie parâmetros para controlar comportamento por escopo.
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <p-dialog [(visible)]="showForm" [header]="editing() ? 'Editar Parâmetro' : 'Novo Parâmetro'"
              [modal]="true" [style]="{width:'32rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="form" (ngSubmit)="submit()" class="param-form">
        @if (!editing()) {
          <div class="field">
            <label for="param-key">Chave *</label>
            <input id="param-key" pInputText formControlName="key" placeholder="app.max_users" autocomplete="off" />
          </div>
          <div class="field">
            <label for="param-group">Grupo</label>
            <input id="param-group" pInputText formControlName="group" placeholder="email" autocomplete="off" />
          </div>
          <div class="field">
            <label for="param-type">Tipo *</label>
            <p-select inputId="param-type" formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="field">
            <label for="param-scope">Escopo *</label>
            <p-select inputId="param-scope" formControlName="scope" [options]="scopeOptions" optionLabel="label" optionValue="value" />
          </div>
        }
        <div class="field">
          <label for="param-value">Valor *</label>
          <input id="param-value" pInputText formControlName="value" autocomplete="off" />
        </div>
        <div class="field">
          <label for="param-description">Descrição</label>
          <input id="param-description" pInputText formControlName="description" autocomplete="off" />
        </div>
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showForm = false" />
          <p-button label="Salvar" type="submit" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .group-header { font-weight: 700; color: var(--p-primary-color); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .value-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .desc-cell { max-width: 240px; color: var(--p-text-muted-color); font-size: 0.875rem; }
    .param-form { display: grid; gap: 1rem; }
    .actions-col { text-align: right; width: 8rem; }
  `]
})
export class ParametersListComponent implements OnInit {
  private svc = inject(ParametersService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  parameters = signal<SystemParameter[]>([]);
  groupCount = computed(() => new Set(this.parameters().map(parameter => parameter.group ?? 'Geral')).size);
  readOnlyCount = computed(() => this.parameters().filter(parameter => parameter.isReadOnly).length);
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
