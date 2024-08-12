import { cloneDeep } from 'lodash';
import * as BackEndModels from "../../schema/catchCert"
import * as FrontEndModels from './payload';

const backendProduct: BackEndModels.Product = {
  species: 'test-species-label',
  speciesAdmin: undefined,
  speciesId: 'test-product-id',
  speciesCode: 'test-species-code',
  commodityCode: 'test-commodityCode',
  commodityCodeDescription: 'test-commodityCodeDescription',
  commodityCodeAdmin: undefined,
  factor : 2.3,
  state: {
    name: 'test-state-label',
    code: 'test-state-code',
    admin: undefined,
  },
  scientificName: "test-scientific-name",
  presentation: {
    name: 'test-presentation-label',
    code: 'test-presentation-code',
    admin: undefined,
  },
  caughtBy: [{
    vessel: 'test-vesselName',
    pln: 'test-pln',
    homePort: 'test-homePort',
    flag: 'test-flag',
    cfr: 'test-cfr',
    licenceNumber: 'test-licenceNumber',
    licenceHolder: 'test-licenceHolder',
    imoNumber: 'test-imoNumber',
    licenceValidTo: '2020-02-05',
    id: 'test-id',
    date: '2020-02-04',
    faoArea: 'test-fao',
    weight: 1000,
    numberOfSubmissions: 1,
    vesselOverriddenByAdmin: true
  }]
};

