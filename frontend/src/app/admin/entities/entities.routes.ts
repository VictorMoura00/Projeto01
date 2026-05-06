import { Routes } from '@angular/router';

export const entitiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./entities-list.component').then(m => m.EntitiesListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./entity-detail.component').then(m => m.EntityDetailComponent)
  }
];
