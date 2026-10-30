import { fakeAsync } from '@angular/core/testing';

interface ProxyZoneSpecConstructor {
  new (): unknown;
}

interface ZoneLike {
  readonly root: ZoneLike;
  fork(spec: unknown): ZoneLike;
  run<T>(fn: () => T): T;
}

interface ZoneGlobal extends ZoneLike {
  readonly ProxyZoneSpec?: ProxyZoneSpecConstructor;
}

/**
 * Ejecuta un test con `fakeAsync` dentro de una `ProxyZone`.
 *
 * Vitest no crea la ProxyZone que Jasmine o Mocha sí preparan. Este ayudante
 * mantiene `fakeAsync` y sus utilidades de tiempo disponibles en el proyecto.
 *
 * @param fn Cuerpo del test.
 * @returns Función lista para pasar a `it`.
 */
export function fakeAsyncTest(fn: () => void): () => void {
  return () => {
    const zone = (globalThis as { Zone?: ZoneGlobal }).Zone;

    if (!zone?.ProxyZoneSpec) {
      fakeAsync(fn)();
      return;
    }

    zone.root.fork(new zone.ProxyZoneSpec()).run(() => {
      fakeAsync(fn)();
    });
  };
}
