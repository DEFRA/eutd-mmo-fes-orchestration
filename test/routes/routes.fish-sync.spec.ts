import { serverTest } from '../testHelpers';
import { getRedisOptions } from '../../src/session_store/redis';
import { SessionStoreFactory } from '../../src/session_store/factory';
import ExportPayloadService from '../../src/services/export-payload.service';
import FishService from '../../src/services/fish.service';
import FishRoutes from '../../src/routes/fish';
const _ = require("lodash");
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'catchCertificate/export-payload';

serverTest('[GET] /v1/fish/added', async (server, t) => {

  const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);
  let mockSpecies = _.cloneDeep(species1);
  await FishService.save(mockSpecies, USER_ID);

    const response = await server.inject({
      method: 'GET',
      url: '/v1/fish/added',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');

    const result = JSON.parse(response.payload);
    // Should be all the same
    t.equals(result.length, 3);

    let exportPayload:any = await ExportPayloadService.get(USER_ID, key);
    let species:any = await FishService.addedFish(USER_ID);

    t.equals(exportPayload.items.length, 3);
    t.equals(exportPayload.items[0].landings.length, 1);
    t.equals(exportPayload.items[1].landings.length, 2);
    t.equals(!!exportPayload.items[2].landings, false);

    t.equals(species.length, 3);
    t.equals(species[0].id, exportPayload.items[0].product.id);
    t.equals(species[1].id, exportPayload.items[1].product.id);
    t.equals(species[2].id, exportPayload.items[2].product.id);
});

serverTest('[GET] /v1/fish/added - 1 species missing', async (server, t) => {

  const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);
  let mockSpecies = _.cloneDeep(species2);
  await FishService.save(mockSpecies, USER_ID);

    const response = await server.inject({
      method: 'GET',
      url: '/v1/fish/added',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');

    const result = JSON.parse(response.payload);
    // Should be all the same
    t.equals(result.length, 3);

    let exportPayload:any = await ExportPayloadService.get(USER_ID, key);
    let species:any = await FishService.addedFish(USER_ID);

    t.equals(exportPayload.items.length, 3);
    t.equals(exportPayload.items[0].landings.length, 1);
    t.equals(exportPayload.items[1].landings.length, 2);
    t.equals(!!exportPayload.items[2].landings, false);

    // Missing species is added - note order changes
    t.equals(species.length, 3);
    t.equals(species[0].id, exportPayload.items[0].product.id);
    t.equals(species[1].id, exportPayload.items[2].product.id);
    t.equals(species[2].id, exportPayload.items[1].product.id);
});

serverTest('[GET] /v1/fish/added - 1 extra species', async (server, t) => {

  const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);
  let mockSpecies = _.cloneDeep(species3);
  await FishService.save(mockSpecies, USER_ID);

    const response = await server.inject({
      method: 'GET',
      url: '/v1/fish/added',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');

    const result = JSON.parse(response.payload);
    // Should be all the same
    t.equals(result.length, 3);

    let exportPayload:any = await ExportPayloadService.get(USER_ID, key);
    let species:any = await FishService.addedFish(USER_ID);

    t.equals(exportPayload.items.length, 3);
    t.equals(exportPayload.items[0].landings.length, 1);
    t.equals(exportPayload.items[1].landings.length, 2);
    t.equals(!!exportPayload.items[2].landings, false);

    // Extra species is removed
    t.equals(species.length, 3);
    t.equals(species[0].id, exportPayload.items[0].product.id);
    t.equals(species[1].id, exportPayload.items[1].product.id);
    t.equals(species[2].id, exportPayload.items[2].product.id);
});

serverTest('[GET] /v1/fish/added - no species', async (server, t) => {

  const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);
  await FishService.save([], USER_ID);

    const response = await server.inject({
      method: 'GET',
      url: '/v1/fish/added',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');

    const result = JSON.parse(response.payload);
    // Should be all the same
    t.equals(result.length, 3);

    let exportPayload:any = await ExportPayloadService.get(USER_ID, key);
    let species:any = await FishService.addedFish(USER_ID);

    t.equals(exportPayload.items.length, 3);
    t.equals(exportPayload.items[0].landings.length, 1);
    t.equals(exportPayload.items[1].landings.length, 2);
    t.equals(!!exportPayload.items[2].landings, false);

    t.equals(species.length, 3);
    t.equals(species[0].id, exportPayload.items[0].product.id);
    t.equals(species[1].id, exportPayload.items[1].product.id);
    t.equals(species[2].id, exportPayload.items[2].product.id);
});


const species1 = [
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "67d4af0c-089b-4b6c-a93e-cca6878682f9",
    "species": "Atlantic cod (COD)",
    "speciesCode": "COD",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "FIL",
    "presentationLabel": "Filleted",
    "commodity_code": "03036310"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "0b731be8-ba61-4648-872d-e6a9b5352935",
    "species": "Haddock (HAD)",
    "speciesCode": "HAD",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "FIL",
    "presentationLabel": "Filleted",
    "commodity_code": "03036400"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "e2ceb640-fda7-49d7-87f4-ffb3be73dc58",
    "species": "European lobster (LBE)",
    "speciesCode": "LBE",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "WHL",
    "presentationLabel": "Whole",
    "commodity_code": "03061210"
  }
]

const species2 = [
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "67d4af0c-089b-4b6c-a93e-cca6878682f9",
    "species": "Atlantic cod (COD)",
    "speciesCode": "COD",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "FIL",
    "presentationLabel": "Filleted",
    "commodity_code": "03036310"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "e2ceb640-fda7-49d7-87f4-ffb3be73dc58",
    "species": "European lobster (LBE)",
    "speciesCode": "LBE",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "WHL",
    "presentationLabel": "Whole",
    "commodity_code": "03061210"
  }
]

const species3 = [
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "67d4af0c-089b-4b6c-a93e-cca6878682f9",
    "species": "Atlantic cod (COD)",
    "speciesCode": "COD",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "FIL",
    "presentationLabel": "Filleted",
    "commodity_code": "03036310"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "0b731be8-ba61-4648-872d-e6a9b5352935",
    "species": "Haddock (HAD)",
    "speciesCode": "HAD",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "FIL",
    "presentationLabel": "Filleted",
    "commodity_code": "03036400"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "e2ceb640-fda7-49d7-87f4-ffb3be73EXTRA",
    "species": "Geordie lobster (HAF)",
    "speciesCode": "HAF",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "WHL",
    "presentationLabel": "Whole",
    "commodity_code": "03061999"
  },
  {
    "user_id": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
    "id": "e2ceb640-fda7-49d7-87f4-ffb3be73dc58",
    "species": "European lobster (LBE)",
    "speciesCode": "LBE",
    "state": "FRO",
    "stateLabel": "Frozen",
    "presentation": "WHL",
    "presentationLabel": "Whole",
    "commodity_code": "03061210"
  }
]

const exportPayload1 = {
  "items": [
    {
      "product": {
        "id": "67d4af0c-089b-4b6c-a93e-cca6878682f9",
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
            "id": "3f1b1ebf-7d16-4bf4-8f85-d4fc92c6df41",
            "vessel": {
              "pln": "P946",
              "vesselName": "ABE",
              "homePort": "PORTSMOUTH",
              "registrationNumber": "",
              "licenceNumber": "24040",
              "imoNumber": "",
              "label": "ABE (P946)",
              "domId": "ABE-P946"
            },
            "dateLanded": "2019-01-29T00:00:00.000Z",
            "exportWeight": 1
          }
        }
      ]
    },
    {
      "product": {
        "id": "0b731be8-ba61-4648-872d-e6a9b5352935",
        "commodityCode": "03036400",
        "presentation": {
          "code": "FIL",
          "label": "Filleted"
        },
        "state": {
          "code": "FRO",
          "label": "Frozen"
        },
        "species": {
          "code": "HAD",
          "label": "Haddock (HAD)"
        }
      },
      "landings": [
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "33f06c85-1148-49a9-ae7f-391418949b01",
            "vessel": {
              "pln": "PH11",
              "vesselName": "ACES HIGH",
              "homePort": "PLYMOUTH",
              "registrationNumber": "",
              "licenceNumber": "27159",
              "imoNumber": "",
              "label": "ACES HIGH (PH11)",
              "domId": "ACESHIGH-PH11"
            },
            "dateLanded": "2019-02-19T00:00:00.000Z",
            "exportWeight": 2
          }
        },
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "f14e5e52-0933-4e2d-a7ee-d7a73ee6d0fe",
            "vessel": {
              "pln": "BM79",
              "vesselName": "ADELA",
              "homePort": "BRIXHAM",
              "registrationNumber": "",
              "licenceNumber": "22675",
              "imoNumber": "",
              "label": "ADELA (BM79)",
              "domId": "ADELA-BM79"
            },
            "dateLanded": "2019-02-21T00:00:00.000Z",
            "exportWeight": 3
          }
        }
      ]
    },
    {
      "product": {
        "id": "e2ceb640-fda7-49d7-87f4-ffb3be73dc58",
        "commodityCode": "03061210",
        "presentation": {
          "code": "WHL",
          "label": "Whole"
        },
        "state": {
          "code": "FRO",
          "label": "Frozen"
        },
        "species": {
          "code": "LBE",
          "label": "European lobster (LBE)"
        }
      }
    }
  ]
};

describe('FishRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new FishRoutes().register;
    expect(typeof register).toBe("function");
  });
});