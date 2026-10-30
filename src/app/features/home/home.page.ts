import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { StatWidgetComponent } from '../../shared/components/stat-widget/stat-widget.component';

import type { HomeStat } from './home.store';
import { HomeStore } from './home.store';

/** Página de bienvenida con un resumen adaptado al rol. */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, StatWidgetComponent],
  providers: [HomeStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(HomeStore);
  private readonly router = inject(Router);

  /** ViewModel de la página. */
  readonly vm = this.store;

  /**
   * Navega al módulo asociado a un indicador.
   *
   * @param stat Indicador activado.
   */
  open(stat: HomeStat): void {
    if (stat.link) {
      void this.router.navigateByUrl(stat.link);
    }
  }
}
