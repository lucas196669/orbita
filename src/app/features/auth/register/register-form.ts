import { Validators, type FormBuilder, type FormControl, type FormGroup } from '@angular/forms';

import { matchFields, passwordStrength } from '../../../shared/validators/password.validator';
import { uniqueEmailValidator, type EmailAvailabilityService } from '../../../shared/validators/unique-email.validator';

/** Controles tipados del formulario de registro. */
export interface RegisterFormControls {
  /** Nombre completo. */
  readonly fullName: FormControl<string>;
  /** Correo electrónico. */
  readonly email: FormControl<string>;
  /** Contraseña. */
  readonly password: FormControl<string>;
  /** Repetición de la contraseña. */
  readonly confirmPassword: FormControl<string>;
  /** Aceptación de términos. */
  readonly terms: FormControl<boolean>;
}

/** Tipo del formulario de registro. */
export type RegisterForm = FormGroup<RegisterFormControls>;

/**
 * Construye el formulario reactivo de registro con sus validaciones.
 *
 * El correo usa `updateOn: 'blur'` para no lanzar la comprobación remota en
 * cada pulsación. La confirmación se valida a nivel de grupo con `matchFields`.
 *
 * @param fb Constructor de formularios de Angular.
 * @param service Servicio que comprueba si el correo existe.
 * @returns Formulario tipado y no nulo.
 */
export function createRegisterForm(fb: FormBuilder, service: EmailAvailabilityService): RegisterForm {
  return fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [uniqueEmailValidator(service)],
          updateOn: 'blur',
        },
      ],
      password: ['', [Validators.required, passwordStrength]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: [matchFields('password', 'confirmPassword')] },
  );
}
