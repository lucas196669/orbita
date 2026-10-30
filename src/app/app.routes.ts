import type { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'productos',
      },
      {
        path: 'inicio',
        pathMatch: 'full',
        redirectTo: 'productos',
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./features/products/product-form/product-form.page').then((m) => m.ProductFormPage),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () =>
          import('./features/products/product-form/product-form.page').then((m) => m.ProductFormPage),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/products/product-list/product-list.page').then((m) => m.ProductListPage),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
