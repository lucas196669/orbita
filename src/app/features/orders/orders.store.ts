import { Injectable, signal } from '@angular/core';

interface PlaceholderCard {
  readonly title: string;
  readonly description: string;
}

/** ViewModel del placeholder de pedidos. */
@Injectable()
export class OrdersStore {
  private readonly titleState = signal('Pedidos');
  private readonly descriptionState = signal(
    'El seguimiento de pedidos estará disponible con estados, prioridades y filtros por fecha.',
  );
  private readonly cardsState = signal<readonly PlaceholderCard[]>([
    { title: 'Cola de pedidos', description: 'Pedidos pendientes ordenados por prioridad y antigüedad.' },
    { title: 'Envíos', description: 'Estado de cada entrega y datos de seguimiento.' },
    { title: 'Incidencias', description: 'Pedidos que requieren revisión o intervención del equipo.' },
  ]);

  /** Título de la página. */
  readonly title = this.titleState.asReadonly();
  /** Texto introductorio. */
  readonly description = this.descriptionState.asReadonly();
  /** Tarjetas esqueleto del módulo. */
  readonly cards = this.cardsState.asReadonly();
}
