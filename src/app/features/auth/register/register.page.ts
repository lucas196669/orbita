import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { SkipLinkComponent } from '../../../shared/components/skip-link/skip-link.component';
import { describeAuthError } from '../../../shared/utils/error-messages';
import { controlErrorMessage, focusFirstInvalidControl } from '../../../shared/utils/form-errors';
import { hasValidationNotice } from '../../../shared/validators/validation-notice';

import { createRegisterForm } from './register-form';

/** Página de alta de usuarios con validaciones síncronas y asíncronas. */
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [IonContent, RouterLink, ReactiveFormsModule, FormFieldComponent, SkipLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Formulario reactivo de registro. */
  readonly form = createRegisterForm(this.fb, this.supabase);

  /** Estado del formulario expuesto como signal para plantillas OnPush. */
  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Indica si se ha intentado enviar el formulario. */
  readonly submitAttempted = signal(false);

  /** Indica que la petición de alta está en curso. */
  readonly submitting = signal(false);

  /** Error devuelto por el servidor. */
  readonly serverError = signal<string | null>(null);

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
   * Indica si un campo está validándose en remoto.
   *
   * @param name Nombre del control.
   * @returns `true` si el control está pendiente.
   */
  isPending(name: string): boolean {
    this.formStatus();

    return this.form.get(name)?.pending ?? false;
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

  /** Mensaje de error de la confirmación, incluido el error de grupo. */
  confirmError(): string | null {
    const controlError = this.errorFor('confirmPassword', 'Repetir contraseña');

    if (controlError) {
      return controlError;
    }

    this.formStatus();
    const control = this.form.get('confirmPassword');
    const visible = !!control && (control.touched || this.submitAttempted());

    return visible && this.form.hasError('fieldsMismatch') ? 'Las contraseñas no coinciden.' : null;
  }

  /** Aviso discreto cuando la comprobación remota del correo no está disponible. */
  emailHint(): string {
    this.formStatus();

    return hasValidationNotice(this.form.get('email'))
      ? 'No pudimos comprobar la disponibilidad del correo. Puedes continuar.'
      : 'Usaremos este correo para acceder a tu cuenta.';
  }

  /** Envía el formulario si es válido. */
  async submit(): Promise<void> {
    this.submitAttempted.set(true);
    this.serverError.set(null);

    if (this.form.pending) {
      return;
    }

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    this.submitting.set(true);

    try {
      const value = this.form.getRawValue();
      const outcome = await this.auth.signUp(value.fullName, value.email, value.password);

      this.toast.show('Cuenta creada correctamente.');

      if (outcome.hasSession) {
        await this.router.navigateByUrl('/app/inicio');
      } else {
        await this.router.navigate(['/login'], { queryParams: { registered: '1' } });
      }
    } catch (error) {
      this.serverError.set(describeAuthError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private focusFirstInvalid(): void {
    const confirmation = this.form.get('confirmPassword');

    if (this.form.hasError('fieldsMismatch') && confirmation?.valid) {
      document.getElementById('register-confirm-password')?.focus();
      return;
    }

    focusFirstInvalidControl(
      this.form,
      {
        fullName: 'register-full-name',
        email: 'register-email',
        password: 'register-password',
        confirmPassword: 'register-confirm-password',
        terms: 'register-terms',
      },
      'register-full-name',
    );
  }
}