describe('toBackEndProductsLanded', () => {

  it('should convert from frontend ProductsLanded model to backend product model when all optional fields are included', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeAdmin: undefined,
          commodityCodeDescription: 'test-commodityCodeDescription',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code',
            admin: undefined
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code',
            admin: undefined
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code',
            admin: undefined
          }
        },
        landings: [{
          model: {
            id: 'test-id',
            numberOfSubmissions: 1,
            vessel: {
              pln: 'test-pln',
              vesselName: 'test-vesselName',
              homePort: 'test-homePort',
              flag: 'test-flag',
              cfr: 'test-cfr',
              licenceNumber: 'test-licenceNumber',
              licenceHolder: 'test-licenceHolder',
              imoNumber: 'test-imoNumber',
              licenceValidTo: '2020-02-05',
              rssNumber: 'test-rssNumber',
              vesselLength: 100,
              label: 'test-label',
              domId: 'test-domId',
              vesselOverriddenByAdmin: true
            },
            dateLanded: '2020-02-04',
            exportWeight: 1000,
            faoArea: 'test-fao'
          }
        }]
      }]
    };

    const expected: BackEndModels.Product[] = [backendProduct];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });

  it('should convert from frontend ProductsLanded model to backend product model with admin values', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeAdmin: 'test-commodity-code-admin',
          commodityCodeDescription: 'test-commodityCodeDescription',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code',
            admin: 'test-presentation-admin'
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code',
            admin: 'test-state-admin'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code',
            admin: 'test-species-admin'
          }
        },
        landings: [{
          model: {
            id: 'test-id',
            numberOfSubmissions: 1,
            vessel: {
              pln: 'test-pln',
              vesselName: 'test-vesselName',
              homePort: 'test-homePort',
              flag: 'test-flag',
              cfr: 'test-cfr',
              licenceNumber: 'test-licenceNumber',
              licenceHolder: 'test-licenceHolder',
              imoNumber: 'test-imoNumber',
              licenceValidTo: '2020-02-05',
              rssNumber: 'test-rssNumber',
              vesselLength: 100,
              label: 'test-label',
              domId: 'test-domId',
              vesselOverriddenByAdmin: true
            },
            dateLanded: '2020-02-04',
            exportWeight: 1000,
            faoArea: 'test-fao'
          }
        }]
      }]
    };

    const expected: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesAdmin: 'test-species-admin',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeDescription: 'test-commodityCodeDescription',
      commodityCodeAdmin: 'test-commodity-code-admin',
      factor : 2.3,
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: 'test-state-admin',
      },
      scientificName: "test-scientific-name",
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: 'test-presentation-admin',
      },
      caughtBy: [{
        vessel: 'test-vesselName',
        pln: 'test-pln',
        homePort: 'test-homePort',
        flag: 'test-flag',
        cfr: 'test-cfr',
        licenceNumber: 'test-licenceNumber',
        licenceHolder: 'test-licenceHolder',
        imoNumber: 'test-imoNumber',
        licenceValidTo: '2020-02-05',
        id: 'test-id',
        date: '2020-02-04',
        faoArea: 'test-fao',
        weight: 1000,
        numberOfSubmissions: 1,
        vesselOverriddenByAdmin: true
      }]
    }];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });

  it('should convert from frontend ProductsLanded model to backend Product model when all optional fields are excluded', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeDescription: 'test-commodity-code-description',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code'
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code'
          }
        }
      }]
    };

    const expected: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesId: 'test-product-id',
      speciesAdmin: undefined,
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeAdmin: undefined,
      commodityCodeDescription: 'test-commodity-code-description',
      factor : 2.3,
      scientificName: 'test-scientific-name',
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: undefined
      },
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: undefined
      },
      caughtBy: []
    }];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });

  it('should allow for a landing with just an id', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeDescription: 'test-commodityCodeDescription',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code'
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code'
          }
        },
        landings: [
          {
            model: {
              id: 'test-landing-id'
            }
          }
        ]
      }]
    };

    const expected: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesAdmin: undefined,
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeAdmin: undefined,
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor : 2.3,
      scientificName: "test-scientific-name",
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: undefined
      },
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: undefined
      },
      caughtBy: [{
        id: 'test-landing-id'
      }]
    }];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });

  it('should allow for a landing with validation errors', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeDescription: 'test-commodityCodeDescription',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code'
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code'
          }
        },
        landings: [
          {
            model: {
              id: 'test-landing-id'
            },
            error: "invalid",
            errors: {
              "dateLanded": 'blah',
              "vessel.vesselName": 'blah',
              "exportWeight": 'blah'
            }
          }
        ]
      }]
    };

    const expected: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesAdmin: undefined,
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeAdmin: undefined,
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor : 2.3,
      scientificName: "test-scientific-name",
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: undefined
      },
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: undefined
      },
      caughtBy: [{
        id: 'test-landing-id'
      }]
    }];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });

  it('should allow for a landing with validation errors with no JS', () => {
    const input: FrontEndModels.ProductsLanded = {
      items : [{
        product: {
          id: 'test-product-id',
          commodityCode: 'test-commodityCode',
          commodityCodeDescription: 'test-commodityCodeDescription',
          factor : 2.3,
          presentation: {
            label: 'test-presentation-label',
            code: 'test-presentation-code'
          },
          scientificName: 'test-scientific-name',
          state: {
            label: 'test-state-label',
            code: 'test-state-code'
          },
          species: {
            label: 'test-species-label',
            code: 'test-species-code'
          }
        },
        landings: [
          {
            model: {
              id: 'test-landing-id'
            },
            error: "invalid",
            errors: {
              "dateLanded": 'blah',
              "vessel.label": 'blah',
              "exportWeight": 'blah'
            }
          }
        ]
      }]
    };

    const expected: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesAdmin: undefined,
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeAdmin: undefined,
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor : 2.3,
      scientificName: "test-scientific-name",
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: undefined
      },
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: undefined
      },
      caughtBy: [{
        id: 'test-landing-id'
      }]
    }];

    expect(FrontEndModels.toBackEndProductsLanded(input)).toStrictEqual(expected);
  });
});

