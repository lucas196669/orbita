import { flushMicrotasks, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { fakeAsyncTest } from '../../../test-utils/fake-async';

import { uniqueEmailValidator } from './unique-email.validator';
import { hasValidationNotice } from './validation-notice';

function createControl(emailExists: (email: string) => Promise<boolean>): FormControl<string> {
  return new FormControl('', {
    nonNullable: true,
    asyncValidators: [uniqueEmailValidator({ emailExists }, 400)],
  });
}

describe('uniqueEmailValidator', () => {
  it(
    'debounces and cancels previous requests',
    fakeAsyncTest(() => {
      const emailExists = vi.fn<(email: string) => Promise<boolean>>().mockResolvedValue(false);
      const control = createControl(emailExists);

      control.setValue('first@example.com');
      tick(200);
      control.setValue('second@example.com');
      tick(399);

      expect(emailExists).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();

      expect(emailExists).toHaveBeenCalledTimes(1);
      expect(emailExists).toHaveBeenCalledWith('second@example.com');
      expect(control.errors).toBeNull();
    }),
  );

  it(
    'returns emailTaken when the address exists',
    fakeAsyncTest(() => {
      const emailExists = vi.fn<(email: string) => Promise<boolean>>().mockResolvedValue(true);
      const control = createControl(emailExists);

      control.setValue('taken@example.com');
      tick(400);
      flushMicrotasks();

      expect(control.errors).toEqual({ emailTaken: true });
    }),
  );

  it(
    'does not block the form when the remote check fails',
    fakeAsyncTest(() => {
      const emailExists = vi.fn<(email: string) => Promise<boolean>>().mockRejectedValue(new Error('network down'));
      const control = createControl(emailExists);

      control.setValue('person@example.com');
      tick(400);
      flushMicrotasks();

      expect(control.errors).toBeNull();
      expect(hasValidationNotice(control)).toBe(true);
    }),
  );

  it(
    'skips the remote check for an empty value',
    fakeAsyncTest(() => {
      const emailExists = vi.fn<(email: string) => Promise<boolean>>().mockResolvedValue(true);
      const control = createControl(emailExists);

      control.setValue('   ');
      tick(400);
      flushMicrotasks();

      expect(emailExists).not.toHaveBeenCalled();
      expect(control.errors).toBeNull();
    }),
  );
});
