import type { AbstractControl, FormGroup } from '@angular/forms';

import type { PasswordStrengthErrors } from '../validators/password.validator';

interface LengthError {
  readonly requiredLength?: number;
}

/**
 * Traduce los errores de un control a un mensaje en español.
 *
 * @param control Control del formulario.
 * @param label Nombre visible del campo.
 * @returns Mensaje de error o `null` si el campo es válido.
 */
export function controlErrorMessage(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.errors) {
    return null;
  }

  const errors = control.errors;

  if (errors['required'] || errors['requiredTrue']) {
    return `${label} es obligatorio.`;
  }

  if (errors['email']) {
    return 'Introduce un correo electrónico válido.';
  }

  if (errors['minlength']) {
    const detail = errors['minlength'] as LengthError;
    const length = detail.requiredLength ?? 0;

    return `${label} debe tener al menos ${length} caracteres.`;
  }

  if (errors['min']) {
    return `${label} debe ser mayor o igual que el mínimo permitido.`;
  }

  if (errors['emailTaken']) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }

  if (errors['nameTaken']) {
    return 'Ya existe un producto con este nombre.';
  }

  if (errors['passwordStrength']) {
    return passwordStrengthMessage(errors['passwordStrength'] as PasswordStrengthErrors);
  }

  if (errors['fieldsMismatch']) {
    return 'Las contraseñas no coinciden.';
  }

  if (errors['maxTwoDecimals']) {
    return 'El precio admite como máximo dos decimales.';
  }

  if (errors['integer']) {
    return 'El stock debe ser un número entero.';
  }

  return 'Revisa este campo.';
}

/**
 * Lleva el foco al primer control inválido del formulario.
 *
 * @param form Formulario a revisar.
 * @param idsByControl Identificador HTML de cada control.
 * @param fallbackId Identificador alternativo si el error es de grupo.
 */
export function focusFirstInvalidControl(
  form: FormGroup,
  idsByControl: Readonly<Record<string, string>>,
  fallbackId?: string,
): void {
  for (const [name, control] of Object.entries(form.controls)) {
    if (!control.invalid) {
      continue;
    }

    const id = idsByControl[name];

    if (id && focusElement(id)) {
      return;
    }
  }

  if (fallbackId) {
    focusElement(fallbackId);
  }
}

function focusElement(id: string): boolean {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLElement)) {
    return false;
  }

  element.focus();

  return true;
}

function passwordStrengthMessage(detail: PasswordStrengthErrors): string {
  const missing: string[] = [];

  if (detail.minLength) {
    missing.push('al menos 8 caracteres');
  }

  if (detail.uppercase) {
    missing.push('una mayúscula');
  }

  if (detail.lowercase) {
    missing.push('una minúscula');
  }

  if (detail.number) {
    missing.push('un número');
  }

  if (detail.symbol) {
    missing.push('un símbolo');
  }

  return missing.length > 0
    ? `La contraseña debe incluir ${missing.join(', ')}.`
    : 'La contraseña no cumple los requisitos mínimos.';
}
