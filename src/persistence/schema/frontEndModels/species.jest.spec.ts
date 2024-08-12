import * as FrontEndModels from '../frontEndModels/species';
import * as BackEndModels from '../catchCert';
import { toFrontEndSpecies } from "../catchCert"
import { IProduct } from '../userAttributes';

describe("Mapping Species from backend to frontend", () => {

    const product: BackEndModels.Product = {
      species: "species",
      speciesId: "species-id",
      speciesCode: "species-code",
      commodityCode: "species-commodityCode",
      state: {
        code: "species-state-code",
        name: "species-state-name",
      },
      presentation: {
        code: "species-presentation-code",
        name: "species-presentation-name"
      },
      caughtBy: [{
        vessel: "caughtBy-vessel",
        pln: "caughtBy-pln",
        id: "caughtBy-id",
        date: "caughtBy-date",
        weight: 99,
        faoArea: "caughtBy-faoArea",
        numberOfSubmissions: 0
      }]
    };

    const expected: FrontEndModels.Product = {
      species: "species",
      id: "species-id",
      speciesCode: "species-code",
      state: "species-state-code",
      stateLabel: "species-state-name",
      presentation: "species-presentation-code",
      presentationLabel: "species-presentation-name",
      commodity_code: "species-commodityCode",
      user_id: null,
      caughtBy: [{
        vessel: "caughtBy-vessel",
        pln: "caughtBy-pln",
        id: "caughtBy-id",
        date: "caughtBy-date",
        weight: 99,
        faoArea: "caughtBy-faoArea",
        numberOfSubmissions: 0
      }]
    };

  it('should included caughtBY if Backend Does included', async () => {

    delete product.caughtBy;
    delete expected.caughtBy;

    const result = toFrontEndSpecies(product);
    expect(result).toStrictEqual(expected);
  });

  it('should not included caughtBY if Backend Does not included', async () => {

    delete product.caughtBy;
    delete expected.caughtBy;

    const result = toFrontEndSpecies(product);
    expect(result).toStrictEqual(expected);
  });

  it('maps partial data', () => {
    const product: BackEndModels.Product = {
      speciesId: 'X'
    };

    const res = toFrontEndSpecies(product);

    expect(res).toStrictEqual({
      id: 'X',
      user_id: null
    })
  })

});

describe("Mapping Species from frontend to backend", () => {

  it('maps when just ids are provided', () => {
    const input: FrontEndModels.Product = {
      id: 'productId',
      user_id: 'userId'
    };

    const res = FrontEndModels.toBackEndProduct(input);

    expect(res).toStrictEqual({speciesId: 'productId'});
  });

  it('maps when just species details are provided', () => {
    const input: FrontEndModels.Product = {
      id: 'productId',
      user_id: 'userId',
      species: 'Atlantic Cod',
      speciesCode: 'COD'
    };

    const res = FrontEndModels.toBackEndProduct(input);

    expect(res).toStrictEqual({
      speciesId: 'productId',
      species: 'Atlantic Cod',
      speciesCode: 'COD'
    });
  });

  it('maps when species state and presentation are provided', () => {
    const input: FrontEndModels.Product = {
      id: 'productId',
      user_id: 'userId',
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHO',
      presentationLabel: 'Whole'
    };

    const res = FrontEndModels.toBackEndProduct(input);

    expect(res).toStrictEqual({
      speciesId: 'productId',
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: {
        code: 'FRE',
        name: 'Fresh'
      },
      presentation: {
        code: 'WHO',
        name: 'Whole'
      }
    });
  });

  it('maps when all data is provided', () => {
    const input: FrontEndModels.Product = {
      id: 'productId',
      user_id: 'userId',
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHO',
      presentationLabel: 'Whole',
      commodity_code: '1111111111'
    };

    const res = FrontEndModels.toBackEndProduct(input);

    expect(res).toStrictEqual({
      speciesId: 'productId',
      species: 'Atlantic Cod',
      speciesCode: 'COD',
      state: {
        code: 'FRE',
        name: 'Fresh'
      },
      presentation: {
        code: 'WHO',
        name: 'Whole'
      },
      commodityCode: '1111111111'
    });
  });

  it('does not return undefined values', () => {
    const input: FrontEndModels.Product = {
      id: 'productId',
      user_id: 'userId'
    };

    const res = FrontEndModels.toBackEndProduct(input);

    expect(res).not.toHaveProperty('species');
    expect(res).not.toHaveProperty('speciesCode');
    expect(res).not.toHaveProperty('commodityCode');
    expect(res).not.toHaveProperty('state');
    expect(res).not.toHaveProperty('presentation');
    expect(res).not.toHaveProperty('caughtBy');
  });

});

describe("Mapping product to an IProduct", () => {
  it('should map a product to an IProduct', () => {
    const product: FrontEndModels.Product = {
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
      user_id: null,
      caughtBy: [{
        vessel: "caughtBy-vessel",
        pln: "caughtBy-pln",
        id: "caughtBy-id",
        date: "caughtBy-date",
        weight: 99,
        faoArea: "caughtBy-faoArea",
        numberOfSubmissions: 0
      }]
    };

    const expected: IProduct = {
      species: "species",
      speciesCode: "species-code",
      scientificName: "scientific-name",
      state: "species-state-code",
      stateLabel: "species-state-name",
      presentation: "species-presentation-code",
      presentationLabel: "species-presentation-name",
      commodity_code: "species-commodityCode",
      commodity_code_description: "species-commodity-code-description"
    }

    expect(FrontEndModels.toIProduct(product)).toEqual(expected);
  });

  it('should map undefined to null', () => {
    expect(FrontEndModels.toIProduct(undefined)).toBeNull();
  });
});

describe("Mapping payload to a Product", () => {
  it('should map a product to a Product', () => {
    const payload: any = {
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
    };

    const userPrinciple = "bob";

    const expected: FrontEndModels.Product = {
      id: "species-id",
      species: "species",
      speciesCode: "species-code",
      scientificName: "scientific-name",
      state: "species-state-code",
      stateLabel: "species-state-name",
      presentation: "species-presentation-code",
      presentationLabel: "species-presentation-name",
      commodity_code: "species-commodityCode",
      commodity_code_description: "species-commodity-code-description",
      user_id: "bob"
    }

    expect(FrontEndModels.toProduct(payload, userPrinciple)).toEqual(expected);
  });

});