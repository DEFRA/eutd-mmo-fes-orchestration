import Service from './vesselValidator.service';
import * as ReferenceService from './reference-data.service';
import { ProductLanded } from '../persistence/schema/frontEndModels/payload';
const moment = require('moment');
moment.suppressDeprecationWarnings = true;

jest.mock('axios');

function getMockObject(pln = "", vessel= "", date ="", vesselOverriddenByAdmin = false, vesselNotFound = false ): ProductLanded[] {
  return [
    {
      product: {
        id: 'some product id',
        commodityCode: 'commodityCode',
        species: {
          code: 'COD',
          label: 'Atlantic COD'
        }
      },
      landings: [
        {
          model: {
            id: 'landing id',
            vessel: {
              vesselName: vessel,
              pln,
              vesselOverriddenByAdmin,
              vesselNotFound
            },
            dateLanded: date

          }
        }
      ]
    }
  ]
}

const sinon = require('sinon');

describe('checkVesselWithDate', () => {
  it ("Should return false to show invalid if no vessel name is preset", async () => {

    expect(await Service.checkVesselWithDate(getMockObject("", "", ""))).toEqual([[false]]);

  });

  it ("Should return false to show invalid if the date is invalid", async () => {

    expect(await Service.checkVesselWithDate(getMockObject("boaty", "bty", "five/four/twentynineteen"))).toEqual([[false]]);


  });

  it ("Should return an error when a vessel doesn't have a valid license", async () => {


    const stub = sinon.stub(ReferenceService, 'checkVesselLicense').resolves(
      { response : {
        status: 404
      }}
    );

    expect(await Service.checkVesselWithDate(getMockObject("boaty", "bty", "05/05/3019"))).toEqual([[false]]);

    stub.restore();


  });

  it ("Should return true when a vessel has a valid license", async () => {

    const stub = sinon.stub(ReferenceService, 'checkVesselLicense').resolves({
      hasValidLicense: true
    });

    expect(await Service.checkVesselWithDate(getMockObject("boaty", "bty", "05/05/2019"))).toEqual([[true]]);
    stub.restore();

  });

  it("Should return true when vessel has been overridden by an admin", async () => {

    const stub = sinon.stub(ReferenceService, 'checkVesselLicense').resolves(
      { response : {
        status: 404
      }}
    );

    expect(await Service.checkVesselWithDate(getMockObject("boaty", "bty", "05/05/2019", true))).toEqual([[true]]);
    expect(stub.called).toBeFalsy();

    stub.restore();

  });
})

