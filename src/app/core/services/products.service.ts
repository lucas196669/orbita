import { inject, Injectable } from '@angular/core';

import { isProductCategory, type Product, type ProductCategory, type ProductInput } from '../models/product.model';

import { SupabaseService } from './supabase.service';

/** Fila de la tabla `products` tal y como llega de Supabase. */
interface ProductRow {
  readonly id: string | number;
  readonly name: string;
  readonly category: string;
  readonly price: number | string;
  readonly stock: number | string;
}

/** Acceso de solo lectura y escritura a la tabla relacional `products`. */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Lista todos los productos ordenados por nombre.
   *
   * @returns Productos normalizados.
   */
  async list(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, category, price, stock')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toProduct(row as ProductRow));
  }

  /**
   * Obtiene un producto por su identificador.
   *
   * @param id Identificador del producto.
   * @returns Producto encontrado o `null`.
   */
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, category, price, stock')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.toProduct(data as ProductRow) : null;
  }

  /**
   * Crea un producto.
   *
   * @param input Datos validados del formulario.
   * @returns Producto creado.
   */
  async create(input: ProductInput): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .insert({
        name: input.name,
        category: input.category,
        price: input.price,
        stock: input.stock,
      })
      .select('id, name, category, price, stock')
      .single();

    if (error) {
      throw error;
    }

    return this.toProduct(data as ProductRow);
  }

  /**
   * Elimina un producto por su identificador.
   *
   * @param id Identificador del producto.
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('products').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Actualiza un producto existente.
   *
   * @param id Identificador del producto.
   * @param input Datos validados del formulario.
   * @returns Producto actualizado.
   */
  async update(id: string, input: ProductInput): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .update({
        name: input.name,
        category: input.category,
        price: input.price,
        stock: input.stock,
      })
      .eq('id', id)
      .select('id, name, category, price, stock')
      .single();

    if (error) {
      throw error;
    }

    return this.toProduct(data as ProductRow);
  }

  private toProduct(row: ProductRow): Product {
    return {
      id: String(row.id),
      name: row.name,
      category: this.toCategory(row.category),
      price: Number(row.price),
      stock: Number(row.stock),
    };
  }

  private toCategory(value: string): ProductCategory {
    return isProductCategory(value) ? value : 'Otros';
  }
}
