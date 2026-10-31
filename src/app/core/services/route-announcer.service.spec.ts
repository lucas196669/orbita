import { TestBed, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fakeAsyncTest } from '../../../test-utils/fake-async';

import { RouteAnnouncerService } from './route-announcer.service';

describe('RouteAnnouncerService', () => {
  const events = new Subject<NavigationEnd>();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { events } }],
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.title = '';
  });

  it(
    'mueve el foco al h1 y anuncia la página tras navegar',
    fakeAsyncTest(() => {
      document.body.innerHTML = '<main><h1>Productos</h1></main>';
      const heading = document.querySelector('h1');
      const service = TestBed.inject(RouteAnnouncerService);

      service.start();
      events.next(new NavigationEnd(1, '/app/productos', '/app/productos'));

      tick();
      tick();

      expect(document.activeElement).toBe(heading);
      expect(heading?.getAttribute('tabindex')).toBe('-1');
      expect(service.message()).toBe('Nueva página: Productos');
    }),
  );

  it(
    'usa el main como respaldo cuando no hay h1',
    fakeAsyncTest(() => {
      document.body.innerHTML = '<main><p>Contenido</p></main>';
      document.title = 'Orbita';
      const main = document.querySelector('main');
      const service = TestBed.inject(RouteAnnouncerService);

      service.announceCurrentPage();
      tick();
      tick();

      expect(document.activeElement).toBe(main);
      expect(service.message()).toBe('Nueva página: Orbita');
    }),
  );

  it('no falla si la página no tiene main', () => {
    const service = TestBed.inject(RouteAnnouncerService);

    expect(() => service.announceCurrentPage()).not.toThrow();
    expect(service.message()).toBe('');
  });
});
