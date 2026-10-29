import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LoginStore } from './login.store';

/** Página de inicio de sesión con panel de marca y formulario reactivo. */
@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [ReactiveFormsModule],
  providers: [LoginStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(LoginStore);

  /** Ruta interna a la que volver después de iniciar sesión. */
  readonly returnUrl = input<string | undefined>('returnUrl');

  /** Formulario de credenciales. */
  readonly form = this.formBuilder.group({
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  /** Controla la visibilidad de la contraseña. */
  readonly showPassword = signal(false);
  /** Indica si se ha intentado enviar el formulario. */
  readonly submitted = signal(false);

  /** Estado de carga del inicio de sesión. */
  readonly loading = this.store.loading;
  /** Error de credenciales traducido a español. */
  readonly error = this.store.error;

  /** Alterna entre mostrar y ocultar la contraseña. */
  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  /** Valida el formulario y solicita el inicio de sesión. */
  async submit(): Promise<void> {
    this.submitted.set(true);
    this.store.clearError();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    const success = await this.store.login(email, password);

    if (!success) {
      return;
    }

    const requestedUrl = this.returnUrl();
    const target = requestedUrl?.startsWith('/app') ? requestedUrl : '/app/inicio';
    await this.router.navigateByUrl(target);
  }
}
