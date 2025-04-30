import { serverTest } from '../testHelpers';
import ExportPayloadService from '../../src/services/export-payload.service';
import ExportPayloadNonjsRoutes from '../../src/routes/export-payload-nonjs';
const _ = require("lodash");
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'catchCertificate/export-payload';

serverTest('[POST] add another landing', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/nonjs/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000001/landing/add-another',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: { }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
  let exportPayload = await ExportPayloadService.get(USER_ID, key);

  t.equals(exportPayload.items[0].landings.length, 2);
  t.equals(!!exportPayload.items[0].landings[1].addMode, true);
  t.equals(!!exportPayload.items[0].landings[1].model.id, true);
});

serverTest('[POST] a landing', async (server, t) => {
  // this will fail because of the reference service not being vailable - best we can do is test some validation
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/nonjs/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000001/landing/add',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      // "vessel.label": "GOLDEN BELLS 11 (B192)",
      "dateLanded": "2019-02-02T00:00:00.000Z",
      "exportWeight": 99
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
  let exportPayload = await ExportPayloadService.get(USER_ID, key);

  t.equals(exportPayload.items[0].landings.length, 2);
  t.equals(!!exportPayload.items[0].landings[1].addMode, false);
  t.equals(!!exportPayload.items[0].landings[1].editMode, true);
  t.equals(exportPayload.items[0].landings[1].error, "invalid");
  t.equals(!!exportPayload.items[0].landings[1].errors["vessel.label"], true);
});

serverTest('[POST] a nonjs landing edit - landing doesnt exist so new one added in add mode', async (server, t) => {
  // this will fail because of the reference service not being vailable - best we can do is test some validation
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/nonjs/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000001/landing/edit',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      "id": "00a6687d-62e4-4e46-a3f2-IDONTEXIST",
      // "vessel.label": "GOLDEN BELLS 11 (B192)",
      "dateLanded": "2019-02-02T00:00:00.000Z",
      "exportWeight": 99
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
  let exportPayload = await ExportPayloadService.get(USER_ID, key);

  t.equals(exportPayload.items[0].landings.length, 2);
  t.equals(!!exportPayload.items[0].landings[1].addMode, true);
  t.equals(!!exportPayload.items[0].landings[1].editMode, false);
  t.equals(!!exportPayload.items[0].landings[1].error, false);
});

serverTest('[POST] a nonjs landing edit', async (server, t) => {
  // this will fail because of the reference service not being vailable - best we can do is test some validation
  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/nonjs/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000001/landing/edit',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      "id": "00a6687d-62e4-4e46-a3f2-938d0bc94abe",
      // "vessel.label": "GOLDEN BELLS 11 (B192)",
      "dateLanded": "2019-02-02T00:00:00.000Z",
      "exportWeight": 99,
      "editMode": true
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
  let exportPayload = await ExportPayloadService.get(USER_ID, key);

  t.equals(exportPayload.items[0].landings.length, 1);
  t.equals(!!exportPayload.items[0].landings[0].addMode, false);
  t.equals(!!exportPayload.items[0].landings[0].editMode, true);
  t.equals(!!exportPayload.items[0].landings[0].error, false);
});

const landing1 = {
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

const landing2 = {
  "id": "00a6687d-62e4-4e46-a3f2-L00000000002",
  "vessel": {
    "pln": "B192",
    "vesselName": "WHEY AYE1",
    "homePort": "ARDGLASS",
    "registrationNumber": "A12186",
    "licenceNumber": "10106",
    "imoNumber": "9999990",
    "label": "GOLDEN BELLS 11 (B192)"
  },
  "dateLanded": "2019-02-02T00:00:00.000Z",
  "exportWeight": 99
}

const product1 = {
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
            "id": "00a6687d-62e4-4e46-a3f2-L00000000002",
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

describe('ExportPayloadNonjsRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new ExportPayloadNonjsRoutes().register;
    expect(typeof register).toBe("function");
  });
});