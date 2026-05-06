import { Routes } from '@angular/router';

export const entitiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./entities-list.component').then(m => m.EntitiesListComponent)
  }
];
