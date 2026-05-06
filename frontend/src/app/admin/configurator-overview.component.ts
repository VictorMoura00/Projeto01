import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface ModuleShortcut {
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'Disponível' | 'Planejado';
}

@Component({
  selector: 'app-configurator-overview',
  imports: [RouterLink, ButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Módulo</span>
          <h1 class="page-title">Configurador</h1>
          <p class="page-description">
            Central de parametrização do mini ERP base. Controle estrutura de dados, acesso, marca e recursos que
            podem ser habilitados por projeto white label.
          </p>
        </div>
        <div class="page-actions">
          <p-button label="Nova entidade" icon="pi pi-plus" routerLink="/admin/entities" />
        </div>
      </div>

      <div class="erp-summary" aria-label="Resumo do módulo configurador">
        <div>
          <span class="metric-label">Base white label</span>
          <strong>Multi-tenant por configuração</strong>
          <p>Estruture módulos reutilizáveis sem acoplar regras específicas de um cliente.</p>
        </div>
        <div>
          <span class="metric-label">Governança</span>
          <strong>Acesso e parâmetros</strong>
          <p>Centralize permissões, feature flags, temas e chaves operacionais.</p>
        </div>
      </div>

      <div class="module-grid">
        @for (item of shortcuts; track item.route) {
          <a class="module-tile" [routerLink]="item.route">
            <span class="tile-icon"><i [class]="item.icon" aria-hidden="true"></i></span>
            <span class="tile-copy">
              <span class="tile-heading">
                <strong>{{ item.title }}</strong>
                <p-tag [value]="item.status" [severity]="item.status === 'Disponível' ? 'success' : 'secondary'" />
              </span>
              <span>{{ item.description }}</span>
            </span>
            <i class="pi pi-angle-right" aria-hidden="true"></i>
          </a>
        }
      </div>
    </section>
  `,
  styles: [`
    .erp-summary {
      background: var(--app-panel-bg);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 1rem;
    }

    .erp-summary strong {
      color: var(--app-text);
      display: block;
      font-size: 1.05rem;
      margin-top: 0.35rem;
    }

    .erp-summary p {
      color: var(--app-muted);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-top: 0.35rem;
    }

    .module-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .module-tile {
      align-items: center;
      background: var(--app-panel-bg);
      border: 1px solid var(--app-panel-border);
      border-radius: 8px;
      color: inherit;
      display: grid;
      gap: 0.875rem;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-height: 6rem;
      padding: 1rem;
      text-decoration: none;
      transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    .module-tile:hover {
      border-color: color-mix(in srgb, var(--p-primary-color) 34%, var(--app-panel-border));
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
      transform: translateY(-1px);
    }

    .tile-icon {
      align-items: center;
      background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
      border-radius: 8px;
      color: var(--p-primary-color);
      display: inline-flex;
      height: 2.5rem;
      justify-content: center;
      width: 2.5rem;
    }

    .tile-copy {
      color: var(--app-muted);
      display: grid;
      font-size: 0.875rem;
      gap: 0.35rem;
      line-height: 1.45;
      min-width: 0;
    }

    .tile-heading {
      align-items: center;
      color: var(--app-text);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: space-between;
    }

    @media (max-width: 820px) {
      .erp-summary,
      .module-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConfiguratorOverviewComponent {
  protected readonly shortcuts: ModuleShortcut[] = [
    {
      title: 'Entidades',
      description: 'Modelagem dos objetos de negócio reutilizáveis.',
      icon: 'pi pi-database',
      route: '/admin/entities',
      status: 'Disponível',
    },
    {
      title: 'Parâmetros',
      description: 'Chaves globais, tenant scope e valores operacionais.',
      icon: 'pi pi-sliders-h',
      route: '/admin/parameters',
      status: 'Disponível',
    },
    {
      title: 'Acesso',
      description: 'Roles e permissões por entidade e operação.',
      icon: 'pi pi-shield',
      route: '/admin/access',
      status: 'Disponível',
    },
    {
      title: 'White Label',
      description: 'Temas, marcas e identidade visual por tenant.',
      icon: 'pi pi-palette',
      route: '/admin/white-label',
      status: 'Disponível',
    },
    {
      title: 'Módulos e menus',
      description: 'Controle de menus, submódulos e features por projeto.',
      icon: 'pi pi-sitemap',
      route: '/admin/modules',
      status: 'Planejado',
    },
    {
      title: 'Auditoria',
      description: 'Trilha de alterações, eventos e rastreabilidade.',
      icon: 'pi pi-history',
      route: '/admin/audit',
      status: 'Planejado',
    },
  ];
}
