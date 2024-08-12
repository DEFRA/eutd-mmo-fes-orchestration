import { decimalPlacesValidator } from './customValidators';

describe('decimalPlacesValidator()', () => {
  const helpers = {
    error: (message: string) => message,
  };

  it('should return value when the value is valid', () => {
    const value = 100.20;
    expect(decimalPlacesValidator(value, helpers)).toEqual(value);
  });

  it('should return an error message when value has more than 2 decimal places', () => {
    const value = 100.123;
    const expectation = 'number.decimal-places';
    expect(decimalPlacesValidator(value, helpers)).toEqual(expectation);
  });
});
