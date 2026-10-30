import { computed, inject, Injectable, signal } from '@angular/core';

import type { Order } from '../../core/models/order.model';
import type { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import type { StatAccent, StatFormat } from '../../shared/components/stat-widget/stat-widget.model';
import { describeDataError } from '../../shared/utils/error-messages';

const DAY_MS = 86_400_000;
const TREND_DAYS = 7;
const SERIES_DAYS = 8;

/** Indicador mostrado en el resumen de inicio. */
export interface HomeStat {
  /** Etiqueta visible. */
  readonly label: string;
  /** Valor principal. */
  readonly value: number;
  /** Formato del valor. */
  readonly format: StatFormat;
  /** Variación porcentual o `null`. */
  readonly trend: number | null;
  /** Contexto de la tendencia. */
  readonly trendLabel: string | null;
  /** Trazado del icono. */
  readonly icon: string;
  /** Serie para la sparkline. */
  readonly series: readonly number[];
  /** Acento visual. */
  readonly accent: StatAccent;
  /** Ruta de destino al activar el widget. */
  readonly link: string | null;
}

/** ViewModel de la página de bienvenida con indicadores reales. */
@Injectable()
export class HomeStore {
  private readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);

  private readonly productsState = signal<Product[]>([]);
  private readonly ordersState = signal<Order[]>([]);
  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);

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

  /** Estado de carga de los indicadores. */
  readonly loading = this.loadingState.asReadonly();

  /** Error al cargar los indicadores. */
  readonly error = this.errorState.asReadonly();

  /** Indicadores calculados a partir de productos y pedidos. */
  readonly stats = computed<readonly HomeStat[]>(() => {
    const products = this.productsState();
    const orders = this.ordersState();
    const now = Date.now();
    const currentStart = now - TREND_DAYS * DAY_MS;
    const previousStart = now - TREND_DAYS * 2 * DAY_MS;

    const currentOrders = orders.filter((order) => this.timeOf(order) >= currentStart);
    const previousOrders = orders.filter((order) => {
      const time = this.timeOf(order);
      return time >= previousStart && time < currentStart;
    });

    const revenue = orders.reduce((total, order) => total + order.total, 0);
    const currentRevenue = currentOrders.reduce((total, order) => total + order.total, 0);
    const previousRevenue = previousOrders.reduce((total, order) => total + order.total, 0);
    const lowStock = products.filter((product) => product.stock < 5).length;

    return [
      {
        label: 'Productos',
        value: products.length,
        format: 'number',
        trend: null,
        trendLabel: null,
        icon: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
        series: [],
        accent: 'default',
        link: '/app/productos',
      },
      {
        label: 'Pedidos',
        value: orders.length,
        format: 'number',
        trend: percentChange(currentOrders.length, previousOrders.length),
        trendLabel: 'vs. 7 días previos',
        icon: 'M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 7h6M9 11h6M9 15h4',
        series: countSeries(orders),
        accent: 'success',
        link: '/app/pedidos',
      },
      {
        label: 'Ingresos',
        value: revenue,
        format: 'currency',
        trend: percentChange(currentRevenue, previousRevenue),
        trendLabel: 'vs. 7 días previos',
        icon: 'M14 6a4 4 0 1 0 0 12M4 10h10M4 14h8',
        series: revenueSeries(orders),
        accent: 'default',
        link: '/app/pedidos',
      },
      {
        label: 'Stock bajo',
        value: lowStock,
        format: 'number',
        trend: null,
        trendLabel: null,
        icon: 'M12 3l9 18H3L12 3zM12 9v5M12 17h.01',
        series: [],
        accent: lowStock > 0 ? 'danger' : 'success',
        link: '/app/productos',
      },
    ];
  });

  constructor() {
    void this.load();
  }

  /** Recarga productos y pedidos desde Supabase. */
  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const [products, orders] = await Promise.all([this.productsService.list(), this.ordersService.list()]);
      this.productsState.set(products);
      this.ordersState.set(orders);
    } catch (error) {
      this.errorState.set(describeDataError(error));
    } finally {
      this.loadingState.set(false);
    }
  }

  private timeOf(order: Order): number {
    return order.createdAt ? Date.parse(order.createdAt) : 0;
  }
}

/**
 * Calcula la variación porcentual entre dos periodos.
 *
 * @param current Valor del periodo actual.
 * @param previous Valor del periodo anterior.
 * @returns Variación redondeada a un decimal.
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Cuenta los pedidos de cada uno de los últimos días.
 *
 * @param orders Pedidos disponibles.
 * @returns Serie diaria de pedidos.
 */
function countSeries(orders: readonly Order[]): readonly number[] {
  const series = Array.from({ length: SERIES_DAYS }, () => 0);

  for (const order of orders) {
    const index = dayIndex(order);

    if (index !== null) {
      series[index] += 1;
    }
  }

  return series;
}

/**
 * Suma los ingresos de cada uno de los últimos días.
 *
 * @param orders Pedidos disponibles.
 * @returns Serie diaria de ingresos.
 */
function revenueSeries(orders: readonly Order[]): readonly number[] {
  const series = Array.from({ length: SERIES_DAYS }, () => 0);

  for (const order of orders) {
    const index = dayIndex(order);

    if (index !== null) {
      series[index] += order.total;
    }
  }

  return series;
}

/**
 * Obtiene la posición de un pedido dentro de la serie diaria.
 *
 * @param order Pedido a situar.
 * @returns Índice entre 0 y `SERIES_DAYS - 1`, o `null` si queda fuera.
 */
function dayIndex(order: Order): number | null {
  if (!order.createdAt) {
    return null;
  }

  const time = Date.parse(order.createdAt);

  if (Number.isNaN(time)) {
    return null;
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const diff = Math.floor((end.getTime() - time) / DAY_MS);

  return diff >= 0 && diff < SERIES_DAYS ? SERIES_DAYS - 1 - diff : null;
}
