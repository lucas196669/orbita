import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, defer, from, map, of, switchMap, timer, type Observable } from 'rxjs';

import { clearValidationNotice, markValidationUnavailable } from './validation-notice';

/** Contrato mínimo para comprobar la disponibilidad de un correo. */
export interface EmailAvailabilityService {
  /** Devuelve `true` si el correo ya está registrado. */
  emailExists(email: string): Promise<boolean>;
}

/**
 * Crea un validador asíncrono que comprueba si un correo ya existe.
 *
 * Aplica un debounce de 400 ms por defecto, cancela la petición anterior con
 * `switchMap` y, si la comprobación falla, devuelve `null` sin bloquear el
 * formulario. El fallo queda registrado en el control para mostrar un aviso.
 *
 * @param service Servicio con la comprobación remota.
 * @param debounceMs Tiempo de espera antes de consultar.
 * @returns Validador asíncrono con el error `emailTaken`.
 */
export function uniqueEmailValidator(service: EmailAvailabilityService, debounceMs = 400): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = typeof control.value === 'string' ? control.value.trim().toLowerCase() : '';

    if (!email) {
      clearValidationNotice(control);
      return of(null);
    }

    return timer(debounceMs).pipe(
      switchMap(() =>
        defer(() => from(service.emailExists(email))).pipe(
          map((exists) => {
            clearValidationNotice(control);
            return exists ? { emailTaken: true } : null;
          }),
          catchError(() => {
            markValidationUnavailable(control);
            return of(null);
          }),
        ),
      ),
    );
  };
}
