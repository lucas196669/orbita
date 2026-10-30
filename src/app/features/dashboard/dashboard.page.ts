import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { BaseChartDirective, provideCharts } from 'ng2-charts';

import type { Order } from '../../core/models/order.model';
import { isProductCategory, PRODUCT_CATEGORIES } from '../../core/models/product.model';
import { ToastService } from '../../core/services/toast.service';
import { StatWidgetComponent } from '../../shared/components/stat-widget/stat-widget.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import type { ExportColumn, ExportFilter } from '../../shared/services/export.service';
import { ExportService } from '../../shared/services/export.service';

import { DASHBOARD_CHART_COMPONENTS } from './dashboard-charts';
import { DashboardStore, type DashboardRange } from './dashboard.store';

interface RangeOption {
  readonly value: DashboardRange;
  readonly label: string;
}

interface ChartClickPayload {
  readonly active?: readonly object[];
}

const ORDER_EXPORT_COLUMNS: readonly ExportColumn<Order>[] = [
  { header: 'Pedido', value: (order) => order.id },
  { header: 'Producto', value: (order) => order.productName },
  { header: 'Categoría', value: (order) => order.productCategory },
  { header: 'Unidades', value: (order) => order.quantity },
  { header: 'Total', value: (order) => order.total },
  { header: 'Estado', value: (order) => order.status },
  { header: 'Fecha', value: (order) => formatOrderDate(order) },
];

/** Dashboard administrativo con métricas, gráficos y exportación de pedidos. */
@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  imports: [IonContent, CurrencyPipe, BaseChartDirective, StatWidgetComponent, ToastComponent],
  providers: [DashboardStore, provideCharts({ registerables: DASHBOARD_CHART_COMPONENTS })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly store = inject(DashboardStore);
  private readonly exportService = inject(ExportService);

  /** Servicio de avisos accesibles. */
  readonly toast = inject(ToastService);

  /** ViewModel de la página. */
  readonly vm = this.store;

  /** Categorías disponibles para filtrar. */
  readonly categories = PRODUCT_CATEGORIES;

  /** Rangos de fecha disponibles. */
  readonly ranges: readonly RangeOption[] = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' },
    { value: 'custom', label: 'Personalizado' },
  ];

  /** Indica que se está generando un PDF. */
  readonly exporting = signal(false);

  /** Indica que se están generando los datos de demostración. */
  readonly seeding = signal(false);

  private readonly seedDialog = viewChild<ElementRef<HTMLDialogElement>>('seedDialog');

  /**
   * Cambia el rango de fechas.
   *
   * @param range Nuevo rango.
   */
  setRange(range: DashboardRange): void {
    this.vm.setRange(range);
  }

  /**
   * Aplica la categoría seleccionada.
   *
   * @param event Evento del selector.
   */
  onCategoryChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const value = event.target.value;

    if (value === 'all' || isProductCategory(value)) {
      this.vm.setCategory(value);
    }
  }

  /**
   * Actualiza la fecha inicial personalizada.
   *
   * @param event Evento del campo de fecha.
   */
  onCustomStart(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.vm.setCustomStart(event.target.value);
    }
  }

  /**
   * Actualiza la fecha final personalizada.
   *
   * @param event Evento del campo de fecha.
   */
  onCustomEnd(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.vm.setCustomEnd(event.target.value);
    }
  }

  /**
   * Filtra por la categoría de la barra pulsada.
   *
   * @param payload Evento emitido por ng2-charts.
   */
  onCategoryChartClick(payload: ChartClickPayload): void {
    const index = readActiveIndex(payload.active);

    if (index !== null) {
      this.vm.selectCategoryAt(index);
    }
  }

  /** Exporta los pedidos filtrados a CSV. */
  exportCsv(): void {
    const orders = this.vm.filteredOrders();

    if (orders.length === 0) {
      this.toast.show('No hay pedidos que exportar con los filtros actuales.');
      return;
    }

    this.exportService.exportCsv('orbita-pedidos', ORDER_EXPORT_COLUMNS, orders);
    this.toast.show('CSV generado correctamente.');
  }

  /** Exporta los pedidos filtrados a PDF. */
  async exportPdf(): Promise<void> {
    const orders = this.vm.filteredOrders();

    if (orders.length === 0) {
      this.toast.show('No hay pedidos que exportar con los filtros actuales.');
      return;
    }

    this.exporting.set(true);

    try {
      await this.exportService.exportPdf<Order>({
        filename: 'orbita-pedidos',
        title: 'Informe de pedidos',
        subtitle: 'Actividad comercial del periodo seleccionado',
        columns: ORDER_EXPORT_COLUMNS,
        rows: orders,
        filters: this.exportFilters(),
        generatedBy: this.vm.userName(),
        accentColor: this.vm.palette().accent,
        accentTextColor: this.vm.palette().accentContrast,
      });
      this.toast.show('PDF generado correctamente.');
    } catch {
      this.toast.show('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      this.exporting.set(false);
    }
  }

  /** Abre el diálogo de confirmación de datos de ejemplo. */
  openSeedDialog(): void {
    this.seedDialog()?.nativeElement.showModal();
  }

  /** Cierra el diálogo de datos de ejemplo. */
  closeSeedDialog(): void {
    this.seedDialog()?.nativeElement.close();
  }

  /** Genera actividad de demostración en Firestore. */
  async confirmSeed(): Promise<void> {
    this.seeding.set(true);

    try {
      const created = await this.vm.seedDemoData();
      this.toast.show(
        created > 0
          ? `Se han añadido ${created} registros de actividad.`
          : 'Los datos de demostración ya estaban generados.',
      );
      this.closeSeedDialog();
    } catch {
      this.toast.show('No se pudieron generar los datos de demostración.');
    } finally {
      this.seeding.set(false);
    }
  }

  /**
   * Formatea la fecha de una entrada de actividad.
   *
   * @param value Fecha del evento.
   * @returns Fecha corta con hora.
   */
  formatActivityDate(value: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }

  private exportFilters(): readonly ExportFilter[] {
    return [
      { label: 'Periodo', value: this.vm.rangeLabel() },
      { label: 'Categoría', value: this.vm.categoryLabel() },
    ];
  }
}

/**
 * Obtiene el índice de la primera barra activa de un evento de Chart.js.
 *
 * @param active Elementos activos del evento.
 * @returns Índice o `null` si no hay datos válidos.
 */
function readActiveIndex(active: readonly object[] | undefined): number | null {
  const first = active?.[0];

  if (!first || !('index' in first)) {
    return null;
  }

  const index = (first as { readonly index?: unknown }).index;

  return typeof index === 'number' ? index : null;
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
