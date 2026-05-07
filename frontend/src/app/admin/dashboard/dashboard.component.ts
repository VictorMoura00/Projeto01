import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntitiesService } from '../entities/entities.service';
import { FormsService } from '../forms/forms.service';
import { ParametersService } from '../parameters/parameters.service';
import { AccessService } from '../access/access.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Bem-vindo</span>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-description">Visão geral do seu ambiente AdminCore.</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <a class="dash-card" routerLink="/admin/entities">
          <i class="pi pi-database dash-icon"></i>
          <strong>Entidades</strong>
          <span class="dash-value">{{ entityCount }}</span>
          <small>Objetos de dados configurados</small>
        </a>
        <a class="dash-card" routerLink="/admin/forms">
          <i class="pi pi-file-edit dash-icon"></i>
          <strong>Formulários</strong>
          <span class="dash-value">{{ formCount }}</span>
          <small>Formulários dinâmicos</small>
        </a>
        <a class="dash-card" routerLink="/admin/parameters">
          <i class="pi pi-sliders-h dash-icon"></i>
          <strong>Parâmetros</strong>
          <span class="dash-value">{{ paramCount }}</span>
          <small>Configurações do sistema</small>
        </a>
        <a class="dash-card" routerLink="/admin/access">
          <i class="pi pi-shield dash-icon"></i>
          <strong>Roles</strong>
          <span class="dash-value">{{ roleCount }}</span>
          <small>Controle de acesso</small>
        </a>
      </div>

      <div class="quick-links">
        <h2>Ações rápidas</h2>
        <div class="quick-grid">
          <a routerLink="/admin/entities" class="quick-link">
            <i class="pi pi-plus-circle"></i> Nova entidade
          </a>
          <a routerLink="/admin/forms" class="quick-link">
            <i class="pi pi-plus-circle"></i> Novo formulário
          </a>
          <a routerLink="/admin/parameters" class="quick-link">
            <i class="pi pi-plus-circle"></i> Novo parâmetro
          </a>
          <a routerLink="/admin/access" class="quick-link">
            <i class="pi pi-plus-circle"></i> Nova role
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .dash-card {
      background: var(--p-surface-0);
      border: 1px solid var(--app-panel-border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1.25rem;
      text-decoration: none;
      color: inherit;
      transition: border-color 160ms, box-shadow 160ms;
    }

    .dash-card:hover {
      border-color: var(--p-primary-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .dash-icon {
      color: var(--p-primary-color);
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .dash-value {
      font-size: 2rem;
      font-weight: 800;
    }

    .dash-card small {
      color: var(--app-muted);
      font-size: 0.8rem;
    }

    .quick-links h2 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }

    .quick-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .quick-link {
      align-items: center;
      background: var(--p-surface-100);
      border-radius: 8px;
      color: var(--app-text);
      display: inline-flex;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      transition: background 150ms;
    }

    .quick-link:hover {
      background: var(--p-primary-100);
      color: var(--p-primary-color);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private entitiesSvc = inject(EntitiesService);
  private formsSvc = inject(FormsService);
  private paramsSvc = inject(ParametersService);
  private accessSvc = inject(AccessService);

  entityCount = 0;
  formCount = 0;
  paramCount = 0;
  roleCount = 0;

  ngOnInit() {
    this.entitiesSvc.getAll(1, 1).subscribe(r => this.entityCount = r.totalCount);
    this.formsSvc.getAll(1, 1).subscribe(r => this.formCount = r.totalCount);
    this.paramsSvc.getAll().subscribe(r => this.paramCount = r.totalCount);
    this.accessSvc.getAll().subscribe(r => this.roleCount = r.totalCount);
  }
}
