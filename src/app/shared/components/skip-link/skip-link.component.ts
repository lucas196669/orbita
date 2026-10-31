import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

/**
 * Enlace de salto accesible que mueve el foco al destino sin usar fragmentos.
 *
 * Los `href="#id"` se rompen con `<base href="/">`, por lo que el salto se
 * implementa con un botón que enfoca el elemento indicado. El destino debe ser
 * focusable o tener `tabindex="-1"`.
 */
@Component({
  selector: 'app-skip-link',
  template: `
    <button type="button" class="skip-link" (click)="activate()">
      {{ label() }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {
  private readonly document = inject(DOCUMENT);

  /** Identificador del elemento que recibe el foco. */
  readonly targetId = input.required<string>();

  /** Texto visible del enlace de salto. */
  readonly label = input('Saltar al contenido');

  /** Mueve el foco al destino configurado. */
  activate(): void {
    const target = this.document.getElementById(this.targetId());

    if (!target) {
      return;
    }

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }

    target.focus();
  }
}
