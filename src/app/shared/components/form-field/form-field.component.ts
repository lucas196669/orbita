import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Envoltorio accesible para un campo de formulario.
 *
 * Proyecta el control real con `ng-content` y añade etiqueta visible, ayuda,
 * estado de validación pendiente y mensajes de error asociados por id.
 */
@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  /** Identificador del control proyectado. */
  @Input({ required: true }) inputId = '';

  /** Texto visible de la etiqueta. */
  @Input({ required: true }) label = '';

  /** Ayuda breve mostrada bajo el control. */
  @Input() hint: string | null = null;

  /** Mensaje de error activo, si existe. */
  @Input() error: string | null = null;

  /** Indica que hay una validación asíncrona en curso. */
  @Input() pending = false;

  /** Marca el campo como obligatorio en la etiqueta. */
  @Input() required = false;

  /** Identificador de la ayuda. */
  get hintId(): string {
    return `${this.inputId}-hint`;
  }

  /** Identificador del aviso de validación. */
  get pendingId(): string {
    return `${this.inputId}-pending`;
  }

  /** Identificador del mensaje de error. */
  get errorId(): string {
    return `${this.inputId}-error`;
  }

  /**
   * Lista de ids que describen el control para `aria-describedby`.
   *
   * @returns Cadena con ids separados por espacios o `null`.
   */
  get describedBy(): string | null {
    const ids: string[] = [];

    if (this.hint) {
      ids.push(this.hintId);
    }

    if (this.pending) {
      ids.push(this.pendingId);
    }

    if (this.error) {
      ids.push(this.errorId);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  }
}
