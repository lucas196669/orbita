import { Injectable, signal } from '@angular/core';

interface PlaceholderCard {
  readonly title: string;
  readonly description: string;
}

/** ViewModel del placeholder de productos. */
@Injectable()
export class ProductsStore {
  private readonly titleState = signal('Productos');
  private readonly descriptionState = signal(
    'El catálogo llegará en la siguiente fase con búsqueda, filtros y detalle de cada producto.',
  );
  private readonly cardsState = signal<readonly PlaceholderCard[]>([
    { title: 'Catálogo', description: 'Listado completo de productos con su información principal.' },
    { title: 'Stock', description: 'Disponibilidad y alertas de reposición por producto.' },
    { title: 'Categorías', description: 'Organización del catálogo para encontrar cada artículo.' },
  ]);

  /** Título de la página. */
  readonly title = this.titleState.asReadonly();
  /** Texto introductorio. */
  readonly description = this.descriptionState.asReadonly();
  /** Tarjetas esqueleto del módulo. */
  readonly cards = this.cardsState.asReadonly();
}
