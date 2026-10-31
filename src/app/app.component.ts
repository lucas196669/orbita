import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular';

import { RouteAnnouncerService } from './core/services/route-announcer.service';

/** Componente raíz de Orbita. Contiene el contenedor de Ionic y el router outlet. */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly routeAnnouncer = inject(RouteAnnouncerService);

  /** Anuncio de la ruta activa para lectores de pantalla. */
  readonly routeAnnouncement = this.routeAnnouncer.message;

  constructor() {
    this.routeAnnouncer.start();
  }
}
