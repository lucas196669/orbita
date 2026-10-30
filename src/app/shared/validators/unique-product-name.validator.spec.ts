import { flushMicrotasks, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { fakeAsyncTest } from '../../../test-utils/fake-async';

import { uniqueProductNameValidator } from './unique-product-name.validator';
import { hasValidationNotice } from './validation-notice';

function createControl(
  productNameExists: (name: string) => Promise<boolean>,
  originalName?: string,
): FormControl<string> {
  return new FormControl('', {
    nonNullable: true,
    asyncValidators: [uniqueProductNameValidator({ productNameExists }, originalName, 400)],
  });
}

describe('uniqueProductNameValidator', () => {
  it(
    'returns nameTaken when another product uses the name',
    fakeAsyncTest(() => {
      const productNameExists = vi.fn<(name: string) => Promise<boolean>>().mockResolvedValue(true);
      const control = createControl(productNameExists);

      control.setValue('Teclado mecánico');
      tick(400);
      flushMicrotasks();

      expect(control.errors).toEqual({ nameTaken: true });
    }),
  );

  it(
    'ignores the original name while editing',
    fakeAsyncTest(() => {
      const productNameExists = vi.fn<(name: string) => Promise<boolean>>().mockResolvedValue(true);
      const control = createControl(productNameExists, 'Teclado mecánico');

      control.setValue('  teclado MECÁNICO  ');
      tick(400);
      flushMicrotasks();

      expect(productNameExists).not.toHaveBeenCalled();
      expect(control.errors).toBeNull();
    }),
  );

  it(
    'does not block the form when the remote check fails',
    fakeAsyncTest(() => {
      const productNameExists = vi.fn<(name: string) => Promise<boolean>>().mockRejectedValue(new Error('offline'));
      const control = createControl(productNameExists);

      control.setValue('Monitor 4K');
      tick(400);
      flushMicrotasks();

      expect(control.errors).toBeNull();
      expect(hasValidationNotice(control)).toBe(true);
    }),
  );
});
