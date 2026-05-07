import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

interface MenuItem { label: string; icon: string; route: string; badge?: string; }
interface MenuGroup { group: string; label: string; items: MenuItem[]; }

const MENU: MenuGroup[] = [
  {
    group: 'core', label: 'Principal',
    items: [
      { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
      { label: 'Entidades', icon: 'pi pi-database', route: '/admin/entities' },
      { label: 'Formulários', icon: 'pi pi-file-edit', route: '/admin/forms' },
    ]
  },
  {
    group: 'config', label: 'Configuração',
    items: [
      { label: 'Parâmetros', icon: 'pi pi-sliders-h', route: '/admin/parameters' },
      { label: 'Controle de Acesso', icon: 'pi pi-shield', route: '/admin/access' },
    ]
  },
  {
    group: 'system', label: 'Sistema',
    items: [
      { label: 'White Label', icon: 'pi pi-palette', route: '/admin/white-label' },
    ]
  }
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast />
    <div class="admin-layout">
      <aside class="sidebar">
        <a class="sidebar-logo" routerLink="/admin">
          <span class="logo-mark">AC</span>
          <span><strong>AdminCore</strong><small>Plataforma Low-Code</small></span>
        </a>

        <nav>
          @for (group of menu; track group.group) {
            <section class="menu-group">
              <button class="menu-group-trigger" type="button"
                [attr.aria-expanded]="expanded()[group.group]"
                (click)="toggle(group.group)">
                <span>{{ group.label }}</span>
                <i class="pi" [class.pi-chevron-down]="expanded()[group.group]" [class.pi-chevron-right]="!expanded()[group.group]"></i>
              </button>

              @if (expanded()[group.group]) {
                <div class="menu-group-items">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route" routerLinkActive="active"
                       [routerLinkActiveOptions]="{exact: item.route === '/admin'}">
                      <i [class]="item.icon"></i>
                      <span>{{ item.label }}</span>
                      @if (item.badge) { <small>{{ item.badge }}</small> }
                    </a>
                  }
                </div>
              }
            </section>
          }
        </nav>

        <div class="sidebar-status"><span class="status-dot"></span> Ambiente ativo</div>
      </aside>

      <main class="content">
        <header class="topbar">
          <div><span class="topbar-kicker">AdminCore</span><strong>Configurador</strong></div>
          <p-button icon="pi pi-sign-out" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Sair" routerLink="/login" />
        </header>
        <section class="workspace"><router-outlet /></section>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { background: var(--app-shell-bg); display: grid; grid-template-columns: 16rem minmax(0,1fr); min-height: 100svh; }
    .sidebar { background: linear-gradient(180deg, rgba(99,102,241,0.16), transparent 30%), var(--app-sidebar-bg); border-right: 1px solid rgba(255,255,255,0.08); color: white; display: flex; flex-direction: column; gap: 1rem; padding: 1rem; position: sticky; top: 0; height: 100svh; }
    .sidebar-logo { align-items: center; color: white; display: flex; gap: 0.75rem; padding: 0.5rem; text-decoration: none; }
    .logo-mark { align-items: center; background: var(--p-primary-color); border-radius: 8px; color: white; display: inline-flex; font-weight: 800; height: 2.5rem; justify-content: center; width: 2.5rem; }
    .sidebar-logo strong, .sidebar-logo small { display: block; }
    .sidebar-logo small { color: var(--app-sidebar-muted); font-size: 0.75rem; font-weight: 500; margin-top: 0.15rem; }
    nav { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
    .menu-group-trigger { align-items: center; background: transparent; border: 0; color: var(--app-sidebar-muted); cursor: pointer; display: flex; font-size: 0.6875rem; font-weight: 800; justify-content: space-between; letter-spacing: 0.08em; margin: 0.25rem 0.5rem; padding: 0; text-transform: uppercase; }
    .menu-group-trigger:hover { color: white; }
    .menu-group-items { display: grid; gap: 0.25rem; }
    nav a { align-items: center; border-radius: 8px; color: #cbd5e1; display: grid; gap: 0.75rem; grid-template-columns: auto 1fr auto; min-height: 2.5rem; padding: 0.6rem 0.75rem; text-decoration: none; transition: background 160ms, color 160ms; }
    nav a:hover, nav a.active { background: rgba(255,255,255,0.1); color: var(--app-sidebar-active); }
    nav a.active { box-shadow: inset 3px 0 0 var(--p-primary-color); }
    nav i { font-size: 1rem; width: 1.1rem; }
    nav small { background: rgba(148,163,184,0.14); border-radius: 999px; color: var(--app-sidebar-muted); font-size: 0.625rem; font-weight: 800; padding: 0.15rem 0.4rem; }
    .sidebar-status { align-items: center; border-top: 1px solid rgba(255,255,255,0.1); color: var(--app-sidebar-muted); display: flex; font-size: 0.8125rem; gap: 0.5rem; margin-top: auto; padding: 1rem 0.5rem 0; }
    .status-dot { background: var(--p-green-400); border-radius: 999px; box-shadow: 0 0 0 4px rgba(34,197,94,0.12); height: 0.5rem; width: 0.5rem; }
    .content { min-width: 0; overflow-y: auto; }
    .topbar { align-items: center; backdrop-filter: blur(16px); background: color-mix(in srgb, var(--app-shell-bg) 86%, transparent); border-bottom: 1px solid var(--app-panel-border); display: flex; justify-content: space-between; min-height: 4rem; padding: 0.5rem 1.5rem; position: sticky; top: 0; z-index: 10; }
    .topbar strong { color: var(--app-text); font-size: 1rem; }
    .topbar-kicker { color: var(--app-muted); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .workspace { padding: 1.5rem; }
    @media (max-width: 900px) { .admin-layout { grid-template-columns: 1fr; } .sidebar { height: auto; position: static; } nav { flex-direction: row; overflow-x: auto; } .menu-group-trigger { display: none; } nav a { flex: 0 0 auto; } .sidebar-status { display: none; } }
    @media (max-width: 640px) { .workspace, .topbar { padding-inline: 1rem; } }
  `]
})
export class AdminLayoutComponent implements OnInit {
  menu = MENU;
  expanded = signal<Record<string, boolean>>({});

  ngOnInit() {
    const exp: Record<string, boolean> = {};
    for (const g of MENU) exp[g.group] = true;
    this.expanded.set(exp);
  }

  toggle(group: string) {
    this.expanded.update(g => ({ ...g, [group]: !(g[group] ?? false) }));
  }
}
