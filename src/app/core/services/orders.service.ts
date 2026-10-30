import { inject, Injectable } from '@angular/core';

import type { Order, OrderStatus } from '../models/order.model';
import { isProductCategory, type ProductCategory } from '../models/product.model';

import { SupabaseService } from './supabase.service';

/** Producto embebido por la relación de Supabase. */
interface OrderProductRow {
  readonly name?: string | null;
  readonly category?: string | null;
}

/** Fila de la tabla `orders` con su producto relacionado. */
interface OrderRow {
  readonly id: string | number;
  readonly product_id?: string | number | null;
  readonly quantity?: number | string | null;
  readonly total?: number | string | null;
  readonly status?: string | null;
  readonly created_at?: string | null;
  readonly products?: OrderProductRow | readonly OrderProductRow[] | null;
}

const STATUS_LABELS: Readonly<Record<string, OrderStatus>> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
};

/** Acceso de solo lectura a la tabla relacional `orders`. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Lista los pedidos con el nombre y la categoría de su producto.
   *
   * @returns Pedidos normalizados, del más reciente al más antiguo.
   */
  async list(): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, products(name, category)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toOrder(row as OrderRow));
  }

  private toOrder(row: OrderRow): Order {
    const product = this.firstProduct(row.products);

    return {
      id: String(row.id),
      productId: row.product_id === null || row.product_id === undefined ? null : String(row.product_id),
      productName: product?.name?.trim() || 'Producto sin nombre',
      productCategory: this.toCategory(product?.category ?? null),
      quantity: Number(row.quantity ?? 0),
      total: Number(row.total ?? 0),
      status: this.toStatus(row.status ?? null),
      createdAt: row.created_at ?? null,
    };
  }

  private firstProduct(value: OrderRow['products']): OrderProductRow | null {
    if (!value) {
      return null;
    }

    return Array.isArray(value) ? (value[0] ?? null) : (value as OrderProductRow);
  }

  private toCategory(value: string | null): ProductCategory {
    return value !== null && isProductCategory(value) ? value : 'Otros';
  }

  private toStatus(value: string | null): OrderStatus {
    if (value === null) {
      return 'Pendiente';
    }

    const normalized = value.trim();

    if (Object.values(STATUS_LABELS).includes(normalized as OrderStatus)) {
      return normalized as OrderStatus;
    }

    return STATUS_LABELS[normalized.toLowerCase()] ?? 'Pendiente';
  }
}
