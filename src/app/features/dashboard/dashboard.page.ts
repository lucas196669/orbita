import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { DashboardStore } from './dashboard.store';

/** Placeholder del dashboard reservado al rol administrador. */
@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  providers: [DashboardStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly store = inject(DashboardStore);

  /** ViewModel de la página. */
  readonly vm = this.store;
}
