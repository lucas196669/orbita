import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent } from '@ionic/angular';

/**
 * Página de presentación de la base visual de Orbita.
 *
 * Es una vista estática de la fase 0: no contiene lógica de negocio ni acceso a
 * datos, solo demuestra el sistema de diseño.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
