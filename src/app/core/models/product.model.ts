/** Categorías disponibles para clasificar productos. */
export const PRODUCT_CATEGORIES = ['Hardware', 'Software', 'Accesorios', 'Servicios', 'Otros'] as const;

/** Categoría válida de un producto. */
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Producto tal y como se consume en la interfaz. */
export interface Product {
  /** Identificador único del producto. */
  readonly id: string;
  /** Nombre comercial del producto. */
  readonly name: string;
  /** Categoría a la que pertenece. */
  readonly category: ProductCategory;
  /** Precio unitario en euros. */
  readonly price: number;
  /** Unidades disponibles en inventario. */
  readonly stock: number;
}

/** Datos editables de un producto para crear o actualizar registros. */
export interface ProductInput {
  /** Nombre comercial del producto. */
  readonly name: string;
  /** Categoría a la que pertenece. */
  readonly category: ProductCategory;
  /** Precio unitario en euros. */
  readonly price: number;
  /** Unidades disponibles en inventario. */
  readonly stock: number;
}

/**
 * Comprueba si un valor pertenece a las categorías conocidas.
 *
 * @param value Valor a comprobar.
 * @returns `true` si el valor es una categoría válida.
 */
export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
