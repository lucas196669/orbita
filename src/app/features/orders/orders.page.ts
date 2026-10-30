import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableCellDirective } from '../../shared/components/data-table/table-cell.directive';

import { OrdersStore } from './orders.store';

/** Seguimiento de pedidos con la tabla de datos compartida. */
@Component({
  selector: 'app-orders',
  templateUrl: 'orders.page.html',
  styleUrls: ['orders.page.scss'],
  imports: [IonContent, DataTableComponent, TableCellDirective],
  providers: [OrdersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly store = inject(OrdersStore);

  /** ViewModel de la página. */
  readonly vm = this.store;

  /**
   * Obtiene el estado de una fila para la plantilla personalizada.
   *
   * @param row Fila de la tabla.
   * @returns Estado legible del pedido.
   */
  statusOf(row: unknown): string {
    return String((row as Record<string, unknown>)['status'] ?? '');
  }

  /**
   * Traduce el estado a una variante visual.
   *
   * @param row Fila de la tabla.
   * @returns Variante de color del estado.
   */
  statusTone(row: unknown): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (this.statusOf(row)) {
      case 'Pagado':
      case 'Entregado':
        return 'success';
      case 'Pendiente':
      case 'Enviado':
        return 'warning';
      case 'Cancelado':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
