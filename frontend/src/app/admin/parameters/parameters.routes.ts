import { Routes } from '@angular/router';

export const parametersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./parameters-list.component').then(m => m.ParametersListComponent)
  }
];
