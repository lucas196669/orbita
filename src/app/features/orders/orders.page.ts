import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';

import type { Order } from '../../core/models/order.model';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableCellDirective } from '../../shared/components/data-table/table-cell.directive';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import type { ExportColumn } from '../../shared/services/export.service';
import { ExportService } from '../../shared/services/export.service';

import { OrdersStore } from './orders.store';

const ORDER_EXPORT_COLUMNS: readonly ExportColumn<Order>[] = [
  { header: 'Pedido', value: (order) => order.id },
  { header: 'Producto', value: (order) => order.productName },
  { header: 'Categoría', value: (order) => order.productCategory },
  { header: 'Unidades', value: (order) => order.quantity },
  { header: 'Total', value: (order) => order.total },
  { header: 'Estado', value: (order) => order.status },
  { header: 'Fecha', value: (order) => formatOrderDate(order) },
];

/** Seguimiento de pedidos con la tabla de datos compartida. */
@Component({
  selector: 'app-orders',
  templateUrl: 'orders.page.html',
  styleUrls: ['orders.page.scss'],
  imports: [IonContent, DataTableComponent, TableCellDirective, ToastComponent],
  providers: [OrdersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly store = inject(OrdersStore);
  private readonly exportService = inject(ExportService);
  private readonly document = inject(DOCUMENT);

  /** Servicio de avisos accesibles. */
  readonly toast = inject(ToastService);

  /** ViewModel de la página. */
  readonly vm = this.store;

  /** Indica que se está generando un PDF. */
  readonly exporting = signal(false);

  /** Exporta los pedidos a CSV. */
  exportCsv(): void {
    const orders = this.vm.orders();

    if (orders.length === 0) {
      this.toast.show('No hay pedidos que exportar.');
      return;
    }

    this.exportService.exportCsv('orbita-pedidos', ORDER_EXPORT_COLUMNS, orders);
    this.toast.show('CSV generado correctamente.');
  }

  /** Exporta los pedidos a PDF. */
  async exportPdf(): Promise<void> {
    const orders = this.vm.orders();

    if (orders.length === 0) {
      this.toast.show('No hay pedidos que exportar.');
      return;
    }

    this.exporting.set(true);

    try {
      await this.exportService.exportPdf<Order>({
        filename: 'orbita-pedidos',
        title: 'Listado de pedidos',
        subtitle: 'Seguimiento de pedidos registrados en Orbita',
        columns: ORDER_EXPORT_COLUMNS,
        rows: orders,
        generatedBy: this.vm.displayName(),
        accentColor: this.readToken('--color-accent', '#c6f24e'),
        accentTextColor: this.readToken('--color-accent-contrast', '#0a0c11'),
      });
      this.toast.show('PDF generado correctamente.');
    } catch {
      this.toast.show('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      this.exporting.set(false);
    }
  }

  private readToken(token: string, fallback: string): string {
    const styles = this.document.defaultView?.getComputedStyle(this.document.documentElement);

    return styles?.getPropertyValue(token).trim() || fallback;
  }

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

/**
 * Formatea la fecha de un pedido para la exportación.
 *
 * @param order Pedido consultado.
 * @returns Fecha local corta o cadena vacía.
 */
function formatOrderDate(order: Order): string {
  if (!order.createdAt) {
    return '';
  }

  const date = new Date(order.createdAt);

  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES');
}
