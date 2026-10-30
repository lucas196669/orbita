import type { AbstractControl } from '@angular/forms';

/** Estado no bloqueante añadido a un control cuando falla una comprobación remota. */
export type ValidationNotice = 'unavailable';

/** Control con un aviso no bloqueante asociado. */
export interface NotifiableControl extends AbstractControl {
  validationNotice?: ValidationNotice;
}

/**
 * Marca un control con un aviso de validación remota no disponible.
 *
 * @param control Control afectado.
 */
export function markValidationUnavailable(control: AbstractControl): void {
  (control as NotifiableControl).validationNotice = 'unavailable';
}

/**
 * Limpia el aviso no bloqueante de un control.
 *
 * @param control Control afectado.
 */
export function clearValidationNotice(control: AbstractControl): void {
  delete (control as NotifiableControl).validationNotice;
}

/**
 * Indica si un control tiene un aviso de validación remota no disponible.
 *
 * @param control Control a consultar.
 * @returns `true` si existe el aviso.
 */
export function hasValidationNotice(control: AbstractControl | null): boolean {
  return control !== null && (control as NotifiableControl).validationNotice === 'unavailable';
}
