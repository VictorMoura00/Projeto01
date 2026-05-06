import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo">AdminCore</div>
        <nav>
          <a routerLink="entities" routerLinkActive="active">Entidades</a>
          <a routerLink="parameters" routerLinkActive="active">Parâmetros</a>
          <a routerLink="access" routerLinkActive="active">Acesso</a>
          <a routerLink="white-label" routerLinkActive="active">White Label</a>
        </nav>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; height: 100vh; }
    .sidebar { width: 240px; background: var(--p-surface-900); padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .sidebar-logo { color: var(--p-primary-color); font-size: 1.25rem; font-weight: bold; padding: 0.5rem 0; }
    nav { display: flex; flex-direction: column; gap: 0.25rem; }
    nav a { color: var(--p-surface-200); padding: 0.5rem 0.75rem; border-radius: 6px; text-decoration: none; transition: background 0.2s; }
    nav a:hover, nav a.active { background: var(--p-surface-700); color: var(--p-primary-color); }
    .content { flex: 1; overflow-y: auto; padding: 1.5rem; background: var(--p-surface-50); }
  `]
})
export class AdminLayoutComponent {}
