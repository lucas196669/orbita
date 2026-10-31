import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartData, ChartOptions, TooltipOptions } from 'chart.js';
import { catchError, finalize, forkJoin, from, of, tap, type Observable } from 'rxjs';

import type { ActivityLog } from '../../core/models/activity.model';
import type { Order } from '../../core/models/order.model';
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreActivityService } from '../../core/services/firestore-activity.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { ThemeService } from '../../core/services/theme.service';
import type { StatAccent, StatFormat } from '../../shared/components/stat-widget/stat-widget.model';
import { describeDataError } from '../../shared/utils/error-messages';

import { readChartPalette, withAlpha, type ChartPalette } from './dashboard-chart-palette';

const DAY_MS = 86_400_000;
const LOW_STOCK_THRESHOLD = 10;
const MAX_FEED_ITEMS = 12;

/** Rangos de fecha disponibles en el dashboard. */
export type DashboardRange = '7' | '30' | '90' | 'custom';

/** Categoría activa o `all` para no filtrar. */
export type CategoryFilter = ProductCategory | 'all';

/** Punto diario de la serie de ingresos. */
export interface DailyPoint {
  /** Marca temporal del inicio del día. */
  readonly time: number;
  /** Etiqueta corta para el eje X. */
  readonly label: string;
  /** Ingresos acumulados del día. */
  readonly revenue: number;
  /** Número de pedidos del día. */
  readonly orders: number;
}

/** Ingresos agrupados por categoría. */
export interface CategoryRevenue {
  /** Categoría del producto. */
  readonly category: ProductCategory;
  /** Ingresos acumulados. */
  readonly revenue: number;
}

/** Producto agregado para el ranking. */
export interface ProductRanking {
  /** Nombre del producto. */
  readonly name: string;
  /** Unidades vendidas. */
  readonly units: number;
  /** Ingresos generados. */
  readonly revenue: number;
}

/** Actividad agrupada por tipo de acción. */
export interface ActivityTypeCount {
  /** Acción registrada. */
  readonly action: string;
  /** Número de eventos. */
  readonly count: number;
}

/** Indicador mostrado en los widgets del dashboard. */
export interface DashboardMetric {
  /** Identificador estable. */
  readonly key: string;
  /** Etiqueta visible. */
  readonly label: string;
  /** Valor principal. */
  readonly value: number;
  /** Formato del valor. */
  readonly format: StatFormat;
  /** Variación porcentual respecto al periodo anterior. */
  readonly trend: number | null;
  /** Contexto de la tendencia. */
  readonly trendLabel: string | null;
  /** Trazado del icono. */
  readonly icon: string;
  /** Serie para la sparkline. */
  readonly series: readonly number[];
  /** Acento visual. */
  readonly accent: StatAccent;
}

/**
 * ViewModel del dashboard administrativo.
 *
 * Carga productos y pedidos de Supabase de forma concurrente y mantiene un
 * flujo en directo de Firestore. Cada fuente conserva sus estados de carga y
 * error para que una caída no bloquee las demás, y todos los datos derivados
 * se calculan con `computed()` a partir de los filtros reactivos.
 */