describe('toFrontEndProductLanded', () => {

  it('should return a frontend model when given a BE model', () => {
    const frontendProduct: FrontEndModels.ProductLanded = {
      product: {
        id: 'test-product-id',
        commodityCode: 'test-commodityCode',
        commodityCodeDescription: 'test-commodityCodeDescription',
        factor : 2.3,
        presentation: {
          label: 'test-presentation-label',
          code: 'test-presentation-code',
          admin: undefined
        },
        scientificName: 'test-scientific-name',
        state: {
          label: 'test-state-label',
          code: 'test-state-code',
          admin: undefined
        },
        species: {
          label: 'test-species-label',
          code: 'test-species-code',
          admin: undefined
        }
      },
      landings: [{
        model: {
          id: 'test-id',
          numberOfSubmissions: 1,
          vessel: {
            pln: 'test-pln',
            vesselName: 'test-vesselName',
            label: 'test-vesselName (test-pln)',
            homePort: 'test-homePort',
            flag: 'test-flag',
            cfr: 'test-cfr',
            licenceNumber: 'test-licenceNumber',
            licenceHolder: "test-licenceHolder",
            imoNumber: 'test-imoNumber',
            licenceValidTo: '2020-02-05',
            vesselOverriddenByAdmin: true
          },
          dateLanded: '2020-02-04',
          exportWeight: 1000,
          faoArea: 'test-fao'
        }
      }]
    };


    expect(FrontEndModels.toFrontEndProductLanded(backendProduct)).toStrictEqual(frontendProduct);
  });

  it('should allow for a landing with just an id', () => {
    const product = cloneDeep(backendProduct);
    product.caughtBy[0] = {
      id: 'test-id'
    };

    const expected: FrontEndModels.ProductLanded = {
      product: {
        id: 'test-product-id',
        commodityCode: 'test-commodityCode',
        commodityCodeDescription: 'test-commodityCodeDescription',
        factor : 2.3,
        presentation: {
          label: 'test-presentation-label',
          code: 'test-presentation-code'
        },
        scientificName: 'test-scientific-name',
        state: {
          label: 'test-state-label',
          code: 'test-state-code'
        },
        species: {
          label: 'test-species-label',
          code: 'test-species-code'
        }
      },
      landings: [{
        model: {
          id: 'test-id'
        }
      }]
    }

    const result = FrontEndModels.toFrontEndProductLanded(product);

    expect(result).toEqual(expected);
  });

  it('should allow for species code and label only', () => {
    const product: BackEndModels.Product = {
      species: 'test-species-label',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      factor : 2.3,
      caughtBy : []
    };

    const frontendProduct: FrontEndModels.ProductLanded = {
      product: {
        id: 'test-product-id',
        commodityCode: 'test-commodityCode',
        factor : 2.3,
        species: {
          label: 'test-species-label',
          code: 'test-species-code',
          admin: undefined
        }
      }
    };

    expect(FrontEndModels.toFrontEndProductLanded(product)).toStrictEqual(frontendProduct);

  });

  it('should have a vessel override property', () => {
    const product: BackEndModels.Product = {
      species: 'test-species-label',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      scientificName: 'test-scientific-name',
      commodityCode: 'test-commodityCode',
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor: 2.3,
      caughtBy: [{
        numberOfSubmissions: 0,
        vessel: "UPDATED VESSEL NAME",
        pln: "UPDATED PLN",
        homePort: "OLD HOME PORT",
        flag: "GBR",
        cfr: "GBRC102121",
        imoNumber: null,
        licenceNumber: "OLD LICENCE NUMBER",
        licenceValidTo: "OLD LICENCE VALID TO",
        licenceHolder: "I am the Licence Holder name for this fishing boat",
        id: "GBR-2021-CC-C6A7D756F-1610013801",
        date: "2021-01-07",
        faoArea: "FAO27",
        weight: 12,
        vesselOverriddenByAdmin: true
      }]
    };

    const frontendProduct: FrontEndModels.ProductLanded = {
      product: {
        id: 'test-product-id',
        commodityCode: 'test-commodityCode',
        commodityCodeDescription: 'test-commodityCodeDescription',
        factor: 2.3,
        species: {
          label: 'test-species-label',
          code: 'test-species-code',
          admin: undefined
        },
        scientificName: 'test-scientific-name',
      },
      landings: [{
        model: {
          id: "GBR-2021-CC-C6A7D756F-1610013801",
          dateLanded: "2021-01-07",
          faoArea: "FAO27",
          exportWeight: 12,
          numberOfSubmissions: 0,
          vessel: {
            vesselOverriddenByAdmin: true,
            pln: "UPDATED PLN",
            vesselName: "UPDATED VESSEL NAME",
            label: "UPDATED VESSEL NAME (UPDATED PLN)",
            homePort: "OLD HOME PORT",
            flag: "GBR",
            cfr: "GBRC102121",
            imoNumber: null,
            licenceNumber: "OLD LICENCE NUMBER",
            licenceValidTo: "OLD LICENCE VALID TO",
            licenceHolder: "I am the Licence Holder name for this fishing boat"
          }
        }
      }]
    };

    expect(FrontEndModels.toFrontEndProductLanded(product)).toStrictEqual(frontendProduct);
  });

  it('should have a admin species override values', () => {
    const product: BackEndModels.Product = {
      species: 'test-species-label',
      speciesAdmin: 'test-species-admin',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      scientificName: 'test-scientific-name',
      commodityCode: 'test-commodityCode',
      commodityCodeAdmin: 'test-commodityCode-admin',
      commodityCodeDescription: 'test-commodityCodeDescription',
      state: {
        code: 'FRE',
        name: 'Fresh',
        admin: 'Admin'
      },
      presentation: {
        code: 'WHL',
        name: 'Whole',
        admin: 'Admin'
      },
      factor: 2.3,
      caughtBy: [{
        numberOfSubmissions: 0,
        vessel: "UPDATED VESSEL NAME",
        pln: "UPDATED PLN",
        homePort: "OLD HOME PORT",
        flag: "GBR",
        cfr: "GBRC102121",
        imoNumber: null,
        licenceNumber: "OLD LICENCE NUMBER",
        licenceValidTo: "OLD LICENCE VALID TO",
        licenceHolder: "I am the Licence Holder name for this fishing boat",
        id: "GBR-2021-CC-C6A7D756F-1610013801",
        date: "2021-01-07",
        faoArea: "FAO27",
        weight: 12
      }]
    };

    const frontendProduct: FrontEndModels.ProductLanded = {
      product: {
        id: 'test-product-id',
        commodityCode: 'test-commodityCode',
        commodityCodeAdmin: "test-commodityCode-admin",
        commodityCodeDescription: 'test-commodityCodeDescription',
        factor: 2.3,
        species: {
          label: 'test-species-label',
          code: 'test-species-code',
          admin: 'test-species-admin'
        },
        state: {
          label: 'Fresh',
          code: 'FRE',
          admin: 'Admin'
        },
        presentation: {
          label: 'Whole',
          code: 'WHL',
          admin: 'Admin'
        },
        scientificName: 'test-scientific-name',
      },
      landings: [{
        model: {
          id: "GBR-2021-CC-C6A7D756F-1610013801",
          dateLanded: "2021-01-07",
          faoArea: "FAO27",
          exportWeight: 12,
          numberOfSubmissions: 0,
          vessel: {
            pln: "UPDATED PLN",
            vesselName: "UPDATED VESSEL NAME",
            label: "UPDATED VESSEL NAME (UPDATED PLN)",
            homePort: "OLD HOME PORT",
            flag: "GBR",
            cfr: "GBRC102121",
            imoNumber: null,
            licenceNumber: "OLD LICENCE NUMBER",
            licenceValidTo: "OLD LICENCE VALID TO",
            licenceHolder: "I am the Licence Holder name for this fishing boat"
          }
        }
      }]
    };

    expect(FrontEndModels.toFrontEndProductLanded(product)).toStrictEqual(frontendProduct);
  });
});

