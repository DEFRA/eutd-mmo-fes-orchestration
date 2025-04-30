import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import * as ReferenceServices from "../../src/services/reference-data.service";
import ExportPayloadService from '../../src/services/export-payload.service';
import SaveAsDraftService from '../../src/services/saveAsDraft.service';
import Controller from '../../src/controllers/export-payload.controller';
import VesselValidator from '../../src/services/vesselValidator.service';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const getMockLanding = (error = null, editMode = false, addMode = false, modelCopy = undefined, vessel = 'vessel',  dateLanded = '01-05-2019') => {
  return {
    error: error,
    model: {
      id: 1,
      vessel: vessel,
      dateLanded: dateLanded,
      exportWeight: 200,
      faoArea: 'area_01'
    },
    editMode,
    addMode,
    modelCopy
  }
};

const getMockItem = (landings) => {
  return {
    product: {
      id: 0,
      state: {
        label: 'FRO'
      },
      presentation: {
        label: 'FIL'
      },
      species: {
        label: 'COD'
      }
    },
    landings
  }
}

const getRequest = (items = [], nonjs = false, overrideParams = {}, commodityCode = '') => {
  const mockReq = mock(hapi.Request);
  mockReq.params = { landingId: 1, productId: 0, ...overrideParams } as any;
  mockReq.headers = nonjs ? { accept: 'text/html' } : {};
  mockReq.app = {
    claims: {
      sub: USER_ID
    }
  };
  mockReq.url = {
    path : 'foobar_path',
  },
  mockReq.payload = {
    id: 1, // id of landing (non js)
    remove: 1, // id of landing to remove (non js)
    currentUri: 'currentUri',
    nextUri: 'nextUri',
    dashboardUri: 'dashboardUri',
    commodityCode
  };
  const exportPayloadServiceGetStub = sinon.stub(ExportPayloadService, 'get').resolves({ items });
  const exportPayloadServiceSaveStub = sinon.stub(ExportPayloadService, 'save').callsFake(async (payload: any, userId: string, other: string) => {
    return Promise.resolve(payload);
  });
  const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
  return { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub };
};

const commonTaskHelper = async (t, request, saveAsDraft = false) => {
  const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = request;
  try {
    await Controller.validate(mockReq, mockRes, saveAsDraft);
    t.assert(exportPayloadServiceGetStub.called);
    t.assert(exportPayloadServiceSaveStub.called);
  } catch (e){
    console.log(e);
  }
  exportPayloadServiceGetStub.restore();
  exportPayloadServiceSaveStub.restore();
};

