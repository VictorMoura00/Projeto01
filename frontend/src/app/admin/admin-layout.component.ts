import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

interface ErpMenuItem {
  label: string;
  route: string;
  icon: string;
  state?: 'soon';
}

interface ErpMenuGroup {
  label: string;
  items: ErpMenuItem[];
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast />
    <div class="admin-layout">
      <aside class="sidebar">
        <a class="sidebar-logo" routerLink="/admin/overview" aria-label="AdminCore início">
          <span class="logo-mark">AC</span>
          <span>
            <strong>AdminCore</strong>
            <small>Mini ERP base</small>
          </span>
        </a>

        <div class="module-switcher">
          <span class="module-eyebrow">Módulo atual</span>
          <a routerLink="/admin/overview">
            <i class="pi pi-cog" aria-hidden="true"></i>
            <span>
              <strong>Configurador</strong>
              <small>Estrutura, acesso e marca</small>
            </span>
          </a>
        </div>

        <nav aria-label="Submódulos do configurador">
          @for (group of menuGroups; track group.label) {
            <section class="menu-group" [attr.aria-label]="group.label">
              <button
                class="menu-group-trigger"
                type="button"
                [attr.aria-expanded]="isGroupExpanded(group.label)"
                (click)="toggleGroup(group.label)"
              >
                <span>{{ group.label }}</span>
                <i class="pi" [class.pi-chevron-down]="isGroupExpanded(group.label)" [class.pi-chevron-right]="!isGroupExpanded(group.label)" aria-hidden="true"></i>
              </button>

              @if (isGroupExpanded(group.label)) {
                <div class="menu-group-items">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route" routerLinkActive="active">
                      <i [class]="item.icon" aria-hidden="true"></i>
                      <span>{{ item.label }}</span>
                      @if (item.state === 'soon') {
                        <small>em breve</small>
                      }
                    </a>
                  }
                </div>
              }
            </section>
          }
        </nav>

        <div class="sidebar-status" aria-label="Status do ambiente">
          <span class="status-dot"></span>
          <span>Ambiente ativo</span>
        </div>
      </aside>

      <main class="content">
        <header class="topbar">
          <div>
            <span class="topbar-kicker">Projeto01</span>
            <strong>Configurador</strong>
          </div>
          <p-button icon="pi pi-bell" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Notificações" />
        </header>

        <section class="workspace" aria-label="Conteúdo administrativo">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      background: var(--app-shell-bg);
      display: grid;
      grid-template-columns: 18.5rem minmax(0, 1fr);
      min-height: 100svh;
    }

    .sidebar {
      background:
        linear-gradient(180deg, rgba(99, 102, 241, 0.16), transparent 30%),
        var(--app-sidebar-bg);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      color: white;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      position: sticky;
      top: 0;
      height: 100svh;
    }

    .sidebar-logo {
      align-items: center;
      color: white;
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem;
      text-decoration: none;
    }

    .logo-mark {
      align-items: center;
      background: var(--p-primary-color);
      border-radius: 8px;
      color: white;
      display: inline-flex;
      font-weight: 800;
      height: 2.5rem;
      justify-content: center;
      width: 2.5rem;
    }

    .sidebar-logo strong,
    .sidebar-logo small {
      display: block;
    }

    .sidebar-logo small {
      color: var(--app-sidebar-muted);
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.15rem;
    }

    .module-switcher {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .module-eyebrow {
      color: var(--app-sidebar-muted);
      display: block;
      font-size: 0.675rem;
      font-weight: 800;
      letter-spacing: 0.09em;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .module-switcher a {
      align-items: center;
      color: white;
      display: flex;
      gap: 0.75rem;
      text-decoration: none;
    }

    .module-switcher i {
      align-items: center;
      background: rgba(99, 102, 241, 0.22);
      border-radius: 8px;
      color: var(--app-sidebar-active);
      display: inline-flex;
      height: 2.25rem;
      justify-content: center;
      width: 2.25rem;
    }

    .module-switcher strong,
    .module-switcher small {
      display: block;
    }

    .module-switcher small {
      color: var(--app-sidebar-muted);
      font-size: 0.75rem;
      margin-top: 0.15rem;
    }

    nav {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      padding-right: 0.125rem;
    }

    .menu-group-trigger {
      align-items: center;
      background: transparent;
      border: 0;
      color: var(--app-sidebar-muted);
      cursor: pointer;
      display: flex;
      font-size: 0.6875rem;
      font-weight: 800;
      justify-content: space-between;
      letter-spacing: 0.08em;
      margin: 0.25rem 0.5rem;
      min-height: 2rem;
      padding: 0;
      text-align: left;
      text-transform: uppercase;
      width: calc(100% - 1rem);
    }

    .menu-group-trigger:hover {
      color: white;
    }

    .menu-group-trigger i {
      font-size: 0.75rem;
      width: auto;
    }

    .menu-group-items {
      display: grid;
      gap: 0.25rem;
    }

    nav a {
      align-items: center;
      border-radius: 8px;
      color: #cbd5e1;
      display: grid;
      gap: 0.75rem;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-height: 2.75rem;
      padding: 0.75rem;
      text-decoration: none;
      transition: background 160ms ease, color 160ms ease, transform 160ms ease;
    }

    nav a:hover,
    nav a.active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--app-sidebar-active);
    }

    nav a.active {
      box-shadow: inset 3px 0 0 var(--p-primary-color);
    }

    nav a:hover {
      transform: translateX(2px);
    }

    nav i {
      font-size: 1rem;
      width: 1.1rem;
    }

    nav small {
      background: rgba(148, 163, 184, 0.14);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 999px;
      color: var(--app-sidebar-muted);
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.15rem 0.4rem;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .sidebar-status {
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--app-sidebar-muted);
      display: flex;
      font-size: 0.8125rem;
      gap: 0.5rem;
      margin-top: auto;
      padding: 1rem 0.5rem 0;
    }

    .status-dot {
      background: var(--p-green-400);
      border-radius: 999px;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
      height: 0.5rem;
      width: 0.5rem;
    }

    .content {
      min-width: 0;
      overflow-y: auto;
    }

    .topbar {
      align-items: center;
      backdrop-filter: blur(16px);
      background: color-mix(in srgb, var(--app-shell-bg) 86%, transparent);
      border-bottom: 1px solid var(--app-panel-border);
      display: flex;
      justify-content: space-between;
      min-height: 4.25rem;
      padding: 0.75rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .topbar strong {
      color: var(--app-text);
      display: block;
      font-size: 1rem;
    }

    .topbar-kicker {
      color: var(--app-muted);
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .workspace {
      padding: 1.5rem;
    }

    @media (max-width: 900px) {
      .admin-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        height: auto;
        position: static;
      }

      nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .menu-group {
        display: contents;
      }

      .menu-group-trigger,
      .module-switcher {
        display: none;
      }

      nav a {
        flex: 0 0 auto;
      }

      .sidebar-status {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .workspace,
      .topbar {
        padding-inline: 1rem;
      }

      nav a span {
        white-space: nowrap;
      }
    }
  `]
})
export class AdminLayoutComponent {
  private readonly expandedGroups = signal<Record<string, boolean>>({});

  protected readonly menuGroups: ErpMenuGroup[] = [
    {
      label: 'Estrutura',
      items: [
        { label: 'Painel do módulo', route: 'overview', icon: 'pi pi-th-large' },
        { label: 'Entidades', route: 'entities', icon: 'pi pi-database' },
        { label: 'Módulos e menus', route: 'modules', icon: 'pi pi-sitemap', state: 'soon' },
        { label: 'Workflows', route: 'workflows', icon: 'pi pi-share-alt', state: 'soon' },
      ],
    },
    {
      label: 'Governança',
      items: [
        { label: 'Parâmetros', route: 'parameters', icon: 'pi pi-sliders-h' },
        { label: 'Acesso', route: 'access', icon: 'pi pi-shield' },
        { label: 'Auditoria', route: 'audit', icon: 'pi pi-history', state: 'soon' },
      ],
    },
    {
      label: 'White label',
      items: [
        { label: 'Tenants e temas', route: 'white-label', icon: 'pi pi-palette' },
        { label: 'Notificações', route: 'notifications', icon: 'pi pi-bell', state: 'soon' },
        { label: 'Integrações', route: 'integrations', icon: 'pi pi-link', state: 'soon' },
      ],
    },
  ];

  protected isGroupExpanded(label: string): boolean {
    return this.expandedGroups()[label] ?? false;
  }

  protected toggleGroup(label: string): void {
    this.expandedGroups.update(groups => ({
      ...groups,
      [label]: !(groups[label] ?? false),
    }));
  }

}
