import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { HomeStore } from './home.store';

/** Página de bienvenida con un resumen adaptado al rol. */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  providers: [HomeStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(HomeStore);

  /** ViewModel de la página. */
  readonly vm = this.store;
}