describe('vesselsAreValid', () => {

  let mockCheckVessel;

  const mockInput: any = ['test 1', 'test 2'];

  beforeEach(() => {
    mockCheckVessel = jest.spyOn(Service, 'checkVesselWithDate');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return true if no errors are thrown', async () => {
    mockCheckVessel.mockResolvedValue(null);

    const res = await Service.vesselsAreValid(mockInput);

    expect(res).toBe(true);
    expect(mockCheckVessel).toHaveBeenCalledWith(mockInput);
  });

  it('will log and return false if an error is thrown', async () => {
    mockCheckVessel.mockRejectedValue(new Error('test'));

    const res = await Service.vesselsAreValid(mockInput);

    expect(res).toBe(false);
    expect(mockCheckVessel).toHaveBeenCalledWith(mockInput);
  });

  describe('has items with Vessel Not Found', () => {

    it('will return true if a item has landings with vessel.vesselNotFound true', () => {
      const item =
      {
        product: {
          id: 'some product id',
          commodityCode: 'commodityCode',
          species: {
            code: 'COD',
            label: 'Atlantic COD'
          }
        },
        landings: [
          {
            model: {
              id: 'landing id',
              vessel: {
                vesselName: "vessel",
                pln : "sdsd",
                label: "Vessel not found (N/A)",
                vesselNotFound: true
              },
              dateLanded: "date"

            }
          }
        ]
      }

      expect(Service.hasProductsWithVesselsNotFound(item)).toBe(true);
    });

  });

  describe("getVesselNotFound", () => {
    it("will return the list of the Export Data that contain Vessel Not Found", async () => {
      const items = [
        {
          product: {
            id: "some product id",
            commodityCode: "commodityCode",
            species: {
              code: "COD",
              label: "Atlantic COD",
            },
          },
          landings: [
            {
              model: {
                id: "landing id",
                vessel: {
                  vesselName: "vessel",
                  pln: "sdsd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: true,
                },
                dateLanded: "05/05/3019",
              },
            },
          ],
        },
        {
          product: {
            id: "some  id",
            commodityCode: "commodityCode",
            species: {
              code: "COsdsadD",
              label: "Atlanasdtic COD",
            },
          },
          landings: [
            {
              model: {
                id: " id",
                vessel: {
                  vesselName: "vessel B",
                  pln: "sdsasdsdd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: false,
                },
                dateLanded: "05/05/3019",
              },
            },
            {
              model: {
                id: "other id",
                vessel: {
                  vesselName: "vessel c",
                  pln: "sdsasdsdd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: false,
                },
                dateLanded: "05/05/3019",
              },
            }
          ],
        },
      ];

      const expectedResult = [
        {
          product: {
            id: "some product id",
            commodityCode: "commodityCode",
            species: {
              code: "COD",
              label: "Atlantic COD",
            },
          },
          landings: [
            {
              model: {
                id: "landing id",
                vessel: {
                  vesselName: "vessel",
                  pln: "sdsd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: true,
                },
                dateLanded: "05/05/3019",
              },
            },
          ],
        },
      ]

      const res = Service.getProductsWithVesselNotFound(items);
      expect(res).toEqual(expectedResult);
    });

    it("will not return anything because Vessel Not Found does not exist.", async() => {
      const res = await Service.getProductsWithVesselNotFound(
        getMockObject("", "", "")
      );
      expect(res).toEqual([]);
    });
  });

  describe("Return a list of errors when Vessel Not Found is found", () => {
    it("will return a list of errors", async () => {

      const items = [
        {
          product: {
            state: {
              code: "aaa",
              label: "aaa"
            },
            presentation: {
              code: "aaa",
              label: "aaa"
            },
            id: "some prddsfoduct id",
            commodityCode: "commodityCode",
            species: {
              code: "COsdfdsfD",
              label: "Atlantisdfsdc COD",
            },
          },
          landings: [
            {
              model: {
                id: "landingsdfdsf id",
                vessel: {
                  vesselName: "vessel",
                  pln: "sdsd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: false,
                },
                dateLanded: "date",
              },
            },
          ],
        },
        {
          product: {
            state: {
              code: "aaa",
              label: "aaa"
            },
            presentation: {
              code: "aaa",
              label: "aaa"
            },
            id: "some product id",
            commodityCode: "undefined",
            species: {
              code: "COD",
              label: "Atlantic COD",
            },
          },
          landings: [
            {
              model: {
                id: "landing id",
                vessel: {
                  vesselName: "vessel",
                  pln: "sdsd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: true,
                },
                dateLanded: "05/05/3019",
              },
            },
          ],
        },
        {
          product: {
            state: {
              code: "aaa",
              label: "aaa"
            },
            presentation: {
              code: "aaa",
              label: "aaa"
            },
            id: "some  id",
            commodityCode: "commodityCode",
            species: {
              code: "COsdsadD",
              label: "Atlanasdtic COD",
            },
          },
          landings: [
            {
              model: {
                id: " id",
                vessel: {
                  vesselName: "vessel B",
                  pln: "sdsasdsdd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: true,
                },
                dateLanded: "05/05/3019",
              },
            },
            {
              model: {
                id: "other id",
                vessel: {
                  vesselName: "vessel c",
                  pln: "sdsasdsdd",
                  label: "Vessel not found (N/A)",
                  vesselNotFound: true,
                },
                dateLanded: "05/05/3019",
              },
            },
          ],
        },
      ];

      const expectedResult = [
        {
          state: "aaa",
          species: "COD",
          presentation: "aaa",
          date: new Date("3019-05-05T00:00:00.000Z"),
          vessel: "vessel",
          rules: ["vesselNotFound"],
        },
        {
          state: "aaa",
          species: "COsdsadD",
          presentation: "aaa",
          date: new Date("3019-05-05T00:00:00.000Z"),
          vessel: "vessel B",
          rules: ["vesselNotFound"],
        },
        {
          state: "aaa",
          species: "COsdsadD",
          presentation: "aaa",
          date: new Date("3019-05-05T00:00:00.000Z"),
          vessel: "vessel c",
          rules: ["vesselNotFound"],
        },
      ];


      const res2 = await Service.vesselsNotFound(items);
      expect(res2).toEqual(expectedResult);
    });

  });

});

