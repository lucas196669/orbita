import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import type { ActivityLog } from '../../core/models/activity.model';
import type { Order } from '../../core/models/order.model';
import type { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreActivityService } from '../../core/services/firestore-activity.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { ThemeService } from '../../core/services/theme.service';

import { DashboardStore } from './dashboard.store';

const products: readonly Product[] = [
  { id: 'p1', name: 'Teclado', category: 'Hardware', price: 50, stock: 4 },
  { id: 'p2', name: 'Suite', category: 'Software', price: 50, stock: 20 },
];

function atDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

const orders: readonly Order[] = [
  {
    id: 'o1',
    productId: 'p1',
    productName: 'Teclado',
    productCategory: 'Hardware',
    quantity: 2,
    total: 100,
    status: 'Pagado',
    createdAt: atDaysAgo(0).toISOString(),
  },
  {
    id: 'o2',
    productId: 'p2',
    productName: 'Suite',
    productCategory: 'Software',
    quantity: 1,
    total: 50,
    status: 'Pendiente',
    createdAt: atDaysAgo(10).toISOString(),
  },
  {
    id: 'o3',
    productId: 'p1',
    productName: 'Teclado',
    productCategory: 'Hardware',
    quantity: 1,
    total: 30,
    status: 'Enviado',
    createdAt: atDaysAgo(45).toISOString(),
  },
];

const activity: readonly ActivityLog[] = [
  { id: 'a1', action: 'Producto creado', actor: 'ana@demo.com', createdAt: atDaysAgo(0) },
  { id: 'a2', action: 'Pedido registrado', actor: 'bruno@demo.com', createdAt: atDaysAgo(10) },
  { id: 'a3', action: 'Producto actualizado', actor: 'carla@demo.com', createdAt: atDaysAgo(45) },
];

interface SetupOptions {
  readonly productList?: () => Promise<readonly Product[]>;
  readonly orderList?: () => Promise<readonly Order[]>;
}

function setup(options: SetupOptions = {}): DashboardStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ProductsService,
        useValue: { list: options.productList ?? (() => Promise.resolve(products)) },
      },
      {
        provide: OrdersService,
        useValue: { list: options.orderList ?? (() => Promise.resolve(orders)) },
      },
      {
        provide: FirestoreActivityService,
        useValue: { activity$: () => of(activity), seedDemoData: () => Promise.resolve(30) },
      },
      {
        provide: AuthService,
        useValue: { user: signal({ fullName: 'Ana', email: 'ana@demo.com' }).asReadonly() },
      },
      { provide: ThemeService, useValue: { theme: signal<'light' | 'dark'>('dark').asReadonly() } },
      DashboardStore,
    ],
  });

  return TestBed.inject(DashboardStore);
}

function metricValue(store: DashboardStore, key: string): number | undefined {
  return store.metrics().find((metric) => metric.key === key)?.value;
}

describe('DashboardStore', () => {
  it('loads products, orders and activity', async () => {
    const store = setup();

    await vi.waitFor(() => expect(store.loading()).toBe(false));

    expect(store.products()).toHaveLength(2);
    expect(store.orders()).toHaveLength(3);
    expect(store.activity()).toHaveLength(3);
    expect(store.userName()).toBe('Ana');
    expect(store.activityLoading()).toBe(false);
  });

  it('computes metrics for the active period', async () => {
    const store = setup();
    await vi.waitFor(() => expect(store.loading()).toBe(false));

    expect(metricValue(store, 'revenue')).toBe(150);
    expect(metricValue(store, 'orders')).toBe(2);
    expect(metricValue(store, 'ticket')).toBe(75);
    expect(metricValue(store, 'stock')).toBe(24);
    expect(metricValue(store, 'low-stock')).toBe(1);
  });

  it('filters orders by range and category', async () => {
    const store = setup();
    await vi.waitFor(() => expect(store.loading()).toBe(false));

    store.setRange('7');
    expect(store.filteredOrders()).toHaveLength(1);
    expect(metricValue(store, 'revenue')).toBe(100);

    store.resetFilters();
    store.setCategory('Software');
    expect(store.filteredOrders()).toHaveLength(1);
    expect(metricValue(store, 'revenue')).toBe(50);
    expect(store.isFiltering()).toBe(true);

    store.resetFilters();
    expect(store.isFiltering()).toBe(false);
    expect(store.filteredOrders()).toHaveLength(2);
  });

  it('builds the category, product and activity aggregations', async () => {
    const store = setup();
    await vi.waitFor(() => expect(store.loading()).toBe(false));

    expect(store.revenueByCategory().find((entry) => entry.category === 'Hardware')?.revenue).toBe(100);
    expect(store.topProducts()[0]).toEqual({ name: 'Teclado', units: 2, revenue: 100 });
    expect(store.activityFeed()).toHaveLength(2);
    expect(store.activityByType()).toEqual([
      { action: 'Producto creado', count: 1 },
      { action: 'Pedido registrado', count: 1 },
    ]);

    store.selectCategoryAt(0);
    expect(store.category()).toBe('Hardware');
    store.selectCategoryAt(0);
    expect(store.category()).toBe('all');
  });

  it('keeps the error of a source without blocking the others', async () => {
    const store = setup({ productList: () => Promise.reject(new Error('offline')) });

    await vi.waitFor(() => expect(store.productsError()).not.toBeNull());

    expect(store.productsLoading()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.orders()).toHaveLength(3);
  });
});
