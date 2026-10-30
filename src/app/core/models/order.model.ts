import type { ProductCategory } from './product.model';

/** Estados de pedido normalizados para la interfaz. */
export type OrderStatus = 'Pendiente' | 'Pagado' | 'Enviado' | 'Entregado' | 'Cancelado';

/** Pedido tal y como se consume en la interfaz. */
export interface Order {
  /** Identificador único del pedido. */
  readonly id: string;
  /** Identificador del producto asociado, si existe. */
  readonly productId: string | null;
  /** Nombre del producto asociado. */
  readonly productName: string;
  /** Categoría del producto asociado. */
  readonly productCategory: ProductCategory;
  /** Unidades solicitadas. */
  readonly quantity: number;
  /** Importe total del pedido en euros. */
  readonly total: number;
  /** Estado normalizado del pedido. */
  readonly status: OrderStatus;
  /** Fecha de creación en formato ISO. */
  readonly createdAt: string | null;
}
