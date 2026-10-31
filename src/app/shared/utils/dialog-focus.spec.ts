import { afterEach, describe, expect, it } from 'vitest';

import { captureDialogTrigger, restoreDialogFocus } from './dialog-focus';

describe('dialog-focus', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('captura el elemento activo', () => {
    document.body.innerHTML = '<button id="trigger">Abrir</button>';
    const trigger = document.getElementById('trigger') as HTMLButtonElement;

    trigger.focus();

    expect(captureDialogTrigger(document)).toBe(trigger);
  });

  it('devuelve el foco al disparador conectado', () => {
    document.body.innerHTML = '<button id="trigger">Abrir</button><button id="other">Otro</button>';
    const trigger = document.getElementById('trigger') as HTMLButtonElement;
    const other = document.getElementById('other') as HTMLButtonElement;

    other.focus();
    restoreDialogFocus(document, trigger);

    expect(document.activeElement).toBe(trigger);
  });

  it('usa el h1 principal si el disparador ya no existe', () => {
    document.body.innerHTML = '<main><h1 tabindex="-1">Productos</h1></main>';
    const heading = document.querySelector('h1');
    const trigger = document.createElement('button');

    restoreDialogFocus(document, trigger);

    expect(document.activeElement).toBe(heading);
  });

  it('no falla sin disparador ni contenido principal', () => {
    expect(() => restoreDialogFocus(document, null)).not.toThrow();
  });
});
