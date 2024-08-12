import { toExportedTo, ICountry } from './common';

describe('toExportedTo', () => {

  it('will convert an old exportedTo into a new one', () => {
    const oldExportedTo: string = "Nigeria";

    const expected: ICountry = {
      officialCountryName: "Nigeria"
    };

    expect(toExportedTo(oldExportedTo)).toStrictEqual(expected);
  });

  it('will not convert an new exportedTo', () => {
    const newExportedTo: ICountry = {
      officialCountryName: "Nigeria",
      isoCodeAlpha2: "some alpha 2",
      isoCodeAlpha3: "some alpha 3",
      isoNumericCode: "some numerical code"
    };

    const expected: ICountry = {
      officialCountryName: "Nigeria",
      isoCodeAlpha2: "some alpha 2",
      isoCodeAlpha3: "some alpha 3",
      isoNumericCode: "some numerical code"
    };

    expect(toExportedTo(newExportedTo)).toStrictEqual(expected);
  });

});