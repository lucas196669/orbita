import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Anuncia cada navegación y coloca el foco en el contenido principal.
 *
 * La región `aria-live` del componente raíz muestra el mensaje, mientras que el
 * foco se mueve al `h1` de la página (o al `main` si no existe) para que las
 * personas que usan teclado o lector de pantalla empiecen en el contenido.
 */
@Injectable({ providedIn: 'root' })
export class RouteAnnouncerService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageState = signal('');

  private started = false;

  /** Mensaje actual que se publica en la región `aria-live`. */
  readonly message = this.messageState.asReadonly();

  /** Empieza a escuchar los cambios de ruta. Es idempotente. */
  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        setTimeout(() => this.announceCurrentPage(), 0);
      });
  }

  /**
   * Anuncia la página activa y mueve el foco a su encabezado.
   *
   * Se expone para poder probar el comportamiento sin depender del router.
   */
  announceCurrentPage(): void {
    const main = this.document.querySelector<HTMLElement>('main');
    const heading = main?.querySelector<HTMLElement>('h1') ?? null;
    const target = heading ?? main;

    if (!target) {
      return;
    }

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }

    target.focus({ preventScroll: true });

    const label = heading?.textContent?.trim() || this.document.title || 'Página cargada';
    this.messageState.set('');
    setTimeout(() => this.messageState.set(`Nueva página: ${label}`), 0);
  }
}