@Injectable()
export class DashboardStore {
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);
  private readonly activityService = inject(FirestoreActivityService);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly productsState = signal<readonly Product[]>([]);
  private readonly ordersState = signal<readonly Order[]>([]);
  private readonly activityState = signal<readonly ActivityLog[]>([]);

  private readonly productsLoadingState = signal(true);
  private readonly ordersLoadingState = signal(true);
  private readonly activityLoadingState = signal(true);

  private readonly productsErrorState = signal<string | null>(null);
  private readonly ordersErrorState = signal<string | null>(null);
  private readonly activityErrorState = signal<string | null>(null);

  private readonly rangeState = signal<DashboardRange>('30');
  private readonly customStartState = signal(toDateInput(addDays(new Date(), -29)));
  private readonly customEndState = signal(toDateInput(new Date()));
  private readonly categoryState = signal<CategoryFilter>('all');

  private readonly paletteState = signal<ChartPalette>(readChartPalette(this.document));

  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Productos de Supabase. */
  readonly products = this.productsState.asReadonly();
  /** Pedidos de Supabase. */
  readonly orders = this.ordersState.asReadonly();
  /** Actividad en directo de Firestore. */
  readonly activity = this.activityState.asReadonly();

  /** Carga de productos. */
  readonly productsLoading = this.productsLoadingState.asReadonly();
  /** Carga de pedidos. */
  readonly ordersLoading = this.ordersLoadingState.asReadonly();
  /** Carga de actividad. */
  readonly activityLoading = this.activityLoadingState.asReadonly();

  /** Error de productos. */
  readonly productsError = this.productsErrorState.asReadonly();
  /** Error de pedidos. */
  readonly ordersError = this.ordersErrorState.asReadonly();
  /** Error de actividad. */
  readonly activityError = this.activityErrorState.asReadonly();

  /** Rango de fechas seleccionado. */
  readonly range = this.rangeState.asReadonly();
  /** Fecha inicial personalizada en formato `yyyy-mm-dd`. */
  readonly customStart = this.customStartState.asReadonly();
  /** Fecha final personalizada en formato `yyyy-mm-dd`. */
  readonly customEnd = this.customEndState.asReadonly();
  /** Categoría seleccionada. */
  readonly category = this.categoryState.asReadonly();

  /** Paleta de gráficos resuelta desde los tokens CSS. */
  readonly palette = this.paletteState.asReadonly();

  /** Nombre visible de la persona autenticada. */
  readonly userName = computed(() => this.auth.user()?.fullName?.trim() || this.auth.user()?.email || 'Usuario');

  /** El dashboard está cargando datos relacionales. */
  readonly loading = computed(() => this.productsLoadingState() || this.ordersLoadingState());

  /** Hay alguna fuente con error. */
  readonly hasError = computed(
    () => this.productsErrorState() !== null || this.ordersErrorState() !== null || this.activityErrorState() !== null,
  );

  /** Inicio del periodo activo. */
  readonly rangeStart = computed(() => {
    const preset = this.rangeState();

    if (preset === 'custom') {
      const start = parseDateInput(this.customStartState(), addDays(new Date(), -29));
      const end = parseDateInput(this.customEndState(), new Date());

      return startOfDay(start.getTime() > end.getTime() ? end : start);
    }

    return startOfDay(addDays(new Date(), -(Number(preset) - 1)));
  });

  /** Fin del periodo activo. */
  readonly rangeEnd = computed(() => {
    const preset = this.rangeState();

    if (preset === 'custom') {
      const start = parseDateInput(this.customStartState(), addDays(new Date(), -29));
      const end = parseDateInput(this.customEndState(), new Date());

      return endOfDay(start.getTime() > end.getTime() ? start : end);
    }

    return endOfDay(new Date());
  });

  /** Número de días del periodo activo. */
  readonly rangeDays = computed(() =>
    Math.max(1, Math.round((this.rangeEnd().getTime() - this.rangeStart().getTime()) / DAY_MS) + 1),
  );

  /** Descripción legible del periodo. */
  readonly rangeLabel = computed(() => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return `${formatter.format(this.rangeStart())} – ${formatter.format(this.rangeEnd())}`;
  });

  /** Etiqueta legible de la categoría activa. */
  readonly categoryLabel = computed(() =>
    this.categoryState() === 'all' ? 'Todas las categorías' : this.categoryState(),
  );

  /** Pedidos del periodo y categoría seleccionados. */
  readonly filteredOrders = computed<readonly Order[]>(() => {
    const start = this.rangeStart().getTime();
    const end = this.rangeEnd().getTime();
    const category = this.categoryState();

    return this.ordersState().filter((order) => {
      const time = orderTime(order);
      return time >= start && time <= end && (category === 'all' || order.productCategory === category);
    });
  });

  /** Pedidos del periodo inmediatamente anterior con la misma duración. */
  readonly previousOrders = computed<readonly Order[]>(() => {
    const length = this.rangeEnd().getTime() - this.rangeStart().getTime();
    const previousEnd = this.rangeStart().getTime() - 1;
    const previousStart = previousEnd - length;
    const category = this.categoryState();

    return this.ordersState().filter((order) => {
      const time = orderTime(order);
      return time >= previousStart && time <= previousEnd && (category === 'all' || order.productCategory === category);
    });
  });

  /** Productos que respetan el filtro de categoría. */
  readonly filteredProducts = computed<readonly Product[]>(() => {
    const category = this.categoryState();
    return this.productsState().filter((product) => category === 'all' || product.category === category);
  });

  /** Serie diaria de ingresos y pedidos. */
  readonly dailyData = computed<readonly DailyPoint[]>(() => {
    const start = this.rangeStart().getTime();
    const end = this.rangeEnd().getTime();
    const days = this.rangeDays();
    const formatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
    const buckets = new Map<number, { revenue: number; orders: number }>();

    for (let index = 0; index < days; index += 1) {
      const time = start + index * DAY_MS;
      buckets.set(time, { revenue: 0, orders: 0 });
    }

    for (const order of this.filteredOrders()) {
      const key = startOfDay(orderTime(order)).getTime();
      const bucket = buckets.get(key);

      if (bucket) {
        bucket.revenue += order.total;
        bucket.orders += 1;
      }
    }

    return Array.from(buckets.entries())
      .sort(([left], [right]) => left - right)
      .map(([time, value]) => ({
        time,
        label: formatter.format(new Date(time)),
        revenue: Math.round(value.revenue * 100) / 100,
        orders: value.orders,
      }))
      .filter((point) => point.time <= end);
  });

  /** Ingresos por categoría en el periodo. */
  readonly revenueByCategory = computed<readonly CategoryRevenue[]>(() => {
    const totals = new Map<ProductCategory, number>(PRODUCT_CATEGORIES.map((category) => [category, 0]));

    for (const order of this.filteredOrders()) {
      totals.set(order.productCategory, (totals.get(order.productCategory) ?? 0) + order.total);
    }

    return PRODUCT_CATEGORIES.map((category) => ({
      category,
      revenue: Math.round((totals.get(category) ?? 0) * 100) / 100,
    }));
  });

  /** Top 5 productos por unidades vendidas. */
  readonly topProducts = computed<readonly ProductRanking[]>(() => {
    const ranking = new Map<string, ProductRanking>();

    for (const order of this.filteredOrders()) {
      const current = ranking.get(order.productName) ?? {
        name: order.productName,
        units: 0,
        revenue: 0,
      };

      ranking.set(order.productName, {
        name: current.name,
        units: current.units + order.quantity,
        revenue: Math.round((current.revenue + order.total) * 100) / 100,
      });
    }

    return Array.from(ranking.values())
      .sort((left, right) => right.units - left.units || right.revenue - left.revenue)
      .slice(0, 5);
  });

  /** Actividad del periodo agrupada por tipo. */
  readonly activityByType = computed<readonly ActivityTypeCount[]>(() => {
    const start = this.rangeStart().getTime();
    const end = this.rangeEnd().getTime();
    const counts = new Map<string, number>();

    for (const entry of this.activityState()) {
      const time = entry.createdAt.getTime();

      if (time >= start && time <= end) {
        counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((left, right) => right.count - left.count);
  });

  /** Actividad reciente filtrada por el periodo, lista para el feed. */
  readonly activityFeed = computed<readonly ActivityLog[]>(() => {
    const start = this.rangeStart().getTime();
    const end = this.rangeEnd().getTime();

    return this.activityState()
      .filter((entry) => {
        const time = entry.createdAt.getTime();
        return time >= start && time <= end;
      })
      .slice(0, MAX_FEED_ITEMS);
  });

  /** Los filtros no están en su estado inicial. */
  readonly isFiltering = computed(() => this.rangeState() !== '30' || this.categoryState() !== 'all');

  /** No hay pedidos en el periodo seleccionado. */
  readonly hasOrders = computed(() => this.filteredOrders().length > 0);

  /** Métricas principales del dashboard. */
  readonly metrics = computed<readonly DashboardMetric[]>(() => {
    const orders = this.filteredOrders();
    const previous = this.previousOrders();
    const products = this.filteredProducts();
    const revenue = sumBy(orders, (order) => order.total);
    const previousRevenue = sumBy(previous, (order) => order.total);
    const averageTicket = orders.length > 0 ? revenue / orders.length : 0;
    const previousAverage = previous.length > 0 ? previousRevenue / previous.length : 0;
    const stock = products.reduce((total, product) => total + Math.max(0, product.stock), 0);
    const lowStock = products.filter((product) => product.stock < LOW_STOCK_THRESHOLD).length;
    const revenueSeries = this.dailyData().map((point) => point.revenue);
    const orderSeries = this.dailyData().map((point) => point.orders);

    return [
      {
        key: 'revenue',
        label: 'Ingresos totales',
        value: round(revenue),
        format: 'currency',
        trend: percentChange(revenue, previousRevenue),
        trendLabel: 'vs. periodo anterior',
        icon: 'M14 6a4 4 0 1 0 0 12M4 10h10M4 14h8',
        series: revenueSeries,
        accent: 'default',
      },
      {
        key: 'orders',
        label: 'Pedidos',
        value: orders.length,
        format: 'number',
        trend: percentChange(orders.length, previous.length),
        trendLabel: 'vs. periodo anterior',
        icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
        series: orderSeries,
        accent: 'success',
      },
      {
        key: 'ticket',
        label: 'Ticket medio',
        value: round(averageTicket),
        format: 'currency',
        trend: percentChange(averageTicket, previousAverage),
        trendLabel: 'vs. periodo anterior',
        icon: 'M4 7h16v10H4zM8 7V5h8v2M8 12h8',
        series: revenueSeries.map((value, index) => (orderSeries[index] ? value / orderSeries[index] : 0)),
        accent: 'default',
      },
      {
        key: 'stock',
        label: 'Stock total',
        value: stock,
        format: 'number',
        trend: null,
        trendLabel: null,
        icon: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10',
        series: [],
        accent: 'default',
      },
      {
        key: 'low-stock',
        label: 'Stock bajo',
        value: lowStock,
        format: 'number',
        trend: null,
        trendLabel: null,
        icon: 'M12 3l9 18H3L12 3zM12 9v5M12 17h.01',
        series: [],
        accent: lowStock > 0 ? 'danger' : 'success',
      },
    ];
  });

  /** Datos del gráfico de ingresos por día. */
  readonly revenueChartData = computed<ChartData<'line', number[], string>>(() => ({
    labels: this.dailyData().map((point) => point.label),
    datasets: [
      {
        label: 'Ingresos (€)',
        data: this.dailyData().map((point) => point.revenue),
        borderColor: this.paletteState().accent,
        backgroundColor: withAlpha(this.paletteState().accent, 0.18),
        pointBackgroundColor: this.paletteState().accent,
        pointBorderColor: this.paletteState().surface,
        fill: true,
        tension: 0.35,
      },
    ],
  }));

  /** Datos del gráfico de ingresos por categoría. */
  readonly categoryChartData = computed<ChartData<'bar', number[], string>>(() => ({
    labels: this.revenueByCategory().map((entry) => entry.category),
    datasets: [
      {
        label: 'Ingresos (€)',
        data: this.revenueByCategory().map((entry) => entry.revenue),
        backgroundColor: withAlpha(this.paletteState().accent, 0.75),
        borderColor: this.paletteState().accent,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }));

  /** Datos del gráfico de actividad por tipo. */
  readonly activityChartData = computed<ChartData<'doughnut', number[], string>>(() => {
    const palette = this.paletteState();
    const entries = this.activityByType();

    return {
      labels: entries.map((entry) => entry.action),
      datasets: [
        {
          label: 'Eventos',
          data: entries.map((entry) => entry.count),
          backgroundColor: [palette.accent, palette.success, palette.warning, palette.danger, palette.textMuted],
          borderColor: palette.surface,
          borderWidth: 2,
        },
      ],
    };
  });

  /** Datos del gráfico horizontal de top productos. */
  readonly topProductsChartData = computed<ChartData<'bar', number[], string>>(() => ({
    labels: this.topProducts().map((product) => product.name),
    datasets: [
      {
        label: 'Unidades vendidas',
        data: this.topProducts().map((product) => product.units),
        backgroundColor: withAlpha(this.paletteState().success, 0.7),
        borderColor: this.paletteState().success,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }));

  /** Opciones del gráfico de líneas. */
  readonly revenueChartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: this.reducedMotion ? false : { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipOptions(),
    },
    scales: {
      x: {
        ticks: { color: this.paletteState().textMuted, maxRotation: 0, autoSkip: true },
        grid: { color: withAlpha(this.paletteState().border, 0.4) },
      },
      y: {
        beginAtZero: true,
        ticks: { color: this.paletteState().textMuted },
        grid: { color: withAlpha(this.paletteState().border, 0.6) },
      },
    },
  }));

  /** Opciones del gráfico de barras por categoría. */
  readonly categoryChartOptions = computed<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: this.reducedMotion ? false : { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipOptions(),
    },
    scales: {
      x: {
        ticks: { color: this.paletteState().textMuted },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: this.paletteState().textMuted },
        grid: { color: withAlpha(this.paletteState().border, 0.6) },
      },
    },
  }));

  /** Opciones del gráfico de actividad. */
  readonly activityChartOptions = computed<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: this.reducedMotion ? false : { duration: 400 },
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: this.paletteState().textMuted,
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      tooltip: this.tooltipOptions(),
    },
  }));

  /** Opciones del gráfico horizontal de top productos. */
  readonly topProductsChartOptions = computed<ChartOptions<'bar'>>(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: this.reducedMotion ? false : { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipOptions(),
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: this.paletteState().textMuted, precision: 0 },
        grid: { color: withAlpha(this.paletteState().border, 0.6) },
      },
      y: {
        ticks: { color: this.paletteState().textMuted },
        grid: { display: false },
      },
    },
  }));

  constructor() {
    this.load();

    effect(() => {
      this.theme.theme();
      this.paletteState.set(readChartPalette(this.document));
    });
  }

  /** Carga productos y pedidos en paralelo y abre el flujo de actividad. */
  load(): void {
    this.productsLoadingState.set(true);
    this.productsErrorState.set(null);
    this.ordersLoadingState.set(true);
    this.ordersErrorState.set(null);

    forkJoin([this.productsRequest(), this.ordersRequest()]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.connectActivity();
  }

  /** Reintenta únicamente la carga de productos. */
  retryProducts(): void {
    this.productsLoadingState.set(true);
    this.productsErrorState.set(null);
    this.productsRequest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Reintenta únicamente la carga de pedidos. */
  retryOrders(): void {
    this.ordersLoadingState.set(true);
    this.ordersErrorState.set(null);
    this.ordersRequest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Reconecta el feed de actividad. */
  retryActivity(): void {
    this.connectActivity();
  }

  /**
   * Cambia el rango de fechas.
   *
   * @param range Nuevo rango.
   */
  setRange(range: DashboardRange): void {
    this.rangeState.set(range);
  }

  /**
   * Actualiza la fecha inicial personalizada.
   *
   * @param value Fecha en formato `yyyy-mm-dd`.
   */
  setCustomStart(value: string): void {
    this.customStartState.set(value);
    this.rangeState.set('custom');
  }

  /**
   * Actualiza la fecha final personalizada.
   *
   * @param value Fecha en formato `yyyy-mm-dd`.
   */
  setCustomEnd(value: string): void {
    this.customEndState.set(value);
    this.rangeState.set('custom');
  }

  /**
   * Aplica una categoría al dashboard.
   *
   * @param category Categoría o `all`.
   */
  setCategory(category: CategoryFilter): void {
    this.categoryState.set(category);
  }

  /**
   * Alterna la categoría activa al pulsar una barra del gráfico.
   *
   * @param category Categoría pulsada.
   */
  toggleCategory(category: ProductCategory): void {
    this.categoryState.update((current) => (current === category ? 'all' : category));
  }

  /**
   * Aplica la categoría situada en una posición del gráfico.
   *
   * @param index Índice de la barra.
   */
  selectCategoryAt(index: number): void {
    const entry = this.revenueByCategory()[index];

    if (entry) {
      this.toggleCategory(entry.category);
    }
  }

  /** Restablece los filtros a su estado inicial. */
  resetFilters(): void {
    this.rangeState.set('30');
    this.categoryState.set('all');
    this.customStartState.set(toDateInput(addDays(new Date(), -29)));
    this.customEndState.set(toDateInput(new Date()));
  }

  /**
   * Genera los registros de actividad de demostración.
   *
   * @returns Número de documentos insertados.
   */
  async seedDemoData(): Promise<number> {
    const created = await this.activityService.seedDemoData();
    this.connectActivity();

    return created;
  }

  private productsRequest(): Observable<readonly Product[]> {
    return from(this.productsService.list()).pipe(
      tap((products) => this.productsState.set(products)),
      catchError((error: unknown) => {
        this.productsErrorState.set(describeDataError(error));
        return of([] as readonly Product[]);
      }),
      finalize(() => this.productsLoadingState.set(false)),
    );
  }

  private ordersRequest(): Observable<readonly Order[]> {
    return from(this.ordersService.list()).pipe(
      tap((orders) => this.ordersState.set(orders)),
      catchError((error: unknown) => {
        this.ordersErrorState.set(describeDataError(error));
        return of([] as readonly Order[]);
      }),
      finalize(() => this.ordersLoadingState.set(false)),
    );
  }

  private connectActivity(): void {
    this.activityLoadingState.set(true);
    this.activityErrorState.set(null);

    this.activityService
      .activity$(50)
      .pipe(
        catchError((error: unknown) => {
          this.activityErrorState.set(describeDataError(error));
          return of([] as readonly ActivityLog[]);
        }),
        finalize(() => this.activityLoadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((entries) => this.activityState.set(entries));
  }

  private tooltipOptions(): Partial<TooltipOptions> {
    return {
      backgroundColor: this.paletteState().surfaceRaised,
      titleColor: this.paletteState().text,
      bodyColor: this.paletteState().text,
      borderColor: this.paletteState().border,
      borderWidth: 1,
      padding: 10,
    };
  }
}

/**
 * Suma un valor numérico de cada elemento.
 *
 * @param items Elementos a sumar.
 * @param select Valor numérico.
 * @returns Suma total.
 */
function sumBy<T>(items: readonly T[], select: (item: T) => number): number {
  return items.reduce((total, item) => total + select(item), 0);
}

/**
 * Calcula la variación porcentual entre dos periodos.
 *
 * @param current Valor actual.
 * @param previous Valor anterior.
 * @returns Variación con un decimal o `null` si no hay base comparable.
 */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Redondea un importe a dos decimales.
 *
 * @param value Valor original.
 * @returns Valor redondeado.
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Obtiene la marca temporal de un pedido.
 *
 * @param order Pedido consultado.
 * @returns Milisegundos o 0 cuando no hay fecha válida.
 */
function orderTime(order: Order): number {
  if (!order.createdAt) {
    return 0;
  }

  const time = Date.parse(order.createdAt);

  return Number.isNaN(time) ? 0 : time;
}

/**
 * Normaliza una fecha al inicio del día local.
 *
 * @param value Fecha o marca temporal.
 * @returns Nueva fecha al inicio del día.
 */
function startOfDay(value: Date | number): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Normaliza una fecha al final del día local.
 *
 * @param value Fecha o marca temporal.
 * @returns Nueva fecha al final del día.
 */
function endOfDay(value: Date | number): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Suma días a una fecha.
 *
 * @param value Fecha original.
 * @param days Días a sumar, pueden ser negativos.
 * @returns Nueva fecha.
 */
function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Convierte una fecha al valor de un input `type="date"`.
 *
 * @param value Fecha a convertir.
 * @returns Cadena `yyyy-mm-dd`.
 */
function toDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Interpreta el valor de un input de fecha.
 *
 * @param value Cadena `yyyy-mm-dd`.
 * @param fallback Fecha usada si el valor no es válido.
 * @returns Fecha interpretada.
 */
function parseDateInput(value: string, fallback: Date): Date {
  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}
