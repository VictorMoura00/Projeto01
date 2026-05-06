import { Routes } from '@angular/router';

export const whiteLabelRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./white-label.component').then(m => m.WhiteLabelComponent)
  }
];
