import { Component, inject, input, output, OnChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { FieldDefinition, FieldType, FIELD_TYPE_LABELS } from './entity.model';

@Component({
  selector: 'app-field-form',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ToggleSwitchModule, ButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="field-form">
      <div class="field">
        <label>Nome *</label>
        <input pInputText formControlName="name" placeholder="Ex: Título" (input)="autoSlug()" />
      </div>
      <div class="field">
        <label>Slug *</label>
        <input pInputText formControlName="slug" placeholder="titulo" />
      </div>
      <div class="field">
        <label>Tipo *</label>
        <p-select formControlName="fieldType" [options]="fieldTypeOptions" optionLabel="label" optionValue="value" />
      </div>
      <div class="field-row">
        <div class="field field-inline">
          <label>Obrigatório</label>
          <p-toggleswitch formControlName="isRequired" />
        </div>
        <div class="field field-inline">
          <label>Buscável</label>
          <p-toggleswitch formControlName="isSearchable" />
        </div>
        <div class="field field-inline">
          <label>Filtrável</label>
          <p-toggleswitch formControlName="isFilterable" />
        </div>
      </div>
      <div class="form-actions">
        <p-button label="Cancelar" [text]="true" (onClick)="cancelled.emit()" />
        <p-button label="Salvar" type="submit" [loading]="saving" [disabled]="form.invalid" />
      </div>
    </form>
  `,
  styles: [`
    .field-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .field-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .field-inline { flex-direction: row; align-items: center; justify-content: space-between; background: var(--p-surface-50); padding: 0.5rem 0.75rem; border-radius: 6px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.5rem; }
  `]
})
export class FieldFormComponent implements OnChanges {
  entityId = input.required<string>();
  field = input<FieldDefinition | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private svc = inject(EntitiesService);
  private msg = inject(MessageService);

  saving = false;

  fieldTypeOptions = Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => ({ value: Number(value), label }));

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    fieldType: [FieldType.Text, Validators.required],
    isRequired: [false],
    isSearchable: [false],
    isFilterable: [false]
  });

  ngOnChanges() {
    const f = this.field();
    if (f) {
      this.form.patchValue({ name: f.name, slug: f.slug, fieldType: f.fieldType, isRequired: f.isRequired, isSearchable: f.isSearchable, isFilterable: f.isFilterable });
      this.form.get('slug')?.disable();
    } else {
      this.form.reset({ fieldType: FieldType.Text, isRequired: false, isSearchable: false, isFilterable: false });
      this.form.get('slug')?.enable();
    }
  }

  autoSlug() {
    if (this.field()) return;
    const name = this.form.get('name')?.value ?? '';
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.form.get('slug')?.setValue(slug, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.getRawValue();
    const f = this.field();

    const obs = f
      ? this.svc.updateField(this.entityId(), f.id, { name: val.name!, fieldType: val.fieldType!, isRequired: val.isRequired!, isSearchable: val.isSearchable!, isFilterable: val.isFilterable! })
      : this.svc.createField(this.entityId(), { name: val.name!, slug: val.slug!, fieldType: val.fieldType!, isRequired: val.isRequired!, isSearchable: val.isSearchable!, isFilterable: val.isFilterable! });

    obs.subscribe({
      next: () => { this.saving = false; this.msg.add({ severity: 'success', summary: 'Campo salvo!' }); this.saved.emit(); },
      error: () => { this.saving = false; }
    });
  }
}
