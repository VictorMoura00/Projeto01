import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, PasswordModule, ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast />
    <main class="login-page">
      <section class="login-hero" aria-label="Acesso ao AdminCore">
        <div class="brand-block">
          <span class="logo-mark">AC</span>
          <div>
            <span class="eyebrow">AdminCore</span>
            <h1>Acesse seu ambiente</h1>
            <p>Entre com uma conta autorizada para configurar entidades, acesso, parâmetros e identidade visual.</p>
          </div>
        </div>

        <p-card styleClass="login-card">
          <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
            <div class="field">
              <label for="email">E-mail</label>
              <input id="email" pInputText type="email" autocomplete="email" formControlName="email" />
              @if (emailInvalid()) {
                <small class="field-error">Informe um e-mail válido.</small>
              }
            </div>

            <div class="field">
              <label for="password">Senha</label>
              <p-password
                inputId="password"
                formControlName="password"
                autocomplete="current-password"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="password-control"
                inputStyleClass="password-input"
              />
              @if (passwordInvalid()) {
                <small class="field-error">Informe sua senha.</small>
              }
            </div>

            <p-button
              label="Entrar"
              icon="pi pi-sign-in"
              (onClick)="submit()"
              [loading]="loading()"
              styleClass="login-submit"
            />
          </form>
        </p-card>
      </section>
    </main>
  `,
  styles: [`
    .login-page {
      align-items: center;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--p-primary-color) 12%, transparent), transparent 34%),
        var(--app-shell-bg);
      display: flex;
      min-height: 100svh;
      padding: clamp(1rem, 4vw, 3rem);
    }

    .login-hero {
      align-items: center;
      display: grid;
      gap: clamp(1.5rem, 4vw, 4rem);
      grid-template-columns: minmax(0, 1fr) minmax(20rem, 28rem);
      margin: 0 auto;
      max-width: 70rem;
      width: 100%;
    }

    .brand-block {
      align-items: flex-start;
      display: flex;
      gap: 1rem;
    }

    .logo-mark {
      align-items: center;
      background: var(--p-primary-color);
      border-radius: 8px;
      color: white;
      display: inline-flex;
      flex: 0 0 auto;
      font-weight: 800;
      height: 3rem;
      justify-content: center;
      width: 3rem;
    }

    .eyebrow {
      color: var(--p-primary-color);
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      color: var(--app-text);
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 800;
      letter-spacing: 0;
      line-height: 1;
      margin: 0.5rem 0 0;
    }

    p {
      color: var(--app-muted);
      font-size: 1rem;
      line-height: 1.6;
      margin-top: 1rem;
      max-width: 35rem;
    }

    .login-form {
      display: grid;
      gap: 1rem;
    }

    .field-error {
      color: var(--p-red-600);
    }

    :host ::ng-deep .login-card {
      border-radius: 8px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
    }

    :host ::ng-deep .password-control,
    :host ::ng-deep .password-input,
    :host ::ng-deep .login-submit {
      width: 100%;
    }

    @media (max-width: 760px) {
      .login-page {
        align-items: flex-start;
      }

      .login-hero {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private theme = inject(ThemeService);

  loading = signal(false);
  tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? this.route.snapshot.queryParamMap.get('tenant') ?? undefined;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor() {
    this.theme.loadTenantTheme(this.tenantSlug);
  }

  emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue(), this.tenantSlug).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Login recusado', detail: 'Confira e-mail e senha.' });
      }
    });
  }
}
