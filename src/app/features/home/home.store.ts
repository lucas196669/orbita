import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

interface HomeHighlight {
  readonly title: string;
  readonly description: string;
}

/** ViewModel de la página de bienvenida. */
@Injectable()
export class HomeStore {
  private readonly auth = inject(AuthService);

  /** Usuario autenticado. */
  readonly user = this.auth.user;
  /** El usuario pertenece a administración. */
  readonly isAdmin = this.auth.isAdmin;
  /** Nombre visible de la persona usuaria. */
  readonly displayName = computed(() => this.user()?.fullName?.trim() || this.user()?.email || 'equipo');
  /** Etiqueta legible del rol. */
  readonly roleLabel = computed(() => (this.isAdmin() ? 'Administración' : 'Equipo'));
  /** Resumen contextual según el rol. */
  readonly greeting = computed(() =>
    this.isAdmin()
      ? 'Tienes visibilidad completa del catálogo, los pedidos y la actividad del panel.'
      : 'Aquí tienes un resumen de tu espacio de trabajo y de los módulos disponibles.',
  );
  /** Tarjetas de resumen adaptadas al rol. */
  readonly highlights = computed<readonly HomeHighlight[]>(() =>
    this.isAdmin()
      ? [
          {
            title: 'Control del dashboard',
            description: 'Accede a los indicadores globales y al rendimiento de la operación.',
          },
          {
            title: 'Productos y pedidos',
            description: 'Gestiona el catálogo y sigue el estado de cada pedido del equipo.',
          },
          {
            title: 'Actividad del sistema',
            description: 'Revisa los eventos recientes para detectar cambios y bloqueos.',
          },
        ]
      : [
          {
            title: 'Tu catálogo',
            description: 'Consulta los productos disponibles y su información principal.',
          },
          {
            title: 'Tus pedidos',
            description: 'Sigue el estado de los pedidos que forman parte de tu trabajo diario.',
          },
          {
            title: 'Ayuda',
            description: 'Encuentra respuestas y guías para usar el panel sin fricción.',
          },
        ],
  );
}
