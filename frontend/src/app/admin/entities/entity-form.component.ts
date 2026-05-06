import { ChangeDetectionStrategy, Component, inject, input, output, OnChanges } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
      <div class="field">
        <label for="entity-name">Nome *</label>
        <input id="entity-name" pInputText formControlName="name" placeholder="Ex: Chamado TI" autocomplete="off" (input)="autoSlug()" />
      </div>
      <div class="field">
        <label for="entity-slug">Slug *</label>
        <input id="entity-slug" pInputText formControlName="slug" placeholder="chamado-ti" autocomplete="off" />
        <small>Usado internamente. Apenas letras minúsculas, números e hífens.</small>
      </div>
      <div class="field">
        <label for="entity-icon">Ícone</label>
        <input id="entity-icon" pInputText formControlName="icon" placeholder="pi pi-database" maxlength="32" autocomplete="off" />
        <small>Use uma classe PrimeIcons, como pi pi-database, para manter consistência visual.</small>
      </div>
      <div class="field">
        <label for="entity-description">Descrição</label>
        <textarea id="entity-description" pTextarea formControlName="description" rows="3" placeholder="Descreva o propósito desta entidade"></textarea>
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
    .entity-form {
      display: grid;
      gap: 1rem;
    }
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
