import ExportPayloadService from '../../src/services/export-payload.service';
import * as test from 'tape';
const _ = require("lodash");
const sinon = require('sinon');
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as sessionManager from '../../src/helpers/sessionManager';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const DOCUMENT_NUMBER = 'DOC-ID-1';
const CONTACT_ID = 'CONTACT-ID';

test('Get export-payload details', async (t) => {
  let getCurrentSessionDataStub;
  let getExportPayloadStub;
  try {
    const payload = _.cloneDeep(exportPayload1);
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves({
      documentNumber: DOCUMENT_NUMBER,
      landings: [{
        landingId: payload.items[0].landings[0].model.id,
        addMode: true,
        editMode: true,
        error: 'session-error',
        errors: { foo: 'bar' },
        modelCopy: { test: 'copy' }
      }]
    });
    getExportPayloadStub = sinon.stub(CatchCertService, 'getExportPayload').resolves(payload);

    const exportPayload: any = await ExportPayloadService.get(USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

    t.ok(exportPayload, 'export payload should be returned');
    t.equals(exportPayload.items.length, 3, 'payload retains all products');
    t.equals(exportPayload.items[0].product.commodityCode, exportPayload1.items[0].product.commodityCode);
    t.equals(exportPayload.items[0].landings[0].addMode, true, 'session addMode is applied to matching landing');
    t.equals(exportPayload.items[0].landings[0].editMode, true, 'session editMode is applied to matching landing');
    t.equals(exportPayload.items[0].landings[0].error, 'session-error', 'session error is applied to matching landing');
    t.deepEquals(exportPayload.items[0].landings[0].errors, { foo: 'bar' }, 'session errors object is applied to matching landing');
    t.equals(getCurrentSessionDataStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'session data is requested with expected arguments');
    t.equals(getExportPayloadStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'export payload is requested with expected arguments');
    t.end();
  } catch(e) {
    t.end(e);
  } finally {
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
    if (getExportPayloadStub) getExportPayloadStub.restore();
  }
});

test('Upsert export-payload details', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-P00000000001";
  let getCurrentSessionDataStub;
  let getExportPayloadStub;
  let withUserSessionDataStoredStub;
  let upsertExportPayloadStub;
  try {
    const mockExportPayload = _.cloneDeep(exportPayload1);
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves(undefined);
    getExportPayloadStub = sinon.stub(CatchCertService, 'getExportPayload').resolves(mockExportPayload);
    upsertExportPayloadStub = sinon.stub(CatchCertService, 'upsertExportPayload').resolves();
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_u, _s, _c, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });

    const exportPayload: any = await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

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
    t.equals(withUserSessionDataStoredStub.calledOnce, true, 'session wrapper is called once for upsert');
    t.equals(upsertExportPayloadStub.calledOnceWithExactly(USER_ID, exportPayload, DOCUMENT_NUMBER, CONTACT_ID), true, 'updated payload is persisted once');
    t.end();
  } catch(e) {
    t.end(e);
  } finally {
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
    if (getExportPayloadStub) getExportPayloadStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (upsertExportPayloadStub) upsertExportPayloadStub.restore();
  }
});

test('Upsert export-payload details - product doesnt exist', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-DOESNT_EXIST";
  let getCurrentSessionDataStub;
  let getExportPayloadStub;
  let withUserSessionDataStoredStub;
  let upsertExportPayloadStub;
  try {
    const mockExportPayload = _.cloneDeep(exportPayload1);
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves(undefined);
    getExportPayloadStub = sinon.stub(CatchCertService, 'getExportPayload').resolves(mockExportPayload);
    upsertExportPayloadStub = sinon.stub(CatchCertService, 'upsertExportPayload').resolves();
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_u, _s, _c, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });

    const exportPayload: any = await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

    const matchedItem = exportPayload.items.find((item) =>
      item.product.id === productId
    );
    t.equals(!matchedItem, true);
    t.equals(withUserSessionDataStoredStub.called, false, 'session wrapper is not called when product does not exist');
    t.equals(upsertExportPayloadStub.called, false, 'payload is not persisted when product does not exist');
    t.end();
  } catch(e) {
    t.end(e);
  } finally {
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
    if (getExportPayloadStub) getExportPayloadStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (upsertExportPayloadStub) upsertExportPayloadStub.restore();
  }
});

test('Upsert export-payload details - replace empty landing in json', async (t) => {
  const productId = "00a6687d-62e4-4e46-a3f2-P00000000001";
  let getCurrentSessionDataStub;
  let getExportPayloadStub;
  let withUserSessionDataStoredStub;
  let upsertExportPayloadStub;
  try {
    const mockExportPayload = _.cloneDeep(exportPayload1);
    const mockMatchedItem = mockExportPayload.items.find((item) =>
      item.product.id === productId
    );
    mockMatchedItem.landings.push({
      "model": { id: undefined}
      });

    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves(undefined);
    getExportPayloadStub = sinon.stub(CatchCertService, 'getExportPayload').resolves(mockExportPayload);
    upsertExportPayloadStub = sinon.stub(CatchCertService, 'upsertExportPayload').resolves();
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_u, _s, _c, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });

    const exportPayload: any = await ExportPayloadService.upsertLanding(productId, mockLanding1, USER_ID, DOCUMENT_NUMBER, CONTACT_ID);

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
    t.equals(upsertExportPayloadStub.calledOnce, true, 'payload is persisted when empty landing is replaced');
    t.end();

  } catch(e) {
    t.end(e);
  } finally {
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
    if (getExportPayloadStub) getExportPayloadStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (upsertExportPayloadStub) upsertExportPayloadStub.restore();
  }
});

test('isSubmissionFailure returns expected boolean values', async (t) => {
  try {
    t.equals(ExportPayloadService.isSubmissionFailure(undefined), undefined, 'undefined result yields undefined');
    t.equals(ExportPayloadService.isSubmissionFailure({ report: [], isBlockingEnabled: true } as any), false, 'empty report is not a submission failure');
    t.equals(ExportPayloadService.isSubmissionFailure({ report: [{}], isBlockingEnabled: false } as any), false, 'blocking disabled is not a submission failure');
    t.equals(ExportPayloadService.isSubmissionFailure({ report: [{}], isBlockingEnabled: true } as any), true, 'non-empty report with blocking enabled is a submission failure');
    t.end();
  } catch(e) {
    t.end(e);
  }
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
