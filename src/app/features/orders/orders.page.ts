import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { OrdersStore } from './orders.store';

/** Placeholder del módulo de pedidos. */
@Component({
  selector: 'app-orders',
  templateUrl: 'orders.page.html',
  providers: [OrdersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly store = inject(OrdersStore);

  /** ViewModel de la página. */
  readonly vm = this.store;
}
