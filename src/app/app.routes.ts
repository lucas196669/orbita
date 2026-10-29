import type { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

/** Rutas principales de Orbita con carga diferida por feature. */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Orbita',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((module) => module.ShellComponent),
    children: [
      {
        path: 'inicio',
        title: 'Inicio · Orbita',
        loadComponent: () => import('./features/home/home.page').then((module) => module.HomePage),
      },
      {
        path: 'dashboard',
        title: 'Dashboard · Orbita',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/dashboard/dashboard.page').then((module) => module.DashboardPage),
      },
      {
        path: 'productos',
        title: 'Productos · Orbita',
        loadComponent: () => import('./features/products/products.page').then((module) => module.ProductsPage),
      },
      {
        path: 'pedidos',
        title: 'Pedidos · Orbita',
        loadComponent: () => import('./features/orders/orders.page').then((module) => module.OrdersPage),
      },
      {
        path: 'ayuda',
        title: 'Ayuda · Orbita',
        loadComponent: () => import('./features/help/help.page').then((module) => module.HelpPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'acceso-denegado',
    title: 'Acceso restringido · Orbita',
    loadComponent: () => import('./features/errors/access-denied.page').then((module) => module.AccessDeniedPage),
  },
  {
    path: '',
    redirectTo: 'app/inicio',
    pathMatch: 'full',
  },
  {
    path: '**',
    title: 'Página no encontrada · Orbita',
    loadComponent: () => import('./features/errors/not-found.page').then((module) => module.NotFoundPage),
  },
];
