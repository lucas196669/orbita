import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { buildSparkline, formatStatValue, formatTrendValue } from './stat-format';
import type { SparklineData, StatAccent, StatFormat, TrendDirection } from './stat-widget.model';

/**
 * Widget estadístico reutilizable.
 *
 * Muestra un valor con contador animado, una tendencia con texto (nunca solo
 * color) y una sparkline SVG opcional. Si `interactive` está activo se
 * renderiza como botón; en caso contrario como artículo.
 */
@Component({
  selector: 'app-stat-widget',
  templateUrl: './stat-widget.component.html',
  styleUrls: ['./stat-widget.component.scss'],
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatWidgetComponent {
  /** Etiqueta visible del indicador. */
  readonly label = input.required<string>();

  /** Valor numérico principal. */
  readonly value = input.required<number>();

  /** Formato del valor principal. */
  readonly format = input<StatFormat>('number');

  /** Variación porcentual respecto al periodo anterior. */
  readonly trend = input<number | null>(null);

  /** Texto que contextualiza la tendencia. */
  readonly trendLabel = input<string | null>(null);

  /** Trazado SVG opcional del icono. */
  readonly icon = input<string | null>(null);

  /** Serie de valores para la sparkline. */
  readonly series = input<readonly number[]>([]);

  /** Indica que el widget está cargando. */
  readonly loading = input(false);

  /** Acento visual del widget. */
  readonly accent = input<StatAccent>('default');

  /** Convierte el widget en un botón interactivo. */
  readonly interactive = input(false);

  /** Se emite al activar un widget interactivo. */
  readonly widgetClick = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly displayValue = signal(0);
  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private animatedValue = 0;
  private animationFrame: number | null = null;

  /** Valor mostrado por el contador. */
  readonly displayedValue = this.displayValue.asReadonly();

  /** Valor formateado que se pinta. */
  readonly formattedValue = computed(() => formatStatValue(this.displayValue(), this.format()));

  /** Clase raíz según el acento. */
  readonly rootClass = computed(() => `stat-widget stat-widget--${this.accent()}`);

  /** Hay una tendencia que mostrar. */
  readonly hasTrend = computed(() => this.trend() !== null);

  /** Dirección semántica de la tendencia. */
  readonly trendDirection = computed<TrendDirection>(() => {
    const value = this.trend() ?? 0;

    if (value > 0) {
      return 'up';
    }

    if (value < 0) {
      return 'down';
    }

    return 'flat';
  });

  /** Flecha visual de la tendencia. */
  readonly trendArrow = computed(() => {
    const direction = this.trendDirection();

    if (direction === 'up') {
      return '↑';
    }

    if (direction === 'down') {
      return '↓';
    }

    return '→';
  });

  /** Texto visible de la tendencia. */
  readonly trendText = computed(() => {
    const value = this.trend();

    if (value === null) {
      return '';
    }

    const context = this.trendLabel();

    return context ? `${formatTrendValue(value)} ${context}` : formatTrendValue(value);
  });

  /** Texto equivalente para lectores de pantalla. */
  readonly trendAnnouncement = computed(() => {
    const value = this.trend();

    if (value === null) {
      return '';
    }

    const context = this.trendLabel() ? ` ${this.trendLabel()}` : '';

    if (value === 0) {
      return `Sin cambios${context}.`;
    }

    const direction = value > 0 ? 'al alza' : 'a la baja';
    const amount = formatStatValue(Math.abs(value), 'number');

    return `Tendencia ${direction} de ${amount} por ciento${context}.`;
  });

  /** Datos de la sparkline o `null` si no hay serie suficiente. */
  readonly sparkline = computed<SparklineData | null>(() => buildSparkline(this.series(), this.format(), this.label()));

  constructor() {
    effect(() => {
      const target = this.value();
      const loading = this.loading();

      if (!loading) {
        this.animateTo(target);
      }
    });

    this.destroyRef.onDestroy(() => this.cancelAnimation());
  }

  /** Emite la interacción del widget. */
  activate(): void {
    if (this.interactive()) {
      this.widgetClick.emit();
    }
  }

  private animateTo(target: number): void {
    this.cancelAnimation();

    if (this.reducedMotion || typeof requestAnimationFrame !== 'function') {
      this.animatedValue = target;
      this.displayValue.set(target);
      return;
    }

    const from = this.animatedValue;
    const delta = target - from;
    const duration = 600;
    const start = performance.now();

    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + delta * eased;

      this.animatedValue = current;
      this.displayValue.set(current);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
        return;
      }

      this.animatedValue = target;
      this.displayValue.set(target);
      this.animationFrame = null;
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  private cancelAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
