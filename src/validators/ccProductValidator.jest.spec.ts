import * as ProductValidator from './ccProductValidator'
const referenceDataService = require('../services/reference-data.service')

describe('seasonalFish', () => {
  let mockGetSeasonalFish;

  beforeEach(() => {
    mockGetSeasonalFish = jest.spyOn(referenceDataService, 'getSeasonalFish')
    mockGetSeasonalFish.mockResolvedValue([
      { fao: 'LBE', validFrom: '2019-01-01T00:00:00', validTo: '2019-03-31T23:59:59' }
    ])
  })
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('valid product', async () => {

    const products = [{
      product: {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        commodityCode: "03063210",
        presentation: { code: "WHL", label: "Whole" },
        state: { code: "ALI", label: "Alive" },
        species: { code: "LBE", label: "European lobster (LBE)" }
      },
      landings: [{
        model: {
          id: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
          vessel: {
            pln: "LO574",
            vesselName: "ABBIE LOU",
            flag: "GBR",
            homePort: "LEIGH-ON-SEA",
            licenceNumber: "25893",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "C18644",
            vesselLength: 9.95,
            label: "ABBIE LOU (LO574)",
            domId: "ABBIELOU-LO574"
          },
          dateLanded: "2019-11-18T00:00:00.000Z",
          exportWeight: 88,
          faoArea: "FAO27"
        }
      }]
    }]

    const expected = [
      {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
        pln: "LO574",
        dateLanded: "2019-11-18T00:00:00.000Z",
        species: { code: "LBE", label: "European lobster (LBE)" },
        weight: 88,
        validator: "seasonalFish",
        result: []
      },
    ];

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('invalid product boundary', async () => {

    const products = [{
      product: {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        commodityCode: "03063210",
        presentation: { code: "WHL", label: "Whole" },
        state: { code: "ALI", label: "Alive" },
        species: { code: "LBE", label: "European lobster (LBE)" }
      },
      landings: [{
        model: {
          id: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
          vessel: {
            pln: "LO574",
            vesselName: "ABBIE LOU",
            flag: "GBR",
            homePort: "LEIGH-ON-SEA",
            licenceNumber: "25893",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "C18644",
            vesselLength: 9.95,
            label: "ABBIE LOU (LO574)",
            domId: "ABBIELOU-LO574"
          },
          dateLanded: "2019-01-01T00:00:00.000Z",
          exportWeight: 88,
          faoArea: "FAO27"
        }
      }]
    }]

    const expected = [{
      id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
      landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
      pln: 'LO574',
      dateLanded: '2019-01-01T00:00:00.000Z',
      species: { code: 'LBE', label: 'European lobster (LBE)' },
      weight: 88,
      validator: 'seasonalFish',
      result: ['dateLanded']
    }]

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('invalid product end boundary', async () => {

    const products = [{
      product: {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        commodityCode: "03063210",
        presentation: { code: "WHL", label: "Whole" },
        state: { code: "ALI", label: "Alive" },
        species: { code: "LBE", label: "European lobster (LBE)" }
      },
      landings: [{
        model: {
          id: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
          vessel: {
            pln: "LO574",
            vesselName: "ABBIE LOU",
            flag: "GBR",
            homePort: "LEIGH-ON-SEA",
            licenceNumber: "25893",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "C18644",
            vesselLength: 9.95,
            label: "ABBIE LOU (LO574)",
            domId: "ABBIELOU-LO574"
          },
          dateLanded: "2019-03-31T00:00:00.000Z",
          exportWeight: 88,
          faoArea: "FAO27"
        }
      }]
    }]

    const expected = [{
      id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
      landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
      pln: 'LO574',
      dateLanded: '2019-03-31T00:00:00.000Z',
      species: { code: 'LBE', label: 'European lobster (LBE)' },
      weight: 88,
      validator: 'seasonalFish',
      result: ['dateLanded']
    }]

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('invalid product boundary for start date', async () => {

    const products = [{
      product: {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        commodityCode: "03063210",
        presentation: { code: "WHL", label: "Whole" },
        state: { code: "ALI", label: "Alive" },
        species: { code: "LBE", label: "European lobster (LBE)" }
      },
      landings: [{
        model: {
          id: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
          vessel: {
            pln: "LO574",
            vesselName: "ABBIE LOU",
            flag: "GBR",
            homePort: "LEIGH-ON-SEA",
            licenceNumber: "25893",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "C18644",
            vesselLength: 9.95,
            label: "ABBIE LOU (LO574)",
            domId: "ABBIELOU-LO574"
          },
          startDate: "2019-01-01T00:00:00.000Z",
          dateLanded: "2019-04-01T00:00:00.000Z",
          exportWeight: 88,
          faoArea: "FAO27"
        }
      }]
    }]

    const expected = [{
      id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
      landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
      pln: 'LO574',
      startDate: "2019-01-01T00:00:00.000Z",
      dateLanded: "2019-04-01T00:00:00.000Z",
      species: { code: 'LBE', label: 'European lobster (LBE)' },
      weight: 88,
      validator: 'seasonalFish',
      result: ['startDate']
    }]

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('multiple products', async () => {

    const products = [
      {
         "product":{
            "id":"771937fc-e62c-49f8-a4c6-acab6111fbdb",
            "commodityCode":"03063210",
            "presentation":{
               "code":"WHL",
               "label":"Whole"
            },
            "state":{
               "code":"ALI",
               "label":"Alive"
            },
            "species":{
               "code":"LBE",
               "label":"European lobster (LBE)"
            }
         },
         "landings":[
            {
               "model":{
                  "id":"badf8e6e-530b-40e2-be5e-41a33d0fa59a",
                  "vessel":{
                     "pln":"LO574",
                     "vesselName":"ABBIE LOU",
                     "flag":"GBR",
                     "homePort":"LEIGH-ON-SEA",
                     "licenceNumber":"25893",
                     "imoNumber":null,
                     "licenceValidTo":"2382-12-31T00:00:00",
                     "rssNumber":"C18644",
                     "vesselLength":9.95,
                     "label":"ABBIE LOU (LO574)",
                     "domId":"ABBIELOU-LO574"
                  },
                  "dateLanded":"2019-02-15T00:00:00.000Z",
                  "exportWeight":88,
                  "faoArea":"FAO27"
               }
            }
         ]
      },
      {
         "product":{
            "id":"715a3214-2412-448e-a7df-f25f893856a7",
            "commodityCode":"03025600",
            "presentation":{
               "code":"FIS",
               "label":"Filleted and skinned"
            },
            "state":{
               "code":"FRE",
               "label":"Fresh"
            },
            "species":{
               "code":"WHB",
               "label":"Blue whiting(=Poutassou) (WHB)"
            }
         },
         "landings":[
            {
               "model":{
                  "id":"48181049-7d00-4f69-9f2b-90348205b648",
                  "vessel":{
                     "pln":"LO406",
                     "vesselName":"ANTON SCOTT",
                     "flag":"GBR",
                     "homePort":"LEIGH-ON-SEA",
                     "licenceNumber":"20933",
                     "imoNumber":null,
                     "licenceValidTo":"2382-12-31T00:00:00",
                     "rssNumber":"A18724",
                     "vesselLength":8.7,
                     "label":"ANTON SCOTT (LO406)",
                     "domId":"ANTONSCOTT-LO406"
                  },
                  "dateLanded":"2019-11-17T00:00:00.000Z",
                  "exportWeight":22,
                  "faoArea":"FAO27"
               }
            }
         ]
      }
   ]


    const expected = [
      {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
        pln: "LO574",
        dateLanded: "2019-02-15T00:00:00.000Z",
        species: { code: "LBE", label: "European lobster (LBE)" },
        weight: 88,
        validator: "seasonalFish",
        result: ['dateLanded']
      },
      {
        id: "715a3214-2412-448e-a7df-f25f893856a7",
        landingId: "48181049-7d00-4f69-9f2b-90348205b648",
        dateLanded: "2019-11-17T00:00:00.000Z",
        pln: "LO406",
        result: [],
        species: { code: "WHB", label: "Blue whiting(=Poutassou) (WHB)" },
        validator: "seasonalFish",
        weight: 22,
      },
    ];

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('multiple landings', async () => {

    const products = [
      {
         "product":{
            "id":"771937fc-e62c-49f8-a4c6-acab6111fbdb",
            "commodityCode":"03063210",
            "presentation":{
               "code":"WHL",
               "label":"Whole"
            },
            "state":{
               "code":"ALI",
               "label":"Alive"
            },
            "species":{
               "code":"LBE",
               "label":"European lobster (LBE)"
            }
         },
         "landings":[
            {
               "model":{
                  "id":"badf8e6e-530b-40e2-be5e-41a33d0fa59a",
                  "vessel":{
                     "pln":"LO574",
                     "vesselName":"ABBIE LOU",
                     "flag":"GBR",
                     "homePort":"LEIGH-ON-SEA",
                     "licenceNumber":"25893",
                     "imoNumber":null,
                     "licenceValidTo":"2382-12-31T00:00:00",
                     "rssNumber":"C18644",
                     "vesselLength":9.95,
                     "label":"ABBIE LOU (LO574)",
                     "domId":"ABBIELOU-LO574"
                  },
                  "dateLanded":"2019-02-15T00:00:00.000Z",
                  "exportWeight":22,
                  "faoArea":"FAO27"
               }
            },
            {
              "model":{
                 "id":"badf8e6e-530b-40e2-be5e-41a33d0fa59b",
                 "vessel":{
                    "pln":"LO406",
                    "vesselName":"ANTON SCOTT",
                    "flag":"GBR",
                    "homePort":"LEIGH-ON-SEA",
                    "licenceNumber":"20933",
                    "imoNumber":null,
                    "licenceValidTo":"2382-12-31T00:00:00",
                    "rssNumber":"A18724",
                    "vesselLength":8.7,
                    "label":"ANTON SCOTT (LO406)",
                    "domId":"ANTONSCOTT-LO406"
                 },
                 "startDate":"2019-02-15T00:00:00.000Z",
                 "dateLanded":"2019-02-15T00:00:00.000Z",
                 "exportWeight":88,
                 "faoArea":"FAO27"
              }
           }
         ]
      }
   ]


    const expected = [
      {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
        dateLanded: "2019-02-15T00:00:00.000Z",
        pln: "LO574",
        result: ['dateLanded'],
        species: { code: "LBE", label: "European lobster (LBE)" },
        validator: "seasonalFish",
        weight: 22,
      },
      {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59b",
        pln: "LO406",
        startDate:"2019-02-15T00:00:00.000Z",
        dateLanded: "2019-02-15T00:00:00.000Z",
        species: { code: "LBE", label: "European lobster (LBE)" },
        weight: 88,
        validator: "seasonalFish",
        result: ['startDate','dateLanded']
      }
    ];

    const validations = await ProductValidator.validateProducts(products)

    expect(validations).toEqual(expected)

  })

  it('works with ambiguous dates', async () => {

    mockGetSeasonalFish.mockResolvedValue([
      { fao: 'BSS', validFrom: '2020-02-01T00:00:00', validTo: '2020-03-30T23:59:59' }
    ]);

    const dateToTest = "2020-02-01";

    const products = [{
      product: {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        commodityCode: "03063210",
        presentation: { code: "WHL", label: "Whole" },
        state: { code: "ALI", label: "Alive" },
        species: { code: "BSS", label: "European Seabass (BSS)" }
      },
      landings: [{
        model: {
          id: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
          vessel: {
            pln: "LO574",
            vesselName: "ABBIE LOU",
            flag: "GBR",
            homePort: "LEIGH-ON-SEA",
            licenceNumber: "25893",
            imoNumber: null,
            licenceValidTo: "2382-12-31T00:00:00",
            rssNumber: "C18644",
            vesselLength: 9.95,
            label: "ABBIE LOU (LO574)",
            domId: "ABBIELOU-LO574"
          },
          dateLanded: dateToTest,
          exportWeight: 88,
          faoArea: "FAO27"
        }
      }]
    }];

    const expected = [
      {
        id: "771937fc-e62c-49f8-a4c6-acab6111fbdb",
        landingId: "badf8e6e-530b-40e2-be5e-41a33d0fa59a",
        pln: "LO574",
        dateLanded: dateToTest,
        species: { code: "BSS", label: "European Seabass (BSS)" },
        weight: 88,
        validator: "seasonalFish",
        result: ['dateLanded']
      },
    ];

    const validations = await ProductValidator.validateProducts(products);

    expect(validations).toEqual(expected);

  });

})

describe('productsAreValid', () => {

  let mockValidateProducts;

  const mockInput: any = ['test 1', 'test 2'];

  beforeEach(() => {
    mockValidateProducts = jest.spyOn(ProductValidator, 'validateProducts');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return true if validation passes', async () => {
    const successResult = [{
      result: [],
      validator: 'seasonalFish'
    }];

    mockValidateProducts.mockResolvedValue(successResult);

    const res = await ProductValidator.productsAreValid(mockInput);

    expect(res).toEqual([]);
    expect(mockValidateProducts).toHaveBeenCalledWith(mockInput);
  });

  it('will log and return false if validation fails', async () => {
    const failureResult = [{
      result: ['dateLanded'],
      validator: 'seasonalFish'
    }];

    mockValidateProducts.mockResolvedValue(failureResult);

    const res = await ProductValidator.productsAreValid(mockInput);

    expect(res).toEqual(['dateLanded']);
    expect(mockValidateProducts).toHaveBeenCalledWith(mockInput);
  });

  it('will log and return false if validation fails with start date', async () => {
    const failureResult = [{
      result: ['startDate', 'dateLanded'],
      validator: 'seasonalFish'
    }];

    mockValidateProducts.mockResolvedValue(failureResult);

    const res = await ProductValidator.productsAreValid(mockInput);

    expect(res).toEqual(['startDate', 'dateLanded']);
    expect(mockValidateProducts).toHaveBeenCalledWith(mockInput);
  });

});