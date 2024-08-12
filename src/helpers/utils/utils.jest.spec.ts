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
});
