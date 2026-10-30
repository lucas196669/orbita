import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

/** Tema visual disponible. */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'orbita-theme';

/** Store del tema claro/oscuro persistido en el navegador. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeState = signal<Theme>(this.readInitialTheme());

  /** Tema actual. */
  readonly theme = this.themeState.asReadonly();
  /** El tema actual es oscuro. */
  readonly isDark = computed(() => this.themeState() === 'dark');

  constructor() {
    this.apply(this.themeState());
  }

  /** Alterna entre tema claro y oscuro. */
  toggle(): void {
    this.apply(this.themeState() === 'dark' ? 'light' : 'dark');
  }

  /**
   * Activa un tema concreto.
   * @param theme Tema que se quiere aplicar.
   */
  setTheme(theme: Theme): void {
    this.apply(theme);
  }

  private apply(theme: Theme): void {
    this.themeState.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      return;
    }
  }

  private readInitialTheme(): Theme {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'dark';
    } catch {
      return 'dark';
    }
  }
}
