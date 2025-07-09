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

  describe('looksLikeADate', () => {
    it('returns true for UK short date format', () => {
      expect(utils.looksLikeADate('01/01/2025')).toBe(true);
      expect(utils.looksLikeADate('01/01/25')).toBe(true);
    });
    it('returns true when the value contains at least two instances of a number and forward slash pair', () => {
      expect(utils.looksLikeADate('2/3/')).toBe(true);
    });
    it('returns true when the value contains at least two instances of multiple numbers and forward slash pair', () => {
      expect(utils.looksLikeADate('222/3555/')).toBe(true);
    });
    it('returns true when the value contains a double forwardslash', () => {
      expect(utils.looksLikeADate('2//3/')).toBe(true);
    });
    it('returns false for ISO short date format', () => {
      expect(utils.looksLikeADate('2025-01-01')).toBe(false);
    });
    it('returns false when the value contains at least one number and one forward slash', () => {
      expect(utils.looksLikeADate('2/')).toBe(false);
    });
    it('returns false when the value contains only numbers', () => {
      expect(utils.looksLikeADate('12345')).toBe(false);
    });
    it('returns false when the value contains only forward slashes', () => {
      expect(utils.looksLikeADate('/////')).toBe(false);
    });
    it('returns false when the value contains only forward slashes', () => {
      expect(utils.looksLikeADate('/////')).toBe(false);
    });
  });
});
