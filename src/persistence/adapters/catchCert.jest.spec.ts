import { buildProducts, ProductWithLandings } from './catchCert'

describe('buildProducts', () => {

  it('should map products correctly', () => {
    const products: ProductWithLandings[] = [{
      product: {
        id: 'id',
        commodityCode: 'commodityCode',
        presentation: {
          code: 'presentation-code',
          label: 'presentation-label'
        },
        state: {
          code: 'state-code',
          label: 'state-label'
        },
        species: {
          code: 'species-code',
          label: 'species-label'
        }
      },
      landings: []
    }];

    const res = buildProducts(products);

    expect(res).toStrictEqual([{
      species: 'species-label',
      speciesId: 'id',
      speciesCode: 'species-code',
      commodityCode: 'commodityCode',
      state: {
        code: 'state-code',
        name: 'state-label'
      },
      presentation: {
        code: 'presentation-code',
        name: 'presentation-label'
      },
      caughtBy: []
    }]);
  });

  it('should built a list of products from a list of species with landings', () => {
    const data = [
      {
        "product": {
          "commodityCode": "03036310",
          "presentation": {
            "code": "FIL",
            "label": "Filleted"
          },
          "state": {
            "code": "FRO",
            "label": "Frozen"
          },
          "species": {
            "code": "COD",
            "label": "Atlantic cod (COD)"
          }
        },
        "landings": [
          {
            "addMode": false,
            "editMode": false,
            "model": {
              "id": "99bc2947-c6f4-4012-9653-22dc0b9ad036",
              "vessel": {
                "pln": "B192",
                "vesselName": "GOLDEN BELLS 11",
                "homePort": "ARDGLASS",
                "registrationNumber": "A12186",
                "licenceNumber": "10106",
                "imoNumber": "9999990",
                "label": "GOLDEN BELLS 11 (B192)"
              },
              "dateLanded": "2019-01-29T00:00:00.000Z",
              "exportWeight": "22"
            }
          },
          {
            "addMode": false,
            "editMode": false,
            "model": {
              "id": "f487a7d8-76f9-4ff6-b40e-e511b19dfb91",
              "vessel": {
                "pln": "BCK126",
                "vesselName": "ZARA ANNABEL",
                "homePort": "UNKNOWN",
                "licenceNumber": "42095",
                "imoNumber": "9999991",
                "label": "ZARA ANNABEL (BCK126)"
              },
              "dateLanded": "2019-01-30T00:00:00.000Z",
              "exportWeight": "23"
            }
          }
        ]
      }
    ] as ProductWithLandings[];

    const products = buildProducts(data);
    expect(products.length).toBe(1);
    expect(products[0].caughtBy.length).toBe(2);
  });

});
