import { computed, inject, Injectable, signal } from '@angular/core';

import type { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { ProductsService } from '../../../core/services/products.service';
import type { RowAction, TableColumn } from '../../../shared/components/data-table/data-table.model';
import { describeDataError } from '../../../shared/utils/error-messages';

/** ViewModel del listado de productos basado en la tabla compartida. */
@Injectable()
export class ProductListStore {
  private readonly productsService = inject(ProductsService);
  private readonly auth = inject(AuthService);

  private readonly productsState = signal<Product[]>([]);
  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);

  /** Productos cargados desde Supabase. */
  readonly products = this.productsState.asReadonly();

  /** Estado de carga del listado. */
  readonly loading = this.loadingState.asReadonly();

  /** Error de carga del listado. */
  readonly error = this.errorState.asReadonly();

  /** Indica si la persona usuaria puede administrar el catálogo. */
  readonly isAdmin = computed(() => this.auth.role() === 'admin');

  /** Nombre visible de la persona autenticada. */
  readonly displayName = computed(() => this.auth.user()?.fullName || this.auth.user()?.email || 'Usuario');

  /** Columnas de la tabla de productos. */
  readonly columns: readonly TableColumn<Product>[] = [
    { key: 'name', header: 'Producto', sortable: true },
    { key: 'category', header: 'Categoría', format: 'badge', sortable: true },
    { key: 'price', header: 'Precio', format: 'currency', align: 'end', sortable: true },
    { key: 'stock', header: 'Stock', format: 'number', align: 'end', sortable: true },
  ];

  /** Acciones de fila disponibles para el rol actual. */
  readonly actions = computed<readonly RowAction[]>(() =>
    this.isAdmin()
      ? [
          {
            id: 'edit',
            label: 'Editar',
            icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
          },
          {
            id: 'delete',
            label: 'Eliminar',
            icon: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5',
          },
        ]
      : [],
  );

  constructor() {
    void this.load();
  }

  /** Recarga el catálogo desde Supabase. */
  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      this.productsState.set(await this.productsService.list());
    } catch (error) {
      this.errorState.set(describeDataError(error));
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Elimina un producto y lo retira del listado local.
   *
   * @param id Identificador del producto.
   */
  async remove(id: string): Promise<void> {
    await this.productsService.delete(id);
    this.productsState.update((products) => products.filter((product) => product.id !== id));
  }
}
