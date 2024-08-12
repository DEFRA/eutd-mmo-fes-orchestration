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
});
