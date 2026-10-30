import { computed, inject, Injectable, signal } from '@angular/core';

import type { Order } from '../../core/models/order.model';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import type { TableColumn } from '../../shared/components/data-table/data-table.model';
import { describeDataError } from '../../shared/utils/error-messages';

/** ViewModel del listado de pedidos. */
@Injectable()
export class OrdersStore {
  private readonly ordersService = inject(OrdersService);
  private readonly auth = inject(AuthService);

  private readonly ordersState = signal<Order[]>([]);
  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);

  /** Pedidos cargados desde Supabase. */
  readonly orders = this.ordersState.asReadonly();

  /** Estado de carga del listado. */
  readonly loading = this.loadingState.asReadonly();

  /** Error de carga del listado. */
  readonly error = this.errorState.asReadonly();

  /** Nombre visible de la persona autenticada. */
  readonly displayName = computed(() => this.auth.user()?.fullName || this.auth.user()?.email || 'Usuario');

  /** Columnas de la tabla de pedidos. */
  readonly columns: readonly TableColumn<Order>[] = [
    { key: 'id', header: 'Pedido', sortable: true },
    { key: 'productName', header: 'Producto', sortable: true },
    { key: 'productCategory', header: 'Categoría', format: 'badge', sortable: true },
    { key: 'quantity', header: 'Unidades', format: 'number', align: 'end', sortable: true },
    { key: 'total', header: 'Total', format: 'currency', align: 'end', sortable: true },
    { key: 'status', header: 'Estado', format: 'badge', sortable: true },
    { key: 'createdAt', header: 'Fecha', format: 'date', align: 'end', sortable: true },
  ];

  constructor() {
    void this.load();
  }

  /** Recarga los pedidos desde Supabase. */
  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      this.ordersState.set(await this.ordersService.list());
    } catch (error) {
      this.errorState.set(describeDataError(error));
    } finally {
      this.loadingState.set(false);
    }
  }
}
