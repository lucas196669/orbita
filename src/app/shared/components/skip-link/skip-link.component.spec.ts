import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SkipLinkComponent } from './skip-link.component';

describe('SkipLinkComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SkipLinkComponent] });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('enfoca el destino y lo hace focusable si es necesario', () => {
    document.body.innerHTML = '<div id="contenido">Contenido</div>';
    const fixture = TestBed.createComponent(SkipLinkComponent);
    const target = document.getElementById('contenido');

    fixture.componentRef.setInput('targetId', 'contenido');
    fixture.detectChanges();
    fixture.componentInstance.activate();

    expect(target?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(target);
  });

  it('respeta el tabindex existente del destino', () => {
    document.body.innerHTML = '<div id="contenido" tabindex="0">Contenido</div>';
    const fixture = TestBed.createComponent(SkipLinkComponent);
    const target = document.getElementById('contenido');

    fixture.componentRef.setInput('targetId', 'contenido');
    fixture.detectChanges();
    fixture.componentInstance.activate();

    expect(target?.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(target);
  });

  it('no falla si el destino no existe', () => {
    const fixture = TestBed.createComponent(SkipLinkComponent);

    fixture.componentRef.setInput('targetId', 'inexistente');
    fixture.detectChanges();

    expect(() => fixture.componentInstance.activate()).not.toThrow();
  });

  it('muestra la etiqueta por defecto', () => {
    const fixture = TestBed.createComponent(SkipLinkComponent);

    fixture.componentRef.setInput('targetId', 'contenido');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Saltar al contenido');
  });
});