describe('toFrontEndProductsLanded', () => {

  let mockMap;

  beforeAll(() => {
    mockMap = jest.spyOn(FrontEndModels, 'toFrontEndProductLanded');
    mockMap.mockReturnValue('test');
  });

  afterAll(() => {
    mockMap.mockRestore();
  });

  it('should call toFrontEndProductLanded for each item in the input array', () => {
    const input: BackEndModels.Product[] = [backendProduct, backendProduct];

    const res = FrontEndModels.toFrontEndProductsLanded(input);

    expect(res).toStrictEqual({items: ['test', 'test']});
  })

  it('should call toFrontEndProductLanded even if items array is empty', () => {
    const input: BackEndModels.Product[] = [];

    const res = FrontEndModels.toFrontEndProductsLanded(input);

    expect(res).toStrictEqual({items: []});
  })

  it('should call toFrontEndProductLanded when the input is undefined', () => {
    const res = FrontEndModels.toFrontEndProductsLanded(undefined);

    expect(res).toStrictEqual({items: []});
  })
});

describe('getNumberOfUniqueLandings', () => {

  const createProduct = (landings: any[] = []) => ({
    product: {
      id: 'test-product-id',
      commodityCode: 'test-commodityCode',
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor : 2.3,
      presentation: {
        label: 'test-presentation-label',
        code: 'test-presentation-code'
      },
      scientificName: 'test-scientific-name',
      state: {
        label: 'test-state-label',
        code: 'test-state-code'
      },
      species: {
        label: 'test-species-label',
        code: 'test-species-code'
      }
    },
    landings: landings
  });

  const createLanding = (pln: string = 'test-pln', dateLanded: string = '2020-02-04', vesselOverriddenByAdmin?: Boolean) => ({
    model: {
      id: 'test-landing-id',
      numberOfSubmissions: 1,
      vessel: {
        pln: pln,
        vesselName: 'test-vesselName',
        homePort: 'test-homePort',
        flag: 'test-flag',
        cfr: 'test-cfr',
        licenceNumber: 'test-licenseNumber',
        imoNumber: 'test-imoNumber',
        licenceValidTo: '2020-02-05',
        rssNumber: 'test-rssNumber',
        vesselLength: 100,
        label: 'test-label',
        domId: 'test-domId',
        vesselOverriddenByAdmin
      },
      dateLanded: dateLanded,
      exportWeight: 1000,
      faoArea: 'test-fao'
    }
  });

  it('returns the number of unique landings in a ProductsLanded object', () => {

    const landing1 = createLanding('pln1', '2020-01-01');
    const landing2 = createLanding('pln2', '2020-01-01');
    const landing3 = createLanding('pln1', '2020-01-02');
    const landing4 = createLanding('pln3', '2020-01-03', true);

    const input: FrontEndModels.ProductsLanded = {
      items : [
        createProduct([landing1, landing2]),
        createProduct([landing3]),
        createProduct([landing3]),
        createProduct([landing2]),
        createProduct([landing4]),
        createProduct()
      ]
    };

    const result = FrontEndModels.getNumberOfUniqueLandings(input);

    expect(result).toBe(4);
  });

});

