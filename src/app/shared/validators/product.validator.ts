import type { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Valida que un precio tenga como máximo dos decimales.
 *
 * @param control Control numérico o textual.
 * @returns Error `maxTwoDecimals` si hay más precisión.
 */
export function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return /^\d+(\.\d{1,2})?$/.test(String(value)) ? null : { maxTwoDecimals: true };
}

/**
 * Valida que un valor numérico sea entero.
 *
 * @param control Control numérico o textual.
 * @returns Error `integer` si el valor no es entero.
 */
export function integerNumber(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number.isInteger(Number(value)) ? null : { integer: true };
}
