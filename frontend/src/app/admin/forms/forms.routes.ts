import { Routes } from '@angular/router';

export const formsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./forms-list.component').then(m => m.FormsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./form-editor.component').then(m => m.FormEditorComponent)
  }
];
