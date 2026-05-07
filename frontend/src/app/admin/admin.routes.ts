import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'entities',
        loadChildren: () => import('./entities/entities.routes').then(m => m.entitiesRoutes)
      },
      {
        path: 'forms',
        loadChildren: () => import('./forms/forms.routes').then(m => m.formsRoutes)
      },
      {
        path: 'parameters',
        loadChildren: () => import('./parameters/parameters.routes').then(m => m.parametersRoutes)
      },
      {
        path: 'access',
        loadChildren: () => import('./access/access.routes').then(m => m.accessRoutes)
      },
      {
        path: 'white-label',
        loadChildren: () => import('./white-label/white-label.routes').then(m => m.whiteLabelRoutes)
      }
    ]
  }
];
