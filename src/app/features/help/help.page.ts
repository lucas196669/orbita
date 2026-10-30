import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { HelpStore } from './help.store';

/** Placeholder del módulo de ayuda. */
@Component({
  selector: 'app-help',
  templateUrl: 'help.page.html',
  providers: [HelpStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {
  private readonly store = inject(HelpStore);

  /** ViewModel de la página. */
  readonly vm = this.store;
}
