import { FormControl } from '@angular/forms';

import { integerNumber, maxTwoDecimals } from './product.validator';

describe('maxTwoDecimals', () => {
  it('accepts values with up to two decimals', () => {
    expect(maxTwoDecimals(new FormControl(12.5))).toBeNull();
    expect(maxTwoDecimals(new FormControl(12.55))).toBeNull();
  });

  it('rejects values with more than two decimals', () => {
    expect(maxTwoDecimals(new FormControl(12.555))).toEqual({ maxTwoDecimals: true });
  });
});

describe('integerNumber', () => {
  it('accepts integer values', () => {
    expect(integerNumber(new FormControl(12))).toBeNull();
  });

  it('rejects decimal values', () => {
    expect(integerNumber(new FormControl(12.5))).toEqual({ integer: true });
  });
});
