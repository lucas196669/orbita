import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import type { Role } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

import type { ShellIcon } from './shell.icons';

/** Opción de navegación del shell. */
export interface ShellMenuItem {
  readonly label: string;
  readonly path: string;
  readonly icon: ShellIcon;
  readonly roles?: readonly Role[];
}

/** Opciones de navegación disponibles en Orbita. */
export const SHELL_MENU: readonly ShellMenuItem[] = [
  { label: 'Inicio', path: '/app/inicio', icon: 'home' },
  { label: 'Dashboard', path: '/app/dashboard', icon: 'chart', roles: ['admin'] },
  { label: 'Productos', path: '/app/productos', icon: 'box' },
  { label: 'Pedidos', path: '/app/pedidos', icon: 'orders' },
  { label: 'Ayuda', path: '/app/ayuda', icon: 'help' },
];

/** ViewModel del shell con la navegación filtrada por rol. */
@Injectable()
export class ShellStore {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Usuario autenticado. */
  readonly user = this.auth.user;
  /** El usuario actual es administrador. */
  readonly isAdmin = this.auth.isAdmin;
  /** Menú visible según el rol actual. */
  readonly menu = computed<readonly ShellMenuItem[]>(() => {
    const role = this.auth.role();
    return SHELL_MENU.filter((item) => !item.roles || (role !== null && item.roles.includes(role)));
  });
  /** Nombre visible de la persona usuaria. */
  readonly displayName = computed(() => this.user()?.fullName?.trim() || this.user()?.email || 'Usuario');
  /** Etiqueta legible del rol. */
  readonly roleLabel = computed(() => (this.isAdmin() ? 'Administración' : 'Equipo'));
  /** Iniciales para el avatar. */
  readonly initials = computed(() => {
    const parts = this.displayName().split(/\s+/).filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'O'
    );
  });

  /** Cierra la sesión y vuelve al inicio de sesión. */
  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
