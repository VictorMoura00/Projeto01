import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Data, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface PlaceholderData {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

@Component({
  selector: 'app-configurator-placeholder',
  imports: [RouterLink, ButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Configurador</span>
          <h1 class="page-title">{{ page().title }}</h1>
          <p class="page-description">{{ page().description }}</p>
        </div>
        <div class="page-actions">
          <p-tag value="Planejado" severity="secondary" />
          <p-button label="Voltar ao configurador" icon="pi pi-arrow-left" [outlined]="true" routerLink="/admin/overview" />
        </div>
      </div>

      <div class="placeholder-panel">
        <div class="placeholder-icon">
          <i [class]="page().icon" aria-hidden="true"></i>
        </div>
        <div>
          <span class="metric-label">Funcionalidades previstas</span>
          <ul>
            @for (feature of page().features; track feature) {
              <li>
                <i class="pi pi-check-circle" aria-hidden="true"></i>
                <span>{{ feature }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .placeholder-panel {
      align-items: flex-start;
      background: var(--app-panel-bg);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: auto minmax(0, 1fr);
      padding: 1.25rem;
    }

    .placeholder-icon {
      align-items: center;
      background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
      border-radius: 8px;
      color: var(--p-primary-color);
      display: inline-flex;
      font-size: 1.35rem;
      height: 3rem;
      justify-content: center;
      width: 3rem;
    }

    ul {
      display: grid;
      gap: 0.75rem;
      list-style: none;
      margin-top: 0.875rem;
      padding: 0;
    }

    li {
      align-items: flex-start;
      color: var(--app-text);
      display: flex;
      gap: 0.625rem;
      line-height: 1.45;
    }

    li i {
      color: var(--p-green-500);
      margin-top: 0.15rem;
    }

    @media (max-width: 640px) {
      .placeholder-panel {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConfiguratorPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: {} as Data });

  protected readonly page = computed<PlaceholderData>(() => {
    const data = this.data();

    return {
      title: typeof data['title'] === 'string' ? data['title'] : 'Função planejada',
      description: typeof data['description'] === 'string' ? data['description'] : 'Esta área está reservada para evolução do configurador.',
      icon: typeof data['icon'] === 'string' ? data['icon'] : 'pi pi-cog',
      features: Array.isArray(data['features']) ? data['features'] : [],
    };
  });
}
