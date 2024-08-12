import { getRedisOptions } from '../../src/session_store/redis';
import { SessionStoreFactory } from '../../src/session_store/factory';
import ExportPayloadService from '../../src/services/export-payload.service';
import * as test from 'tape';
import logger from '../../src/logger';
const _ = require("lodash");
const sinon = require('sinon');

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'catchCertificate/export-payload';

  test('Get export-payload details', async (t) => {
    try {
      const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());

      // first create an export-payload
      await ExportPayloadService.save(exportPayload1, USER_ID, key);
      // then try and retrieve it
      let exportPayload = await ExportPayloadService.get(USER_ID, key);

      t.equals(exportPayload.items[0].product.commodityCode, exportPayload1.items[0].product.commodityCode);
      t.equals(!!exportPayload, true);

    } catch(e) {
      logger.error(e);
    }
    t.end();
  });

test('Upsert export-payload details', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-P00000000001";
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    let mockExportPayload = _.cloneDeep(exportPayload1);
    await ExportPayloadService.save({}, USER_ID, key);
    await ExportPayloadService.save(mockExportPayload, USER_ID, key);
    await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, key)
    // then try and retrieve it
    let exportPayload = await ExportPayloadService.get(USER_ID, key);

    const matchedItem = exportPayload.items.find((item) =>
      item.product.id === productId
    );
    t.equals(!!matchedItem, true);
    t.equals(matchedItem.landings.length, 2);

    let matchedLanding = matchedItem.landings.find((lnd) =>
      lnd.model.id === mockLanding1.model.id
    );
    t.equals(!!matchedLanding, true);
    t.equals(matchedLanding.model.vessel.vesselName, mockLanding1.model.vessel.vesselName);

  } catch(e) {
    logger.error(e);
  }
  t.end();
});

test('Upsert export-payload details - product doesnt exist', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-DOESNT_EXIST";
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    let mockExportPayload = _.cloneDeep(exportPayload1);
    await ExportPayloadService.save({}, USER_ID, key);
    await ExportPayloadService.save(mockExportPayload, USER_ID, key);
    await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, key)
    // then try and retrieve it
    let exportPayload = await ExportPayloadService.get(USER_ID, key);

    const matchedItem = exportPayload.items.find((item) =>
      item.product.id === productId
    );
    t.equals(!matchedItem, true);

  } catch(e) {
    logger.error(e);
  }
  t.end();
});

test('Upsert export-payload details - replace empty landing in json', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-P00000000001";
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await ExportPayloadService.save({}, USER_ID, key);
    let mockExportPayload = _.cloneDeep(exportPayload1);
    const mockMatchedItem = mockExportPayload.items.find((item) =>
      item.product.id === productId
    );
    mockMatchedItem.landings.push({
      "model": { id: undefined}
      });

    await ExportPayloadService.save(mockExportPayload, USER_ID, key);
    await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, key)
    // then try and retrieve it
    let exportPayload = await ExportPayloadService.get(USER_ID, key);

    const matchedProduct = exportPayload.items.find((item) =>
      item.product.id === productId
    );
    t.equals(!!matchedProduct, true);
    t.equals(matchedProduct.landings.length, 2);

    let matchedLanding = matchedProduct.landings.find((lnd) =>
      lnd.model.id === mockLanding1.model.id
    );
    t.equals(!!matchedLanding, true);
    t.equals(matchedLanding.model.vessel.vesselName, mockLanding1.model.vessel.vesselName);

  } catch(e) {
    logger.error(e);
  }
  t.end();
});


test('Create export certificate - session store is cleared', async (t) => {
  try {

    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await ExportPayloadService.createExportCertificate(USER_ID, 'catchCertificate', USER_ID, 'email');

    let storageInfo = await ExportPayloadService.get(USER_ID, key);

    t.equals(!!storageInfo, true);
  } catch(e) {
    logger.error(e);
  }
  t.end();
});

const mockCatchCertificate1 = {
  transport: {
    "documentNumber": "DOC-ID-1"
  }
}

const mockConservation1 = {
  "documentNumber": "DOC-ID-1",
  "conservationReference": "conservationReference"
}

const mockDocument1 = {
    "documentNumber": "DOC-ID-1"
}

const mockLanding1 = {
  model: {
    "id": "00a6687d-62e4-4e46-a3f2-L00000000001",
    "vessel": {
      "pln": "B192",
      "vesselName": "WHEY AYE",
      "homePort": "ARDGLASS",
      "registrationNumber": "A12186",
      "licenceNumber": "10106",
      "imoNumber": "9999990",
      "label": "GOLDEN BELLS 11 (B192)"
    },
    "dateLanded": "2019-02-02T00:00:00.000Z",
    "exportWeight": 99
  }
}


const exportPayload1 = {
  items: [
    {
      "product": {
        "id": "00a6687d-62e4-4e46-a3f2-P00000000001",
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
          "model": {
            "id": "00a6687d-62e4-4e46-a3f2-938d0bc94abe",
            "vessel": {
              "pln": "B192",
              "vesselName": "GOLDEN BELLS 11",
              "homePort": "ARDGLASS",
              "registrationNumber": "A12186",
              "licenceNumber": "10106",
              "imoNumber": "9999990",
              "label": "GOLDEN BELLS 11 (B192)"
            },
            "dateLanded": "2019-01-28T00:00:00.000Z",
            "exportWeight": 22
          }
        }
      ]
    },
    {
      "product": {
        "id": "00a6687d-62e4-4e46-a3f2-P00000000002",
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
          "model": {
            "id": "ba7ec5bd-e45e-4c72-b0ac-04bd3e9eeb3c",
            "vessel": {
              "pln": "BA156",
              "vesselName": "QUEENSBERRY",
              "homePort": "ANNAN",
              "registrationNumber": "A10337",
              "licenceNumber": "44051",
              "imoNumber": "9999991",
              "label": "QUEENSBERRY (BA156)"
            },
            "dateLanded": "2019-02-05T00:00:00.000Z",
            "exportWeight": 22
          }
        }
      ]
    },
    {
      "product": {
        "id": "00a6687d-62e4-4e46-a3f2-P00000000003",
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
          "code": "ANOTHER",
          "label": "FISH (ANOTHER)"
        }
      },
      "landings": [
        {
          "model": {
            "id": "00a6687d-62e4-4e46-a3f2-938d0bc94abe",
            "vessel": {
              "pln": "B192",
              "vesselName": "GOLDEN BELLS 11",
              "homePort": "ARDGLASS",
              "registrationNumber": "A12186",
              "licenceNumber": "10106",
              "imoNumber": "9999990",
              "label": "GOLDEN BELLS 11 (B192)"
            },
            "dateLanded": "2019-01-28T00:00:00.000Z",
            "exportWeight": 22
          }
        }
      ]
    }
  ]
};
