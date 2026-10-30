import { Injectable, signal } from '@angular/core';

interface PlaceholderCard {
  readonly title: string;
  readonly description: string;
}

/** ViewModel del placeholder de dashboard. */
@Injectable()
export class DashboardStore {
  private readonly titleState = signal('Dashboard');
  private readonly descriptionState = signal(
    'El panel de indicadores está en preparación. Pronto reunirá ventas, pedidos y actividad en una sola vista.',
  );
  private readonly cardsState = signal<readonly PlaceholderCard[]>([
    { title: 'Ventas del mes', description: 'Evolución de ingresos y comparativa con el periodo anterior.' },
    { title: 'Pedidos activos', description: 'Volumen de pedidos en curso y tiempos de respuesta.' },
    { title: 'Actividad reciente', description: 'Últimos eventos registrados por el equipo.' },
  ]);

  /** Título de la página. */
  readonly title = this.titleState.asReadonly();
  /** Texto introductorio. */
  readonly description = this.descriptionState.asReadonly();
  /** Tarjetas esqueleto del módulo. */
  readonly cards = this.cardsState.asReadonly();
}
