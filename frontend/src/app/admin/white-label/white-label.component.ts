import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog />

    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Identidade visual</span>
          <h1 class="page-title">White Label</h1>
          <p class="page-description">Gerencie tenants, ativos de marca e tokens visuais para experiências personalizadas.</p>
        </div>
        <div class="page-actions">
          <p-button label="Novo tenant" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="metric-strip" aria-label="Resumo de tenants">
        <div class="metric-card">
          <span class="metric-label">Tenants</span>
          <strong class="metric-value">{{ tenants().length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Ativos</span>
          <strong class="metric-value">{{ activeTenantCount() }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Com logo</span>
          <strong class="metric-value">{{ brandedTenantCount() }}</strong>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-toolbar">
          <div>
            <strong class="toolbar-title">Tenants configurados</strong>
            <p class="toolbar-meta">Pré-visualize cores principais antes de editar o tema.</p>
          </div>
        </div>

        <p-table [value]="tenants()" [loading]="loading()" [tableStyle]="{'min-width':'46rem'}" rowHover styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Cores</th>
              <th>Status</th>
              <th class="actions-col">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-tenant>
            <tr>
              <td><strong>{{ tenant.name }}</strong></td>
              <td><code>{{ tenant.slug }}</code></td>
              <td>
                <div class="color-swatches" aria-label="Cores do tenant">
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
                  <p-button icon="pi pi-palette" size="small" [text]="true" ariaLabel="Editar tema" title="Editar tema" (onClick)="openTheme(tenant)" />
                  <p-button icon="pi pi-pencil" size="small" [text]="true" ariaLabel="Editar tenant" (onClick)="openEdit(tenant)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <strong>Nenhum tenant cadastrado</strong>
                  Crie um tenant para configurar marca, cores e status.
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <!-- Tenant Form Dialog -->
    <p-dialog [(visible)]="showTenantForm" [header]="editingTenant() ? 'Editar Tenant' : 'Novo Tenant'"
              [modal]="true" [style]="{width:'31rem'}" [breakpoints]="{'640px': '94vw'}">
      <form [formGroup]="tenantForm" (ngSubmit)="submitTenant()" class="tenant-form">
        <div class="field">
          <label for="tenant-name">Nome *</label>
          <input id="tenant-name" pInputText formControlName="name" placeholder="Ex: Acme Corp" autocomplete="off" (input)="autoSlug()" />
        </div>
        @if (!editingTenant()) {
          <div class="field">
            <label for="tenant-slug">Slug *</label>
            <input id="tenant-slug" pInputText formControlName="slug" placeholder="acme-corp" autocomplete="off" />
            <small>Usado na URL. Apenas letras minúsculas e hífens.</small>
          </div>
        }
        <div class="field">
          <label for="tenant-logo">URL do Logo</label>
          <input id="tenant-logo" pInputText formControlName="logoUrl" placeholder="https://..." autocomplete="off" />
        </div>
        <div class="field">
          <label for="tenant-favicon">URL do Favicon</label>
          <input id="tenant-favicon" pInputText formControlName="faviconUrl" placeholder="https://..." autocomplete="off" />
        </div>
        @if (editingTenant()) {
          <div class="field field-inline">
            <label>Ativo</label>
            <p-toggleswitch formControlName="isActive" />
          </div>
        }
        <div class="form-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="showTenantForm = false" />
          <p-button label="Salvar" type="submit" [loading]="saving()" />
        </div>
      </form>
    </p-dialog>

    <!-- Theme Dialog -->
    <p-dialog [(visible)]="showThemeForm" header="Editar Tema"
              [modal]="true" [style]="{width:'34rem'}" [breakpoints]="{'680px': '94vw'}">
      @if (themeTarget()) {
        <form [formGroup]="themeForm" (ngSubmit)="submitTheme()" class="theme-form">
          <p class="theme-target-name">{{ themeTarget()!.name }}</p>
          <div class="color-grid">
            <div class="color-field">
              <label for="theme-primary">Cor Primária</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="primaryColor" format="hex" />
                <input id="theme-primary" pInputText formControlName="primaryColor" />
              </div>
            </div>
            <div class="color-field">
              <label for="theme-secondary">Cor Secundária</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="secondaryColor" format="hex" />
                <input id="theme-secondary" pInputText formControlName="secondaryColor" />
              </div>
            </div>
            <div class="color-field">
              <label for="theme-accent">Cor de Destaque</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="accentColor" format="hex" />
                <input id="theme-accent" pInputText formControlName="accentColor" />
              </div>
            </div>
            <div class="color-field">
              <label for="theme-surface">Superfície</label>
              <div class="color-input-row">
                <p-colorpicker formControlName="surfaceColor" format="hex" />
                <input id="theme-surface" pInputText formControlName="surfaceColor" />
              </div>
            </div>
          </div>
          <div class="field font-field">
            <label for="theme-font">Fonte</label>
            <input id="theme-font" pInputText formControlName="fontFamily" placeholder="Inter, sans-serif" />
          </div>
          <div class="theme-preview" [style.background]="themeForm.get('primaryColor')?.value">
            <span [style.color]="themeForm.get('surfaceColor')?.value">Preview da cor primária</span>
          </div>
          <div class="form-actions theme-actions">
            <p-button label="Cancelar" [text]="true" (onClick)="showThemeForm = false" />
            <p-button label="Salvar Tema" type="submit" [loading]="savingTheme()" />
          </div>
        </form>
      }
    </p-dialog>
  `,
  styles: [`
    .color-swatches { display: flex; gap: 4px; }
    .swatch { width: 1.35rem; height: 1.35rem; border-radius: 999px; border: 1px solid var(--p-surface-300); display: inline-block; }
    .tenant-form, .theme-form { display: grid; gap: 1rem; }
    .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    .color-field { display: flex; flex-direction: column; gap: 4px; }
    .color-field label { font-weight: 500; font-size: 0.875rem; }
    .color-input-row { display: flex; align-items: center; gap: 0.5rem; }
    .color-input-row input { width: 100%; }
    .font-field { margin-top: 0.25rem; }
    .theme-preview { padding: 0.875rem 1rem; border-radius: 8px; margin-top: 0.25rem; text-align: center; font-weight: 650; transition: background 0.2s; }
    .theme-target-name { font-weight: 600; color: var(--p-primary-color); margin: 0 0 0.5rem; }
    .theme-actions { margin-top: 0.25rem; }
    .actions-col { text-align: right; width: 8rem; }

    @media (max-width: 640px) {
      .color-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WhiteLabelComponent implements OnInit {
  private svc = inject(WhiteLabelService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);

  tenants = signal<Tenant[]>([]);
  activeTenantCount = computed(() => this.tenants().filter(tenant => tenant.isActive).length);
  brandedTenantCount = computed(() => this.tenants().filter(tenant => Boolean(tenant.logoUrl)).length);
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
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }
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
