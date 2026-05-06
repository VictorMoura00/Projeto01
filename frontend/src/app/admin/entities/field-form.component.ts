import { ChangeDetectionStrategy, Component, inject, input, output, OnChanges } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="field-form">
      <div class="field">
        <label for="field-name">Nome *</label>
        <input id="field-name" pInputText formControlName="name" placeholder="Ex: Título" autocomplete="off" (input)="autoSlug()" />
      </div>
      <div class="field">
        <label for="field-slug">Slug *</label>
        <input id="field-slug" pInputText formControlName="slug" placeholder="titulo" autocomplete="off" />
        <small>Identificador técnico usado em APIs e permissões.</small>
      </div>
      <div class="field">
        <label for="field-type">Tipo *</label>
        <p-select inputId="field-type" formControlName="fieldType" [options]="fieldTypeOptions" optionLabel="label" optionValue="value" />
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
    .field-form {
      display: grid;
      gap: 1rem;
    }

    .field-row {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      .field-row {
        grid-template-columns: 1fr;
      }
    }
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
