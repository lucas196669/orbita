/**
 * Devuelve el foco al control que abrió un diálogo.
 *
 * Si el disparador ya no está en el documento (por ejemplo, tras eliminar la
 * fila que contenía el botón), se enfoca el encabezado principal como respaldo.
 *
 * @param doc Documento activo.
 * @param trigger Elemento que abrió el diálogo, si sigue disponible.
 */
export function restoreDialogFocus(doc: Document, trigger: HTMLElement | null): void {
  if (trigger?.isConnected) {
    trigger.focus();
    return;
  }

  const heading = doc.querySelector<HTMLElement>('main h1');
  const main = doc.querySelector<HTMLElement>('main');

  (heading ?? main)?.focus();
}

/**
 * Guarda el elemento que tiene el foco antes de abrir un diálogo.
 *
 * @param doc Documento activo.
 * @returns Elemento activo o `null` si no es un `HTMLElement`.
 */
export function captureDialogTrigger(doc: Document): HTMLElement | null {
  return doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
}
