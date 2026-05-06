import { Component, inject, input, output, OnChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { EntitiesService } from './entities.service';
import { EntityDefinition } from './entity.model';

@Component({
  selector: 'app-entity-form',
  imports: [ReactiveFormsModule, InputTextModule, TextareaModule, ToggleSwitchModule, ButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
      <div class="field">
        <label>Nome *</label>
        <input pInputText formControlName="name" placeholder="Ex: Chamado TI" (input)="autoSlug()" />
      </div>
      <div class="field">
        <label>Slug *</label>
        <input pInputText formControlName="slug" placeholder="chamado-ti" />
        <small>Usado internamente. Apenas letras minúsculas, números e hífens.</small>
      </div>
      <div class="field">
        <label>Ícone</label>
        <input pInputText formControlName="icon" placeholder="📋" maxlength="4" />
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea pTextarea formControlName="description" rows="3" placeholder="Descreva o propósito desta entidade"></textarea>
      </div>
      @if (entity()) {
        <div class="field field-inline">
          <label>Ativo</label>
          <p-toggleswitch formControlName="isActive" />
        </div>
      }
      <div class="form-actions">
        <p-button label="Cancelar" [text]="true" (onClick)="cancelled.emit()" />
        <p-button label="Salvar" type="submit" [loading]="saving" [disabled]="form.invalid" />
      </div>
    </form>
  `,
  styles: [`
    .entity-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .field small { color: var(--p-text-muted-color); font-size: 0.75rem; }
    .field-inline { flex-direction: row; align-items: center; justify-content: space-between; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.5rem; }
  `]
})
export class EntityFormComponent implements OnChanges {
  entity = input<EntityDefinition | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private svc = inject(EntitiesService);
  private msg = inject(MessageService);

  saving = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(50)]],
    icon: [''],
    description: [''],
    isActive: [true]
  });

  ngOnChanges() {
    const e = this.entity();
    if (e) {
      this.form.patchValue({ name: e.name, slug: e.slug, icon: e.icon ?? '', description: e.description ?? '', isActive: e.isActive });
      this.form.get('slug')?.disable();
    } else {
      this.form.reset({ isActive: true });
      this.form.get('slug')?.enable();
    }
  }

  autoSlug() {
    if (this.entity()) return;
    const name = this.form.get('name')?.value ?? '';
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    this.form.get('slug')?.setValue(slug, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.getRawValue();
    const e = this.entity();

    const obs = e
      ? this.svc.update(e.id, { name: val.name!, description: val.description ?? undefined, icon: val.icon ?? undefined, isActive: val.isActive! })
      : this.svc.create({ name: val.name!, slug: val.slug!, description: val.description ?? undefined, icon: val.icon ?? undefined });

    obs.subscribe({
      next: () => { this.saving = false; this.msg.add({ severity: 'success', summary: 'Salvo!' }); this.saved.emit(); },
      error: () => { this.saving = false; }
    });
  }
}
