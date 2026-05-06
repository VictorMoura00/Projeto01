import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WhiteLabelService } from './white-label.service';
import { Tenant, TenantTheme } from './white-label.model';

@Component({
  selector: 'app-white-label',
  imports: [
    ReactiveFormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, DialogModule, ToggleSwitchModule, ColorPickerModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="page-header">
      <h2>White Label — Tenants</h2>
      <p-button label="Novo Tenant" icon="pi pi-plus" (onClick)="openCreate()" />
    </div>

    <p-table [value]="tenants()" [loading]="loading()" [tableStyle]="{'min-width':'40rem'}">
      <ng-template pTemplate="header">
        <tr>
          <th>Nome</th>
          <th>Slug</th>
          <th>Cores</th>
          <th>Status</th>
          <th style="width:120px"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-tenant>
        <tr>
          <td><strong>{{ tenant.name }}</strong></td>
          <td><code>{{ tenant.slug }}</code></td>
          <td>
            <div class="color-swatches">
              <span class="swatch" [style.background]="tenant.theme.primaryColor" title="Primária"></span>
              <span class="swatch" [style.background]="tenant.theme.secondaryColor" title="Secundária"></span>
              <span class="swatch" [style.background]="tenant.theme.accentColor" title="Destaque"></span>
            </div>
          </td>
          <td>
            <p-tag [value]="tenant.isActive ? 'Ativo' : 'Inativo'" [severity]="tenant.isActive ? 'success' : 'secondary'" />
          </td>
          <td>
            <div class="row-actions">
              <p-button icon="pi pi-palette" size="small" [text]="true" title="Editar tema" (onClick)="openTheme(tenant)" />
              <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="openEdit(tenant)" />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--p-text-muted-color)">Nenhum tenant cadastrado.</td></tr>
      </ng-template>
    </p-table>

    <!-- Tenant Form Dialog -->
    <p-dialog [(visible)]="showTenantForm" [header]="editingTenant() ? 'Editar Tenant' : 'Novo Tenant'"
              [modal]="true" [style]="{width:'440px'}">
      <form [formGroup]="tenantForm" (ngSubmit)="submitTenant()" class="tenant-form">
        <div class="field">
          <label>Nome *</label>
          <input pInputText formControlName="name" placeholder="Ex: Acme Corp" (input)="autoSlug()" />
        </div>
        @if (!editingTenant()) {
          <div class="field">
            <label>Slug *</label>
            <input pInputText formControlName="slug" placeholder="acme-corp" />
            <small>Usado na URL. Apenas letras minúsculas e hífens.</small>
          </div>
        }
        <div class="field">
          <label>URL do Logo</label>
          <input pInputText formControlName="logoUrl" placeholder="https://..." />
        </div>
        <div class="field">
          <label>URL do Favicon</label>
          <input pInputText formControlName="faviconUrl" placeholder="https://..." />
        </div>
        @if (editingTenant()) {
          <div class="field field-inline">
            <label>Ativo</label>
            <p-toggleswitch formControlName="isActive" />
          </div>
        }
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showTenantForm = false" />
          <p-button label="Salvar" type="submit" [loading]="saving()" [disabled]="tenantForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <!-- Theme Dialog -->
    <p-dialog [(visible)]="showThemeForm" header="Editar Tema"
              [modal]="true" [style]="{width:'480px'}">
      @if (themeTarget()) {
        <form [formGroup]="themeForm" (ngSubmit)="submitTheme()" class="theme-form">
          <p class="theme-target-name">{{ themeTarget()!.name }}</p>
          <div class="color-grid">
            <div class="color-field">
              <label>Cor Primária</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="primaryColor" format="hex" />
                <input pInputText formControlName="primaryColor" style="width:100px" />
              </div>
            </div>
            <div class="color-field">
              <label>Cor Secundária</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="secondaryColor" format="hex" />
                <input pInputText formControlName="secondaryColor" style="width:100px" />
              </div>
            </div>
            <div class="color-field">
              <label>Cor de Destaque</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="accentColor" format="hex" />
                <input pInputText formControlName="accentColor" style="width:100px" />
              </div>
            </div>
            <div class="color-field">
              <label>Superfície</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="surfaceColor" format="hex" />
                <input pInputText formControlName="surfaceColor" style="width:100px" />
              </div>
            </div>
          </div>
          <div class="field" style="margin-top:1rem">
            <label>Fonte</label>
            <input pInputText formControlName="fontFamily" placeholder="Inter, sans-serif" />
          </div>
          <div class="theme-preview" [style.background]="themeForm.get('primaryColor')?.value">
            <span [style.color]="themeForm.get('surfaceColor')?.value">Preview da cor primária</span>
          </div>
          <div class="form-actions" style="margin-top:1rem">
            <p-button label="Cancelar" [text]="true" (onClick)="showThemeForm = false" />
            <p-button label="Salvar Tema" type="submit" [loading]="savingTheme()" />
          </div>
        </form>
      }
    </p-dialog>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    code { background: var(--p-surface-100); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .color-swatches { display: flex; gap: 4px; }
    .swatch { width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--p-surface-300); display: inline-block; }
    .row-actions { display: flex; gap: 2px; }
    .tenant-form, .theme-form { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .field small { color: var(--p-text-muted-color); font-size: 0.75rem; }
    .field-inline { flex-direction: row; align-items: center; justify-content: space-between; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .color-field { display: flex; flex-direction: column; gap: 4px; }
    .color-field label { font-weight: 500; font-size: 0.875rem; }
    .color-input-row { display: flex; align-items: center; gap: 0.5rem; }
    .theme-preview { padding: 0.75rem 1rem; border-radius: 6px; margin-top: 0.5rem; text-align: center; font-weight: 500; transition: background 0.2s; }
    .theme-target-name { font-weight: 600; color: var(--p-primary-color); margin: 0 0 0.5rem; }
  `]
})
export class WhiteLabelComponent implements OnInit {
  private svc = inject(WhiteLabelService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);

  tenants = signal<Tenant[]>([]);
  loading = signal(false);
  saving = signal(false);
  savingTheme = signal(false);

  showTenantForm = false;
  editingTenant = signal<Tenant | null>(null);

  showThemeForm = false;
  themeTarget = signal<Tenant | null>(null);

  tenantForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    logoUrl: [''],
    faviconUrl: [''],
    isActive: [true]
  });

  themeForm = this.fb.group({
    primaryColor: ['#1976D2'],
    secondaryColor: ['#424242'],
    accentColor: ['#82B1FF'],
    surfaceColor: ['#FFFFFF'],
    fontFamily: ['Inter, sans-serif']
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: r => { this.tenants.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  autoSlug() {
    if (this.editingTenant()) return;
    const name = this.tenantForm.get('name')?.value ?? '';
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.tenantForm.get('slug')?.setValue(slug, { emitEvent: false });
  }

  openCreate() {
    this.editingTenant.set(null);
    this.tenantForm.reset({ isActive: true });
    this.tenantForm.get('slug')?.enable();
    this.showTenantForm = true;
  }

  openEdit(t: Tenant) {
    this.editingTenant.set(t);
    this.tenantForm.patchValue({ name: t.name, logoUrl: t.logoUrl ?? '', faviconUrl: t.faviconUrl ?? '', isActive: t.isActive });
    this.tenantForm.get('slug')?.disable();
    this.showTenantForm = true;
  }

  submitTenant() {
    if (this.tenantForm.invalid) return;
    this.saving.set(true);
    const val = this.tenantForm.getRawValue();
    const t = this.editingTenant();

    const obs = t
      ? this.svc.update(t.id, { name: val.name!, logoUrl: val.logoUrl || null, faviconUrl: val.faviconUrl || null, isActive: val.isActive! })
      : this.svc.create({ name: val.name!, slug: val.slug! });

    obs.subscribe({
      next: () => { this.saving.set(false); this.showTenantForm = false; this.msg.add({ severity: 'success', summary: 'Tenant salvo!' }); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  openTheme(t: Tenant) {
    this.themeTarget.set(t);
    this.themeForm.patchValue({
      primaryColor: t.theme.primaryColor,
      secondaryColor: t.theme.secondaryColor,
      accentColor: t.theme.accentColor,
      surfaceColor: t.theme.surfaceColor,
      fontFamily: t.theme.fontFamily
    });
    this.showThemeForm = true;
  }

  submitTheme() {
    const t = this.themeTarget();
    if (!t) return;
    this.savingTheme.set(true);
    const val = this.themeForm.getRawValue() as TenantTheme;
    this.svc.updateTheme(t.id, val).subscribe({
      next: () => { this.savingTheme.set(false); this.showThemeForm = false; this.msg.add({ severity: 'success', summary: 'Tema aplicado!' }); this.load(); },
      error: () => this.savingTheme.set(false)
    });
  }
}
