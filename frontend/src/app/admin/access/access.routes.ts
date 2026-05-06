import { Routes } from '@angular/router';

export const accessRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./access-list.component').then(m => m.AccessListComponent)
  }
];
