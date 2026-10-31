import { Injectable, signal } from '@angular/core';

/** Mensaje efímero mostrado por el componente accesible `app-toast`. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageState = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Mensaje visible actualmente. */
  readonly message = this.messageState.asReadonly();

  /**
   * Muestra un mensaje durante unos segundos.
   *
   * @param message Texto a anunciar.
   * @param durationMs Duración visible en milisegundos.
   */
  show(message: string, durationMs = 6000): void {
    this.clearTimer();
    this.messageState.set(message);
    this.timer = setTimeout(() => {
      this.messageState.set(null);
      this.timer = null;
    }, durationMs);
  }

  /** Oculta el mensaje actual. */
  clear(): void {
    this.clearTimer();
    this.messageState.set(null);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