describe('toFrontEndDirectLanding', () => {
  it('should return a direct landing for a single product', () => {
    const input: BackEndModels.Product[] = [backendProduct];

    const expected: FrontEndModels.DirectLanding = {
      "id":"test-id",
      "vessel": {
        "pln": "test-pln",
        "vesselName": "test-vesselName",
        "flag": "test-flag",
        "cfr": "test-cfr",
        "homePort": "test-homePort",
        "licenceNumber": "test-licenceNumber",
        "licenceHolder": "test-licenceHolder",
        "imoNumber": 'test-imoNumber',
        "licenceValidTo": "2020-02-05",
        "vesselOverriddenByAdmin": true,
      },
      "dateLanded": "2020-02-04",
      "faoArea": "test-fao",
      "numberOfSubmissions": 1,
      "weights": [{
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
        "exportWeight": 1000,
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing for a single product with admin values', () => {
    const input: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesAdmin: 'test-species-admin',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeDescription: 'test-commodityCodeDescription',
      commodityCodeAdmin: 'test-commodity-code-admin',
      factor : 2.3,
      state: {
        name: 'test-state-label',
        code: 'test-state-code',
        admin: 'test-state-admin',
      },
      scientificName: "test-scientific-name",
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code',
        admin: 'test-presentation-admin',
      },
      caughtBy: [{
        vessel: 'test-vesselName',
        pln: 'test-pln',
        homePort: 'test-homePort',
        flag: 'test-flag',
        cfr: 'test-cfr',
        licenceNumber: 'test-licenceNumber',
        licenceHolder: 'test-licenceHolder',
        imoNumber: 'test-imoNumber',
        licenceValidTo: '2020-02-05',
        id: 'test-id',
        date: '2020-02-04',
        faoArea: 'test-fao',
        weight: 1000,
        numberOfSubmissions: 1
      }]
    }];

    const expected: FrontEndModels.DirectLanding = {
      "id":"test-id",
      "vessel": {
        "pln": "test-pln",
        "vesselName": "test-vesselName",
        "flag": "test-flag",
        "cfr": "test-cfr",
        "homePort": "test-homePort",
        "licenceNumber": "test-licenceNumber",
        "licenceHolder": "test-licenceHolder",
        "imoNumber": 'test-imoNumber',
        "licenceValidTo": "2020-02-05"
      },
      "dateLanded": "2020-02-04",
      "faoArea": "test-fao",
      "numberOfSubmissions": 1,
      "weights": [{
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-admin, test-state-admin, test-presentation-admin, test-commodity-code-admin",
        "exportWeight": 1000,
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing for a multiple products', () => {
    const input: BackEndModels.Product[] = [backendProduct,backendProduct,backendProduct];

    const expected: FrontEndModels.DirectLanding = {
      "id":"test-id",
      "numberOfSubmissions": 1,
      "vessel": {
        "pln": "test-pln",
        "vesselName": "test-vesselName",
        "vesselOverriddenByAdmin": true,
        "flag": "test-flag",
        "cfr": "test-cfr",
        "homePort": "test-homePort",
        "licenceNumber": "test-licenceNumber",
        "licenceHolder": "test-licenceHolder",
        "imoNumber": 'test-imoNumber',
        "licenceValidTo": "2020-02-05",
      },
      "dateLanded": "2020-02-04",
      "faoArea": "test-fao",
      "weights": [{
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
        "exportWeight": 1000,
      },
      {
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
        "exportWeight": 1000,
      },
      {
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
        "exportWeight": 1000,
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing for multiple products with vary levels of data', () => {
    const input: BackEndModels.Product[] = [
      backendProduct,
      {
        species: 'species-label',
        speciesId: 'product-id',
        speciesCode: 'species-code',
        commodityCode: 'commodityCode',
        commodityCodeDescription: 'commodityCodeDescription',
        factor : 2.3,
        state: {
          name: 'state-label',
          code: 'state-code'
        },
        scientificName: "scientific-name",
        presentation: {
          name: 'presentation-label',
          code: 'presentation-code'
        },
        caughtBy: [{
          vessel: 'vesselName',
          pln: 'pln',
          homePort: 'homePort',
          flag: 'flag',
          cfr: 'cfr',
          licenceNumber: 'licenceNumber',
          imoNumber: 'imoNumber',
          licenceValidTo: '2020-02-05',
          id: 'id',
          date: '2020-02-04',
          faoArea: 'fao',
          weight: 1,
          numberOfSubmissions: 1,
          vesselOverriddenByAdmin: true,
          vesselNotFound: true
        }]
      },
      {
        species: 'test-species-label',
        speciesId: 'test-product-id',
        speciesCode: 'test-species-code',
        commodityCode: 'test-commodityCode',
        commodityCodeDescription: 'test-commodityCodeDescription',
        factor : 2.3,
        state: {
          name: 'test-state-label',
          code: 'test-state-code'
        },
        scientificName: "test-scientific-name",
        presentation: {
          name: 'test-presentation-label',
          code: 'test-presentation-code'
        }
      },{
        speciesId: 'test-product-id',
      }, undefined];

    const expected: FrontEndModels.DirectLanding = {
      "id":"test-id",
      "numberOfSubmissions": 1,
      "vessel": {
        "pln": "test-pln",
        "vesselName": "test-vesselName",
        "vesselOverriddenByAdmin": true,
        "flag": "test-flag",
        "cfr": "test-cfr",
        "homePort": "test-homePort",
        "licenceNumber": "test-licenceNumber",
        "licenceHolder": "test-licenceHolder",
        "imoNumber": 'test-imoNumber',
        "licenceValidTo": "2020-02-05",
      },
      "dateLanded": "2020-02-04",
      "faoArea": "test-fao",
      "weights": [{
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
        "exportWeight": 1000,
      },
      {
        "speciesId": "product-id",
        "speciesLabel": "species-label, state-label, presentation-label, commodityCode",
        "exportWeight": 1,
      },
      {
        "speciesId": "test-product-id",
        "speciesLabel": "test-species-label, test-state-label, test-presentation-label, test-commodityCode",
      },
      {
        "speciesId": "test-product-id",
      },
      {
        "speciesId": "",
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing with the minimum data for a product', () => {
    const input: BackEndModels.Product[] = [{
      speciesId: 'species-id'
    }];

    const expected: FrontEndModels.DirectLanding = {
      weights: [{
        speciesId: 'species-id'
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing with no products', () => {
    const input: BackEndModels.Product[] = [];

    const expected: FrontEndModels.DirectLanding = {
      weights: []
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });

  it('should return a direct landing with no landings', () => {
    const input: BackEndModels.Product[] = [{
      species: 'test-species-label',
      speciesId: 'test-product-id',
      speciesCode: 'test-species-code',
      commodityCode: 'test-commodityCode',
      commodityCodeDescription: 'test-commodityCodeDescription',
      factor : 2.3,
      state: {
        name: 'test-state-label',
        code: 'test-state-code'
      },
      scientificName: "test-scientific-name",
      presentation: {
        name: 'test-presentation-label',
        code: 'test-presentation-code'
      }
    }];

    const expected: FrontEndModels.DirectLanding = {
      weights: [{
        speciesId: 'test-product-id',
        speciesLabel: 'test-species-label, test-state-label, test-presentation-label, test-commodityCode'
      }]
    };

    const result = FrontEndModels.toFrontEndDirectLanding(input);

    expect(result).toStrictEqual(expected);
  });
});

describe('toFrontEndValidationFailure', () => {

  it('will map IExportCertificateResults to ValidationFailure[]', () => {
    const input = {
      documentNumber: 'documentNumber',
      uri: 'uri',
      report: [
        {
          failures : ['3C', '3D', '4A'],
          state: 'test',
          species: 'test',
          presentation: 'test',
          vessel: 'test',
          date: new Date('2019-11-25')
        },
        {
          failures : ['4A', '3D'],
          state: 'test2',
          species: 'test2',
          presentation: 'test2',
          vessel: 'test2',
          date: new Date('2019-11-26')
        }
      ],
      isBlockingEnabled: true
    };

    const result = FrontEndModels.toFrontEndValidationFailure(input);

    expect(result).toStrictEqual([
      {
        state: 'test',
        species: 'test',
        presentation: 'test',
        date: new Date('2019-11-25'),
        vessel: 'test',
        rules: ['3C', '3D', '4A']
      },
      {
        state: 'test2',
        species: 'test2',
        presentation: 'test2',
        date: new Date('2019-11-26'),
        vessel: 'test2',
        rules: ['4A', '3D']
      }
    ]);
  });

});

describe('toProduct', () => {
  it('should map a payload containing a product to a Product', () => {
    const payload: any = {
      id: "some-species-product-id",
      product: {
        species: "species",
        id: "species-id",
        speciesCode: "species-code",
        state: "species-state-code",
        scientificName: "scientific-name",
        stateLabel: "species-state-name",
        presentation: "species-presentation-code",
        presentationLabel: "species-presentation-name",
        commodity_code: "species-commodityCode",
        commodity_code_description: "species-commodity-code-description",
      },
      factor: 1
    };

    const expected: FrontEndModels.Product = {
      id: "some-species-product-id",
      commodityCode: "species-commodityCode",
      commodityCodeDescription: "species-commodity-code-description",
      scientificName: "scientific-name",
      presentation: {
        code: "species-presentation-code",
        label: "species-presentation-name"
      },
      state: {
        code: "species-state-code",
        label: "species-state-name"
      },
      species: {
        code: "species-code",
        label: "species"
      },
      factor: 1
    }

    expect(FrontEndModels.toProduct(payload)).toEqual(expected);
  });

  it('should map a payload containing a product to a Product with admin values', () => {
    const payload: any = {
      id: "some-species-product-id",
      product: {
        species: "species",
        speciesAdmin: "species-admin",
        id: "species-id",
        speciesCode: "species-code",
        state: "species-state-code",
        scientificName: "scientific-name",
        stateLabel: "species-state-name",
        stateAdmin: "species-state-admin",
        presentation: "species-presentation-code",
        presentationLabel: "species-presentation-name",
        presentationAdmin: "species-presentation-admin",
        commodity_code: "species-commodityCode",
        commodity_code_admin: "species-commodityCode-admin",
        commodity_code_description: "species-commodity-code-description",
      },
      factor: 1
    };

    const expected: FrontEndModels.Product = {
      id: "some-species-product-id",
      commodityCode: "species-commodityCode",
      commodityCodeDescription: "species-commodity-code-description",
      commodityCodeAdmin: "species-commodityCode-admin",
      scientificName: "scientific-name",
      presentation: {
        code: "species-presentation-code",
        label: "species-presentation-name",
        admin: "species-presentation-admin"
      },
      state: {
        code: "species-state-code",
        label: "species-state-name",
        admin: "species-state-admin"
      },
      species: {
        code: "species-code",
        label: "species",
        admin: "species-admin"
      },
      factor: 1
    }

    expect(FrontEndModels.toProduct(payload)).toEqual(expected);
  });

  it('should map a payload containing an undefined product to a Product', () => {
    const payload: any = {
      id: "some-species-product-id",
      product: undefined,
      factor: 1
    };

    const expected: FrontEndModels.Product = {
      id: "some-species-product-id",
      commodityCode: "",
      commodityCodeAdmin: undefined,
      commodityCodeDescription: undefined,
      scientificName: undefined,
      presentation: {
        code: "",
        label: "",
        admin: undefined
      },
      state: {
        code: "",
        label: "",
        admin: undefined
      },
      species: {
        code: "",
        label: "",
        admin: undefined
      },
      factor: 1
    }

    expect(FrontEndModels.toProduct(payload)).toEqual(expected);
  });

  it('should map an undefined to a Product', () => {
    const payload = undefined;

    const expected: FrontEndModels.Product = undefined;

    expect(FrontEndModels.toProduct(payload)).toEqual(expected);
  });

});