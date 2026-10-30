import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { describeAuthError } from '../../../shared/utils/error-messages';
import { controlErrorMessage, focusFirstInvalidControl } from '../../../shared/utils/form-errors';

/** Página de acceso con correo y contraseña. */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, RouterLink, ReactiveFormsModule, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Formulario reactivo de acceso. */
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Indica si se ha intentado enviar el formulario. */
  readonly submitAttempted = signal(false);

  /** Indica que la petición de acceso está en curso. */
  readonly submitting = signal(false);

  /** Error devuelto por el servidor. */
  readonly serverError = signal<string | null>(null);

  /** Mensaje de confirmación tras completar el registro. */
  readonly registeredMessage = signal(
    this.route.snapshot.queryParamMap.get('registered') === '1'
      ? 'Tu cuenta se ha creado. Revisa tu correo si necesitas confirmarlo e inicia sesión.'
      : null,
  );

  /** Indica si hay validación pendiente o envío en curso. */
  readonly isBusy = computed(() => this.submitting() || this.formStatus() === 'PENDING');

  /**
   * Comprueba si un campo debe mostrar error.
   *
   * @param name Nombre del control.
   * @returns `true` si el campo es inválido y ya se ha tocado o enviado.
   */
  isInvalid(name: string): boolean {
    this.formStatus();
    const control = this.form.get(name);

    return !!control && control.invalid && (control.touched || this.submitAttempted());
  }

  /**
   * Obtiene el mensaje de error de un campo.
   *
   * @param name Nombre del control.
   * @param label Etiqueta visible.
   * @returns Mensaje o `null`.
   */
  errorFor(name: string, label: string): string | null {
    return this.isInvalid(name) ? controlErrorMessage(this.form.get(name), label) : null;
  }

  /** Inicia sesión si el formulario es válido. */
  async submit(): Promise<void> {
    this.submitAttempted.set(true);
    this.serverError.set(null);
    this.registeredMessage.set(null);

    if (this.form.invalid) {
      focusFirstInvalidControl(this.form, {
        email: 'login-email',
        password: 'login-password',
      });
      return;
    }

    this.submitting.set(true);

    try {
      const value = this.form.getRawValue();
      await this.auth.signIn(value.email, value.password);
      await this.router.navigateByUrl(this.safeRedirect());
    } catch (error) {
      this.serverError.set(describeAuthError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private safeRedirect(): string {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');

    return redirectTo?.startsWith('/app/') ? redirectTo : '/app/inicio';
  }
}
