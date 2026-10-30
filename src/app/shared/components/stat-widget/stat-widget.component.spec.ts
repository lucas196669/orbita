import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { StatWidgetComponent } from './stat-widget.component';
import type { StatAccent, StatFormat } from './stat-widget.model';

type WidgetFixture = ComponentFixture<StatWidgetComponent>;

const originalMatchMedia = window.matchMedia;

function reduceMotion(): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function createWidget(
  options: {
    label?: string;
    value?: number;
    format?: StatFormat;
    trend?: number | null;
    trendLabel?: string | null;
    series?: readonly number[];
    loading?: boolean;
    accent?: StatAccent;
    interactive?: boolean;
  } = {},
): WidgetFixture {
  const fixture = TestBed.createComponent(StatWidgetComponent);

  fixture.componentRef.setInput('label', options.label ?? 'Pedidos');
  fixture.componentRef.setInput('value', options.value ?? 0);
  fixture.componentRef.setInput('format', options.format ?? 'number');
  fixture.componentRef.setInput('trend', options.trend ?? null);
  fixture.componentRef.setInput('trendLabel', options.trendLabel ?? null);
  fixture.componentRef.setInput('series', options.series ?? []);
  fixture.componentRef.setInput('loading', options.loading ?? false);
  fixture.componentRef.setInput('accent', options.accent ?? 'default');
  fixture.componentRef.setInput('interactive', options.interactive ?? false);

  fixture.detectChanges();

  return fixture;
}

describe('StatWidgetComponent', () => {
  beforeEach(() => reduceMotion());

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('formats currency values for the Spanish locale', () => {
    const fixture = createWidget({ value: 1234.5, format: 'currency' });

    expect(fixture.nativeElement.querySelector('.stat-widget__value').textContent).toContain('1234,50');
    expect(fixture.nativeElement.querySelector('.stat-widget__value').textContent).toContain('€');

    fixture.destroy();
  });

  it('formats percent values', () => {
    const fixture = createWidget({ value: 0.42, format: 'percent' });

    expect(fixture.nativeElement.querySelector('.stat-widget__value').textContent).toContain('42');

    fixture.destroy();
  });

  it('skips the counter animation when reduced motion is enabled', () => {
    const fixture = createWidget({ value: 42 });

    expect(fixture.componentInstance.displayedValue()).toBe(42);
    expect(fixture.nativeElement.querySelector('.stat-widget__value').textContent).toContain('42');

    fixture.destroy();
  });

  it('shows the trend with text and a screen-reader equivalent', () => {
    const fixture = createWidget({ trend: 4.2, trendLabel: 'respecto al mes anterior' });

    const trend = fixture.nativeElement.querySelector('.stat-widget__trend');
    const srText = fixture.nativeElement.querySelector('.sr-only').textContent;

    expect(trend.textContent).toContain('+4,2 % respecto al mes anterior');
    expect(trend.classList).toContain('stat-widget__trend--up');
    expect(srText).toContain('al alza');
    expect(srText).toContain('4,2 por ciento');

    fixture.destroy();
  });

  it('renders a sparkline with an accessible label', () => {
    const fixture = createWidget({ label: 'Ingresos', series: [10, 18, 14, 22] });

    const chart: SVGElement = fixture.nativeElement.querySelector('svg[role="img"]');
    const polyline: SVGElement = fixture.nativeElement.querySelector('polyline');

    expect(chart.getAttribute('aria-label')).toContain('Tendencia de Ingresos');
    expect(polyline.getAttribute('points')).toBeTruthy();

    fixture.destroy();
  });

  it('uses a button when interactive and emits widgetClick', () => {
    const fixture = createWidget({ interactive: true });
    const clicks: number[] = [];
    fixture.componentInstance.widgetClick.subscribe(() => clicks.push(1));

    const root: HTMLElement = fixture.nativeElement.querySelector('button.stat-widget');
    root.click();
    fixture.detectChanges();

    expect(root.tagName).toBe('BUTTON');
    expect(clicks).toHaveLength(1);

    fixture.destroy();
  });

  it('marks the widget as busy while loading', () => {
    const fixture = createWidget({ loading: true });

    expect(fixture.nativeElement.querySelector('.stat-widget').getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.skeleton')).not.toBeNull();

    fixture.destroy();
  });
});