describe('invalidLandingDates', () => {
   let mockNow;

  beforeEach(() => {
    mockNow = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return no errors if no landings are in the future', () => {
    mockNow.mockReturnValue('3000-01-01');

    const items: ProductLanded[] = [
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: {code: "COD", label: "Atlantic Cod"},
          state: { code: "FRO", label: "Frozen" },
          presentation: { code: "WHO", label: "Whole" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName",
                pln: "vesselPln",
                label: "vesselLabel"
              },
              dateLanded: "3000-01-01"
            }
          }
        ]
      }
    ];

    const result = Service.invalidLandingDates(items);

    expect(result).toStrictEqual([]);
  });

  it('will return no errors when time greater than 00:00 and less than 01.00 in BST', () => {
    mockNow.mockReturnValue(new Date('2021-03-29T00:30:00'));

    const items: ProductLanded[] = [
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: {code: "COD", label: "Atlantic Cod"},
          state: { code: "FRO", label: "Frozen" },
          presentation: { code: "WHO", label: "Whole" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName",
                pln: "vesselPln",
                label: "vesselLabel"
              },
              dateLanded: "2021-04-01"
            }
          }
        ]
      }
    ];

    const result = Service.invalidLandingDates(items);
    expect(result).toStrictEqual([]);
  });

  it('will not return errors if there are landings that are within the limit day', () => {
    mockNow.mockReturnValue('2021-01-01');

    const items: ProductLanded[] = [
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: { code: "COD", label: "Atlantic Cod" },
          state: { code: "FRO", label: "Frozen" },
          presentation: { code: "WHO", label: "Whole" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName-1",
                pln: "vesselPln-1",
                label: "vesselLabel-1"
              },
              dateLanded: "2021-01-04"
            }
          },
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName-2",
                pln: "vesselPln-2",
                label: "vesselLabel-2"
              },
              dateLanded: "2021-01-02"
            }
          }
        ]
      }
    ];

    const result = Service.invalidLandingDates(items);

    expect(result).toStrictEqual([]);
  });

  it('will return a error if a landing is more than 3 days in the future', () => {
    mockNow.mockReturnValue('2020-01-01');

    const items: ProductLanded[] = [
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: {code: "COD", label: "Atlantic Cod"},
          state: { code: "FRO", label: "Frozen" },
          presentation: { code: "WHO", label: "Whole" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName",
                pln: "vesselPln",
                label: "vesselLabel"
              },
              dateLanded: "2020-01-05"
            }
          }
        ]
      }
    ];

    const result = Service.invalidLandingDates(items);

    expect(result).toStrictEqual([
      {
        state: "FRO",
        species: "COD",
        presentation: "WHO",
        date: new Date("2020-01-05"),
        vessel: "vesselName",
        rules: ["invalidLandingDate"],
      }
    ]);
  });

  it('will return multiple errors if multiple landings are more than 3 days in the future', () => {
    mockNow.mockReturnValue('2020-01-01');

    const items: ProductLanded[] = [
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: {code: "COD", label: "Atlantic Cod"},
          state: { code: "FRO", label: "Frozen" },
          presentation: { code: "WHO", label: "Whole" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName1",
                pln: "vesselPln1",
                label: "vesselLabel1"
              },
              dateLanded: "2020-01-05" // invalid
            }
          },
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName2",
                pln: "vesselPln2",
                label: "vesselLabel2"
              },
              dateLanded: "2020-01-06" // invalid
            }
          },
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName3",
                pln: "vesselPln3",
                label: "vesselLabel3"
              },
              dateLanded: "2020-01-02" // valid
            }
          }
        ]
      },
      {
        product: {
          id: "productId",
          commodityCode: 'commodityCode',
          species: {code: "HER", label: "Herring"},
          state: { code: "FRE", label: "Fresh" },
          presentation: { code: "FIL", label: "Filletted" }
        },
        landings: [
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName4",
                pln: "vesselPln4",
                label: "vesselLabel4"
              },
              dateLanded: "2020-01-03" // valid
            }
          },
          {
            model: {
              id: "landingId",
              vessel: {
                vesselName: "vesselName5",
                pln: "vesselPln5",
                label: "vesselLabel5"
              },
              dateLanded: "2020-01-07" // invalid
            }
          }
        ]
      }
    ];

    const result = Service.invalidLandingDates(items);

    expect(result).toStrictEqual([
      {
        state: "FRO",
        species: "COD",
        presentation: "WHO",
        date: new Date("2020-01-05"),
        vessel: "vesselName1",
        rules: ["invalidLandingDate"],
      },
      {
        state: "FRO",
        species: "COD",
        presentation: "WHO",
        date: new Date("2020-01-06"),
        vessel: "vesselName2",
        rules: ["invalidLandingDate"],
      },
      {
        state: "FRE",
        species: "HER",
        presentation: "FIL",
        date: new Date("2020-01-07"),
        vessel: "vesselName5",
        rules: ["invalidLandingDate"],
      }
    ]);
  });

});