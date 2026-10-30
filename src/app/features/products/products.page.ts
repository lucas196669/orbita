import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ProductsStore } from './products.store';

/** Placeholder del módulo de productos. */
@Component({
  selector: 'app-products',
  templateUrl: 'products.page.html',
  providers: [ProductsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly store = inject(ProductsStore);

  /** ViewModel de la página. */
  readonly vm = this.store;
}
