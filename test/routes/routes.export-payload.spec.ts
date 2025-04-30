import { serverTest } from '../testHelpers';
import ExportPayloadService from '../../src/services/export-payload.service';
import ApplicationConfig from "../../src/applicationConfig";
import nock = require("nock");
const _ = require("lodash");
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const key = 'catchCertificate/export-payload';
const sinon = require('sinon');
import VesselValidator from '../../src/services/vesselValidator.service';
import ExportPayloadRoutes from '../../src/routes/export-payload';

serverTest('[GET] /v1/export-certificates/export-payload should return 200', async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/export-certificates/export-payload',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[DELETE] a product', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'DELETE',
    url: '/v1/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000002',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.items.length, 2);
});

serverTest('[POST] a product', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  // await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const data = {
    faoCode: "COD",
    faoName: "Atlantic cod"
  };

  nock(ApplicationConfig.getReferenceServiceUrl())
    .get('/v1/species/search-exact?faoCode=COD&faoName=Atlantic%20cod')
    .reply(200, data);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/export-certificates/export-payload/product',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...product1
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.items.length, 1);
});

serverTest('[POST] a landing', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000001/landing',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      ...landing1
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.items[0].landings.length, 2);
});

serverTest('[DELETE] a landing', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'DELETE',
    url: '/v1/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000002/landing/ba7ec5bd-e45e-4c72-b0ac-04bd3e9eeb3c',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.items[1].landings.length, 0);
});

serverTest('[PUT] a landing into edit mode', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);

  const response = await server.inject({
    method: 'PUT',
    url: '/v1/export-certificates/export-payload/product/00a6687d-62e4-4e46-a3f2-P00000000003/landing/00a6687d-62e4-4e46-a3f2-L00000000002',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
  const result = JSON.parse(response.payload);
  t.equals(result.items[2].landings.length, 1);
  t.equals(result.items[2].landings[0].editMode, true);
  t.equals(!!result.items[2].landings[0].modelCopy, true);
  t.equals(result.items[2].landings[0].modelCopy.vessel.vesselName, exportPayload1.items[2].landings[0].model.vessel.vesselName);
});


serverTest('[POST] validate an export payload', async (server, t) => {

  let mockExportPayload = _.cloneDeep(exportPayload1);
  await ExportPayloadService.save({}, USER_ID, key);
  await ExportPayloadService.save(mockExportPayload, USER_ID, key);
  const vesselValidatorStub = sinon.stub(VesselValidator, 'checkVesselWithDate').resolves(true);

  const response = await server.inject({
    method: 'POST',
    url: '/v1/export-certificates/export-payload/validate',
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });

  t.assert(vesselValidatorStub.called);
  t.equals(response.statusCode, 200, 'Status code is 200');
  vesselValidatorStub.restore();
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
  "dateLanded": "2019-02-02",
  "exportWeight": 99,
  "faoArea": "FAO1"
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
  "dateLanded": "2019-02-02",
  "exportWeight": 99,
  "faoArea": "FAO2"
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
            "exportWeight": 22,
            "faoArea": "FAO1"
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
            "exportWeight": 22,
            "faoArea": "FAO2"
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

describe('ExportPayloadRoutes routes check', () => {
  it("check register is exist", () => {
    const register = new ExportPayloadRoutes().register;
    expect(typeof register).toBe("function");
  });
});