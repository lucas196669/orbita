import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Detalle de los requisitos que incumple una contraseña. */
export interface PasswordStrengthErrors {
  /** Falta longitud mínima de 8 caracteres. */
  readonly minLength: boolean;
  /** Falta una letra mayúscula. */
  readonly uppercase: boolean;
  /** Falta una letra minúscula. */
  readonly lowercase: boolean;
  /** Falta un número. */
  readonly number: boolean;
  /** Falta un símbolo. */
  readonly symbol: boolean;
}

/**
 * Valida que una contraseña tenga 8 caracteres, mayúscula, minúscula, número y
 * símbolo. Los valores vacíos se dejan al validador `required`.
 *
 * @param control Control de contraseña.
 * @returns Errores detallados o `null` si cumple los requisitos.
 */
export function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = typeof control.value === 'string' ? control.value : '';

  if (!value) {
    return null;
  }

  const detail: PasswordStrengthErrors = {
    minLength: value.length < 8,
    uppercase: !/[A-Z]/.test(value),
    lowercase: !/[a-z]/.test(value),
    number: !/\d/.test(value),
    symbol: !/[^A-Za-z0-9]/.test(value),
  };

  return Object.values(detail).some(Boolean) ? { passwordStrength: detail } : null;
}

/**
 * Comprueba que dos campos del grupo contengan exactamente el mismo valor.
 *
 * @param passwordKey Nombre del campo de contraseña.
 * @param confirmKey Nombre del campo de confirmación.
 * @returns Validador de grupo que añade `fieldsMismatch` cuando no coinciden.
 */
export function matchFields(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password: unknown = group.get(passwordKey)?.value;
    const confirmation: unknown = group.get(confirmKey)?.value;

    if (typeof password !== 'string' || typeof confirmation !== 'string') {
      return null;
    }

    return password === confirmation ? null : { fieldsMismatch: true };
  };
}
