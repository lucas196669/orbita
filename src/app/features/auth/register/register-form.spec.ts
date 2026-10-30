import { flushMicrotasks, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';

import { fakeAsyncTest } from '../../../../test-utils/fake-async';

import { createRegisterForm } from './register-form';

describe('createRegisterForm', () => {
  const fb = new FormBuilder();

  it('creates non-null controls and starts invalid', () => {
    const form = createRegisterForm(fb, { emailExists: () => Promise.resolve(false) });

    expect(form.controls.fullName.value).toBe('');
    expect(form.controls.terms.value).toBe(false);
    expect(form.valid).toBe(false);
  });

  it('rejects a password without every required character group', () => {
    const form = createRegisterForm(fb, { emailExists: () => Promise.resolve(false) });

    form.patchValue({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      terms: true,
    });

    expect(form.controls.password.hasError('passwordStrength')).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('rejects mismatched passwords at group level', () => {
    const form = createRegisterForm(fb, { emailExists: () => Promise.resolve(false) });

    form.patchValue({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Orbita2026!',
      confirmPassword: 'Orbita2026?',
      terms: true,
    });

    expect(form.hasError('fieldsMismatch')).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('requires accepting the terms', () => {
    const form = createRegisterForm(fb, { emailExists: () => Promise.resolve(false) });

    form.patchValue({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Orbita2026!',
      confirmPassword: 'Orbita2026!',
      terms: false,
    });

    expect(form.controls.terms.hasError('required')).toBe(true);
  });

  it(
    'becomes valid with strong data and an available email',
    fakeAsyncTest(() => {
      const emailExists = vi.fn<(email: string) => Promise<boolean>>().mockResolvedValue(false);
      const form = createRegisterForm(fb, { emailExists });

      form.patchValue({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Orbita2026!',
        confirmPassword: 'Orbita2026!',
        terms: true,
      });
      form.controls.email.updateValueAndValidity();

      tick(400);
      flushMicrotasks();

      expect(emailExists).toHaveBeenCalledWith('ada@example.com');
      expect(form.valid).toBe(true);
    }),
  );
});
