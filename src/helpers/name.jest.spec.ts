import { breakDownNameAndCode } from './name';

describe('breakDownNameAndCode()', () => {
  it('should parse correctly to name/pln when param is correctly formatted', () => {
    const sampleVessel = 'abc (123)';
    const parsed = breakDownNameAndCode(sampleVessel);
    expect(parsed.name).toBe('abc');
    expect(parsed.code).toBe('123');
  });

  it('should return null when param is incorrectly formatted', () => {
    const sampleVessel = 'abc ';
    const parsed = breakDownNameAndCode(sampleVessel);
    expect(parsed).toBe(null);
  });

  it('should use the last pair of brackets as the code', () => {
    expect(breakDownNameAndCode('Atlantic cod (Gadus) (COD)')).toEqual({ name: 'Atlantic cod (Gadus)', code: 'COD' });
  });

  it('should allow an empty code', () => {
    expect(breakDownNameAndCode('abc ()')).toEqual({ name: 'abc', code: '' });
  });

  it.each([
    ['no closing bracket', 'abc (123'],
    ['no opening bracket', 'abc 123)'],
    ['no space before the bracket', 'abc(123)'],
    ['no name', ' (123)'],
    ['text after the brackets', 'abc (123) '],
    ['nested brackets', 'abc ((123))'],
    ['a line break in the name', 'abc\ndef (123)'],
    ['an empty string', ''],
  ])('should return null for %s', (_description, value) => {
    expect(breakDownNameAndCode(value)).toBeNull();
  });

  it('should return null when the value is not a string', () => {
    expect(breakDownNameAndCode(undefined)).toBeNull();
    expect(breakDownNameAndCode(null)).toBeNull();
  });

  it('should handle long input without backtracking', () => {
    const value = '(' .repeat(50000) + ' (';

    const start = Date.now();
    expect(breakDownNameAndCode(value)).toBeNull();
    expect(Date.now() - start).toBeLessThan(500);
  });
});
