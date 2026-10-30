import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, defer, from, map, of, switchMap, timer, type Observable } from 'rxjs';

import { clearValidationNotice, markValidationUnavailable } from './validation-notice';

/** Contrato mínimo para comprobar la disponibilidad de un nombre de producto. */
export interface ProductNameAvailabilityService {
  /** Devuelve `true` si el nombre ya está ocupado. */
  productNameExists(name: string): Promise<boolean>;
}

/** Valor original que se ignora al editar un producto. */
export type OriginalProductName = string | (() => string | undefined);

/**
 * Crea un validador asíncrono que comprueba si un nombre de producto existe.
 *
 * En edición se puede pasar el nombre original para que el propio producto no
 * se considere duplicado. Aplica debounce, cancela peticiones anteriores y no
 * bloquea el formulario si la comprobación falla.
 *
 * @param service Servicio con la comprobación remota.
 * @param originalName Nombre original o función que lo devuelve.
 * @param debounceMs Tiempo de espera antes de consultar.
 * @returns Validador asíncrono con el error `nameTaken`.
 */
export function uniqueProductNameValidator(
  service: ProductNameAvailabilityService,
  originalName?: OriginalProductName,
  debounceMs = 400,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const name = typeof control.value === 'string' ? control.value.trim() : '';
    const original = resolveOriginalName(originalName);

    if (!name) {
      clearValidationNotice(control);
      return of(null);
    }

    if (original && name.toLocaleLowerCase('es') === original.toLocaleLowerCase('es')) {
      clearValidationNotice(control);
      return of(null);
    }

    return timer(debounceMs).pipe(
      switchMap(() =>
        defer(() => from(service.productNameExists(name))).pipe(
          map((exists) => {
            clearValidationNotice(control);
            return exists ? { nameTaken: true } : null;
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

function resolveOriginalName(originalName: OriginalProductName | undefined): string | undefined {
  const value = typeof originalName === 'function' ? originalName() : originalName;
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}
