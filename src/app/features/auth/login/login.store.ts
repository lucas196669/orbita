import { inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

/** ViewModel del formulario de inicio de sesión. */
@Injectable()
export class LoginStore {
  private readonly auth = inject(AuthService);
  private readonly errorState = signal<string | null>(null);

  /** Indica si hay un inicio de sesión en curso. */
  readonly loading = this.auth.loading;
  /** Mensaje de error de credenciales en español. */
  readonly error = this.errorState.asReadonly();

  /**
   * Envía las credenciales y guarda el error de usuario si falla.
   * @returns `true` si la sesión se ha iniciado correctamente.
   */
  async login(email: string, password: string): Promise<boolean> {
    this.errorState.set(null);
    const result = await this.auth.login(email, password);

    if (!result.ok) {
      this.errorState.set(result.message);
      return false;
    }

    return true;
  }

  /** Limpia el error de credenciales. */
  clearError(): void {
    this.errorState.set(null);
  }
}
