import { FormControl, FormGroup } from '@angular/forms';

import { matchFields, passwordStrength, type PasswordStrengthErrors } from './password.validator';

describe('passwordStrength', () => {
  it('returns null for an empty value so required handles it', () => {
    const control = new FormControl('');

    expect(passwordStrength(control)).toBeNull();
  });

  it('reports every missing requirement', () => {
    const control = new FormControl('abc');
    const result = passwordStrength(control);

    expect(result).toEqual({
      passwordStrength: {
        minLength: true,
        uppercase: true,
        lowercase: false,
        number: true,
        symbol: true,
      } satisfies PasswordStrengthErrors,
    });
  });

  it('accepts a strong password', () => {
    const control = new FormControl('Orbita2026!');

    expect(passwordStrength(control)).toBeNull();
  });
});

describe('matchFields', () => {
  function createGroup(password: string, confirmation: string): FormGroup {
    return new FormGroup(
      {
        password: new FormControl(password),
        confirmPassword: new FormControl(confirmation),
      },
      { validators: [matchFields('password', 'confirmPassword')] },
    );
  }

  it('flags mismatched values at group level', () => {
    const group = createGroup('Orbita2026!', 'Orbita2026?');

    expect(group.hasError('fieldsMismatch')).toBe(true);
  });

  it('accepts equal values', () => {
    const group = createGroup('Orbita2026!', 'Orbita2026!');

    expect(group.hasError('fieldsMismatch')).toBe(false);
  });
});
