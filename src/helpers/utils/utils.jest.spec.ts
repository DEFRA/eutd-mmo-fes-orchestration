import * as utils from "./utils";

describe("utils", () => {
  it('will return a random number of 10 digits', () => {
    const mockGetRandomNumber = jest.spyOn(utils, 'getRandomNumber');
    mockGetRandomNumber.mockReturnValue(1234567890);
    expect(utils.getRandomNumber()).toEqual(1234567890);
  });

  it('should return an array of FAO Area codes with exactly 19 items', () => {
    const FOAAreaCode = [
      'FAO18',
      'FAO21',
      'FAO27',
      'FAO31',
      'FAO34',
      'FAO37',
      'FAO41',
      'FAO47',
      'FAO48',
      'FAO51',
      'FAO57',
      'FAO58',
      'FAO61',
      'FAO67',
      'FAO71',
      'FAO77',
      'FAO81',
      'FAO87',
      'FAO88',
    ];
    expect(Array.isArray(utils.getFAOAreaList())).toBeTruthy();
    expect(utils.getFAOAreaList().length).toBe(19);
    expect(utils.getFAOAreaList()).toEqual(FOAAreaCode);

  });

  describe('valueOrDefault', () => {
    it('returns value when the condition parameter is true', () => {
      expect(utils.valueOrDefault("hello", true)).toBe("hello");
      expect(utils.valueOrDefault(12345, true)).toBe(12345);
      expect(utils.valueOrDefault({ one: 1 }, true)).toStrictEqual({ one: 1 });
    });
    it('returns default value when the condition parameter is false', () => {
      expect(utils.valueOrDefault("hello", false, "olleh")).toBe("olleh");
      expect(utils.valueOrDefault(12345, false, 54321)).toBe(54321);
      expect(utils.valueOrDefault({ one: 1 }, false, { two: 2 })).toStrictEqual({ two: 2 });
    });
    it('returns undefined when no default value is passed and condition parameter is false', () => {
      expect(utils.valueOrDefault("hello", false)).toBe(undefined);
      expect(utils.valueOrDefault(12345, false)).toBe(undefined);
      expect(utils.valueOrDefault({ one: 1 }, false)).toBe(undefined);
    });
  });

  describe('hasValue', () => {
    it('returns true for for values other than null or undefined', () => {
      expect(utils.hasValue('str')).toBe(true);
      expect(utils.hasValue(1)).toBe(true);
      expect(utils.hasValue(true)).toBe(true);
      expect(utils.hasValue(false)).toBe(true);
      expect(utils.hasValue({})).toBe(true);
      expect(utils.hasValue([])).toBe(true);
      expect(utils.hasValue(new Date())).toBe(true);
    });
    it('returns false for undefined', () => {
      expect(utils.hasValue(undefined)).toBe(false);
    });
    it('returns false for null', () => {
      expect(utils.hasValue(null)).toBe(false);
    });
  });
});

