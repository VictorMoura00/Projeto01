import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'entities', pathMatch: 'full' },
      {
        path: 'entities',
        loadChildren: () => import('./entities/entities.routes').then(m => m.entitiesRoutes)
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