const triggerErrorHelper = async (t, request, errorKey, errorValue, mockItem) => {
  const { mockReq, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = request;
  const responseCodeMock = sinon.fake();
  const mockRes = sinon.fake.returns({ code: responseCodeMock });
  await Controller.validate(mockReq, mockRes);
  t.assert(exportPayloadServiceGetStub.called);
  t.assert(exportPayloadServiceSaveStub.called);
  t.assert(mockRes.called);
  t.assert(responseCodeMock.called);
  t.equals(responseCodeMock.getCall(0).args[0], 400);
  t.deepEquals(mockRes.getCall(0).args[0], { items: [mockItem], errors: { [errorKey] : errorValue } });
  exportPayloadServiceGetStub.restore();
  exportPayloadServiceSaveStub.restore();
};

const shouldReturnExportPayloadOnly = (controllerFunc, nonjs = false) =>
  test('ExportPayloadController.editExportPayloadProductLanding - Should return export payload only', async (t) => {
    try {
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([], nonjs);
      await controllerFunc(mockReq, mockRes);
      t.assert(!exportPayloadServiceSaveStub.called);
      if (nonjs) {
        t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.payload.currentUri]);
      } else {
        t.deepEquals(mockRes.getCall(0).args, [{ items: [] }]);
      }

      exportPayloadServiceGetStub.restore();
      exportPayloadServiceSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const addNewLandingItemAndSave = (controllerFunc, nonjs = false) =>
  test('ExportPayloadController.editExportPayloadProductLanding - add a new landing item and save', async (t) => {
    try {
      const item = getMockItem([]);
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([item], nonjs);
      await controllerFunc(mockReq, mockRes);
      t.assert(exportPayloadServiceSaveStub.called);
      t.assert(item.landings.length === 1);
      t.deepEquals(item.landings[0], {
        addMode: true,
        editMode: false,
        model: {
          id: mockReq.params.landingId || mockReq.payload.id
        }
      });
      exportPayloadServiceGetStub.restore();
      exportPayloadServiceSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const entersEditMode = (controllerFunc, nonjs = false) =>
  test('ExportPayloadController.editExportPayloadProductLanding - enters edit mode', async (t) => {
    try {
      const landing = getMockLanding();
      const item = getMockItem([landing]);
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([item], nonjs);
      t.assert(!landing.editMode, 'Edit mode is disabled');
      t.assert(!landing.modelCopy, 'modelCopy is undefined');
      await controllerFunc(mockReq, mockRes);
      t.assert(exportPayloadServiceSaveStub.called);
      t.assert(landing.editMode, 'Edit mode is enabled');
      t.assert(landing.modelCopy, 'modelCopy is not undefined');
      exportPayloadServiceGetStub.restore();
      exportPayloadServiceSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const cancelsEditMode = (controllerFunc, nonjs = false) =>
  test('ExportPayloadController.editExportPayloadProductLanding - cancels edit mode', async (t) => {
    try {
      const landing = getMockLanding(undefined, true, false, {});
      const item = getMockItem([landing]);
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([item], nonjs);
      t.assert(landing.editMode, 'Edit mode is enabled');
      t.assert(landing.modelCopy, 'modelCopy is not undefined');
      await controllerFunc(mockReq, mockRes);
      t.assert(exportPayloadServiceSaveStub.called);
      t.assert(!landing.editMode, 'Edit mode is disabled');
      t.assert(!landing.modelCopy, 'modelCopy is undefined');
      exportPayloadServiceGetStub.restore();
      exportPayloadServiceSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const resetsPayloadLandings = (controllerFunc, nonjs = false) =>
  test('ExportPayloadController.editExportPayloadProductLanding - resets payload landings', async (t) => {
    try {
      const landing = getMockLanding(undefined, false, true);
      const item = getMockItem([landing]);
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([item], nonjs);
      t.assert(item.landings.length === 1, 'Item as 1 landing');
      await controllerFunc(mockReq, mockRes);
      t.assert(item.landings.length === 0, 'Item as no landings');
      exportPayloadServiceGetStub.restore();
      exportPayloadServiceSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const upsertsAnewLanding = (controllerFunc, nonjs = false, addMode = false, before = null, vessel = null) =>
  test('ExportPayloadController.upsertExportPayloadProductLanding - adds a new landing', async (t) => {
    try {
      const landing = getMockLanding(null, false, false, undefined);
      let customStub;
      if (before) {
        customStub = before();
      }
      const upsertStub = sinon.stub(ExportPayloadService, 'upsertLanding').resolves('landing_added')
      const mockReq = mock(hapi.Request);
      mockReq.headers = nonjs ? { accept: 'text/html' } : {};
      mockReq.app = { claims: { sub: USER_ID } };
      mockReq.payload = {
        currentUri: 'currentUri'
      };

      if (vessel) {
        mockReq.payload[`vessel.label`] = '(vessel)' as any;
      }

      mockReq.params = {
        productId: 0
      } as any;

      const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
      await controllerFunc(mockReq, mockRes);
      if (nonjs) {
        t.assert(mockRes.redirect.called);
        t.deepEquals(mockRes.redirect.getCall(0).args, ['currentUri']);
      } else {
        t.assert(mockRes.called);
        t.deepEquals(mockRes.getCall(0).args, ['landing_added']);
      }
      t.assert(upsertStub.called);

      if (customStub) {
        customStub.restore();
      }
      upsertStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const savesTheNewProduct = (nonjs = false) =>
  test('ExportPayloadController.addExportPayloadProduct - saves the new product', async (t) => {
    try {
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } =
        getRequest(null, nonjs, {}, 'RT05');
      await Controller.addExportPayloadProduct(mockReq, mockRes);
      t.assert(exportPayloadServiceGetStub.called);
      t.assert(exportPayloadServiceSaveStub.called);
      exportPayloadServiceSaveStub.restore();
      exportPayloadServiceGetStub.restore();
      if (nonjs) {
        t.assert(mockRes.redirect.called);
        t.equals(mockRes.redirect.getCall(0).args[0], mockReq.payload.nextUri);
      } else {
        t.assert(mockRes.called);
        t.deepEquals(mockRes.getCall(0).args, [{
          items: [{ product: { ...mockReq.payload } }],
          errors: undefined
        }]);
      }
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const doesNotSaveTheProduct = (commodityCode = 'RT05') =>
  test('ExportPayloadController.addExportPayloadProduct - does not save', async (t) => {
    try {
      const item = getMockItem([]);
      const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } =
        getRequest([{ ...item, product: { ...item.product, id: 1 } }], false, {}, commodityCode);
      await Controller.addExportPayloadProduct(mockReq, mockRes);
      t.assert(exportPayloadServiceGetStub.called);
      t.assert(!exportPayloadServiceSaveStub.called);
      exportPayloadServiceSaveStub.restore();
      exportPayloadServiceGetStub.restore();
      t.assert(mockRes.called);
      t.end();
    } catch (e) {
      t.end(e);
    }
  });
test('ExportPayloadController.validate - Should add the currentUri to route history', async (t) => {
  try {
    const request: any = getRequest();
    const commonTasks = await commonTaskHelper(t, request);
    const { mockReq, mockRes } = request;
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0], { items: [], errors: undefined });
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should add the currentUri to route history (non js)', async (t) => {
  try {
    const request: any = getRequest([], true);
    const commonTasks = await commonTaskHelper(t, request);
    const { mockReq, mockRes } = request;
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args[0], mockReq.payload.nextUri);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should add the currentUri to route history (non js) and save as draft',
 async (t) => {
  try {
    const request: any = getRequest([], true);
    const { mockReq, mockRes } = request;
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args[0], mockReq.payload.dashboardUri);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should return have an error when there are no landings ', async (t) => {
  try {
    const item = getMockItem([]);
    await triggerErrorHelper(
      t,
      getRequest([item]),
      'vessel_' + item.product.id + '_new',
      'Add the landing for ' + item.product.species.label + ', '
        + item.product.state.label + ', ' + item.product.presentation.label,
      item
    );
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should not produce an error', async (t) => {
  try {
    const landing = getMockLanding();
    const item = getMockItem([landing]);
    const request: any = getRequest([item]);
    const commonTasks = await commonTaskHelper(t, request);
    const { mockReq, mockRes } = request;
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0].items[0].landings, [landing]);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should produce an error when a landing is invalid', async (t) => {
  try {
    const vesselValidatorStub = sinon.stub(VesselValidator, 'checkVesselWithDate').resolves(true);
    const landing = getMockLanding('invalid', null, null, null, null, null);
    const item = getMockItem([landing]);
    await triggerErrorHelper(
      t,
      getRequest([item]),
      'vessel_' + item.product.id + '_' + landing.model.id,
      item.product.species.label + ', '+ item.product.state.label + ', ' + item.product.presentation.label +
        ' has an invalid landing',
      item
    );
    vesselValidatorStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should refresh the currentUri if an error is found (non js)', async (t) => {
  try {

    const mockItem = getMockItem([]);
    const { mockRes, mockReq, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([
      getMockItem([])
    ], true);
    await Controller.validate(mockReq, mockRes);
    t.assert(exportPayloadServiceGetStub.called);
    t.assert(exportPayloadServiceSaveStub.called);
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args[0], mockReq.payload.currentUri);
    exportPayloadServiceGetStub.restore();
    exportPayloadServiceSaveStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.validate - Should refresh the current uri ', async (t) => {
  try {

    const mockItem = getMockItem([]);
    const { mockReq, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([
      getMockItem([])
    ]);
    const errorKey = 'vessel_' + mockItem.product.id + '_new';
    const errorValue = 'Add the landing for ' + mockItem.product.species.label + ', '
      + mockItem.product.state.label + ', ' + mockItem.product.presentation.label;
    const responseCodeMock = sinon.fake();
    const mockRes = sinon.fake.returns({ code: responseCodeMock });
    await Controller.validate(mockReq, mockRes);
    t.assert(exportPayloadServiceGetStub.called);
    t.assert(exportPayloadServiceSaveStub.called);
    t.assert(mockRes.called);
    t.assert(responseCodeMock.called);
    t.equals(responseCodeMock.getCall(0).args[0], 400);
    t.deepEquals(mockRes.getCall(0).args[0], { items: [mockItem], errors: { [errorKey] : errorValue } });
    exportPayloadServiceGetStub.restore();
    exportPayloadServiceSaveStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.createExportCertificate - Should createExportCertificate and return details', async (t) => {
  try {
    const mockCreateResponse = {
      documentNumber: '005',
      uri: '/foobar'
    };

    const exportPayloadServiceCreateStub =
     sinon.stub(ExportPayloadService, 'createExportCertificate').resolves(mockCreateResponse);

    const mockReq = mock(hapi.Request);
    mockReq.app = { claims: { sub: USER_ID, email: 'foo@email' } };
    mockReq.payload = { journey: 'catchCertificate' };
    mockReq.headers = {};
    const mockRes = sinon.fake();

    await Controller.createExportCertificate(mockReq, mockRes);
    t.assert(exportPayloadServiceCreateStub.called);
    t.deepEquals(exportPayloadServiceCreateStub.getCall(0).args, [USER_ID, 'catchCertificate', USER_ID, 'foo@email']);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args, [mockCreateResponse]);
    exportPayloadServiceCreateStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.createExportCertificate - Should createExportCertificate and return details (non js)',
async (t) => {
  try {
    const mockCreateResponse = {
      documentNumber: '005',
      uri: '/foobar'
    };

    const exportPayloadServiceCreateStub =
     sinon.stub(ExportPayloadService, 'createExportCertificate').resolves(mockCreateResponse);

    const mockReq = mock(hapi.Request);
    mockReq.app = { claims: { sub: USER_ID, email: 'foo@email' } };
    mockReq.payload = { journey: 'catchCertificate', completeUri: 'completeUri' };
    mockReq.headers = { accept: 'text/html' };
    const mockRes = { redirect: sinon.fake() };

    await Controller.createExportCertificate(mockReq, mockRes as any);
    t.assert(exportPayloadServiceCreateStub.called);
    t.deepEquals(exportPayloadServiceCreateStub.getCall(0).args, [USER_ID, 'catchCertificate', USER_ID, 'foo@email']);
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args,
      [`${mockReq.payload.completeUri}?documentNumber=${mockCreateResponse.documentNumber}&uri=${mockCreateResponse.uri}`]
    );
    exportPayloadServiceCreateStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.createExportCertificate - catches but does not throw', async (t) => {
  try {
    const exportPayloadServiceCreateStub =
     sinon.stub(ExportPayloadService, 'createExportCertificate').rejects(new Error('a'));
    const mockReq = mock(hapi.Request);
    mockReq.app = { claims: { sub: USER_ID, email: 'foo@email' } };
    mockReq.payload = { journey: 'catchCertificate', completeUri: 'completeUri' };
    mockReq.headers = {};
    const mockRes = sinon.fake();

    await Controller.createExportCertificate(mockReq, mockRes);
    t.assert(!mockRes.called, 'No response is made');
    exportPayloadServiceCreateStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.getExportPayload - Gets the export payload for a user', async (t) => {
  try {
    const mockRes = sinon.fake();
    const mockReq = mock(hapi.Request);
    mockReq.app = { claims: { sub: USER_ID, email: 'foo@email' } };
    const exportPayloadServiceGetStub =
     sinon.stub(ExportPayloadService, 'get').resolves('foo');
    await Controller.getExportPayload(mockReq, mockRes);
    t.assert(exportPayloadServiceGetStub.called);
    t.deepEquals(exportPayloadServiceGetStub.getCall(0).args, [USER_ID]);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args, ['foo']);
    exportPayloadServiceGetStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.editExportPayloadProductLanding - Should return export payload only (non js)',
async (t) => {
  try {
    const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([], true);
    await Controller.editExportPayloadProductLanding(mockReq, mockRes);
    t.assert(!exportPayloadServiceSaveStub.called);
    t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.url.path]);
    exportPayloadServiceGetStub.restore();
    exportPayloadServiceSaveStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

shouldReturnExportPayloadOnly(Controller.editExportPayloadProductLanding);
shouldReturnExportPayloadOnly(Controller.editExportPayloadProductLandingNonjs, true);
addNewLandingItemAndSave(Controller.editExportPayloadProductLanding);
addNewLandingItemAndSave(Controller.editExportPayloadProductLandingNonjs, true);
entersEditMode(Controller.editExportPayloadProductLanding);
entersEditMode(Controller.editExportPayloadProductLandingNonjs, true);
cancelsEditMode(Controller.editExportPayloadProductLanding);
cancelsEditMode(Controller.editExportPayloadProductLandingNonjs, true);
resetsPayloadLandings(Controller.editExportPayloadProductLanding);
resetsPayloadLandings(Controller.editExportPayloadProductLandingNonjs, true);

test('ExportPayloadController.removeExportPayloadProductLanding - Should handle not having any landings', async (t) => {
  try {
    const item = getMockItem([]);
    const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([item]);
    await Controller.removeExportPayloadProductLanding(mockReq, mockRes);
    t.assert(!exportPayloadServiceSaveStub.called);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args, [{ items: [item]}]);
    exportPayloadServiceSaveStub.restore();
    exportPayloadServiceGetStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.removeExportPayloadProductLanding - Should handle not finding a product', async (t) => {
  try {
    const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } = getRequest([], true);
    await Controller.removeExportPayloadProductLanding(mockReq, mockRes);
    t.assert(!exportPayloadServiceSaveStub.called);
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.payload.currentUri]);
    exportPayloadServiceSaveStub.restore();
    exportPayloadServiceGetStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExportPayloadController.removeExportPayloadProductLanding - Should remove the landing and save', async (t) => {
  try {
    const landing = getMockLanding();
    const item = getMockItem([landing]);
    const { mockReq, mockRes, exportPayloadServiceGetStub, exportPayloadServiceSaveStub } =
      getRequest([item], true, { landingId: null });
    await Controller.removeExportPayloadProductLanding(mockReq, mockRes);
    t.assert(exportPayloadServiceSaveStub.called);
    t.assert(mockRes.redirect.called);
    t.deepEquals(mockRes.redirect.getCall(0).args, [mockReq.payload.currentUri]);
    exportPayloadServiceSaveStub.restore();
    exportPayloadServiceGetStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

upsertsAnewLanding(Controller.upsertExportPayloadProductLanding);
upsertsAnewLanding(Controller.upsertExportPayloadProductLanding, true);
upsertsAnewLanding(Controller.upsertExportPayloadProductLandingNonjs, true, false,
  () => {
    return sinon.stub(ReferenceServices, 'getVessel').resolves({
      vesselName: '',
      pln: 'vessel'
    });
  }, { label: 'foo' });
upsertsAnewLanding(Controller.addAnotherExportPayloadProductLandingNonjs, true, true);


savesTheNewProduct();
savesTheNewProduct(true);
doesNotSaveTheProduct();
doesNotSaveTheProduct('');
