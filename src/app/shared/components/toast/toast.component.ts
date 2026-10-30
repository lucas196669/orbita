import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Aviso efímero accesible anunciado por lectores de pantalla. */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  /** Texto del aviso. */
  @Input({ required: true }) message = '';

  /** Se emite cuando la persona usuaria cierra el aviso. */
  @Output() readonly dismissed = new EventEmitter<void>();
}
