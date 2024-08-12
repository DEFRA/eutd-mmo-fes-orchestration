import * as test from 'tape';
import * as hapi from 'hapi';
const sinon = require('sinon');
import { mock } from 'ts-mockito';
import Controller from '../../src/controllers/fish.controller';
import Services from '../../src/services/fish.service';
import ExportPayloadService from '../../src/services/export-payload.service';
import ExportPayloadController from "../../src/controllers/export-payload.controller";
import * as referenceDataService from '../../src/services/reference-data.service';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const mockProduct = {
  id: '1',
  state: {
    code: 'FRO',
    label: 'Frozen'
  },
  presentation: {
    code: 'GUT',
    label: 'Gutted'
  },
  species: {
    code: 'COD',
    label: 'Atlantic COD'
  },
  commodityCode: 'commodityCode'
};

const unaugmentedProduct = {
  id: mockProduct.id,
  state: mockProduct.state.code,
  stateLabel: mockProduct.state.label,
  presentation: mockProduct.presentation.code,
  presentationLabel: mockProduct.presentation.label,
  species: mockProduct.species.label,
  speciesCode: mockProduct.species.code,
  commodity_code: mockProduct.commodityCode,
}

const addingAFish = (index, customAsserts, exportPayloadValue = null, commodity_code = 'commodity_code', nonjs = true) =>
  test(`FishController.addFish - Should call service.addFish branch - ${index}`, async (t) => {
    try {
      const addFishStub = sinon.stub(Services, 'addFish').resolves('addFish');
      const exportServiceGetStub = sinon.stub(ExportPayloadService, 'get').resolves(
        exportPayloadValue || { items: null }
      );
      const exportServiceSaveStub = sinon.stub(ExportPayloadService, 'save').resolves(true);
      const exportPayloadStub = sinon.stub(ExportPayloadController, 'addPayloadProduct').returns({ items: ['foo'] });
      const augmentProductDetailsStub = sinon.stub(Controller, 'augmentProductDetails').resolves('prd');
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.payload = {
        species: 'species',
        id: 'id',
        state: 'state',
        stateLabel: 'stateLabel',
        commodity_code: commodity_code,
        presentation: 'presentation',
        presentationLabel: 'presentationLabel',
        speciesCode: 'speciesCode',
      };
      mockReq.headers = nonjs ? { accept: 'text/html' } : {};
      const mockRes = sinon.fake();
      await Controller.addFish(mockReq, mockRes);

      customAsserts(t, { addFishStub, exportServiceGetStub, exportServiceSaveStub, exportPayloadStub }, mockReq);

      addFishStub.restore();
      exportServiceGetStub.restore();
      exportServiceSaveStub.restore();
      exportPayloadStub.restore();
      augmentProductDetailsStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const cancellingAnAdd = (index, customAsserts, exportPayloadValue = null, nonjs = true) =>
  test(`FishController.addFish - Should try to cancel a fish which was added branch - ${index}`, async (t) => {
    try {
      const exportServiceSaveStub = sinon.stub(ExportPayloadService, 'save').resolves(true);
      const removeFishStub = sinon.stub(Services, 'removeFish').resolves('removeFish');
      const exportServiceGetStub = sinon.stub(ExportPayloadService, 'get').resolves(
        exportPayloadValue || { items: ['foo', 'bar'] }
      );
      const exportPayloadStub = sinon.stub(ExportPayloadController, 'removePayloadProduct').returns({ items: ['foo'] });
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = nonjs ? { accept: 'text/html' } : {};
      mockReq.payload = {
        cancel: 'cancel',
        redirect: 'redirectUri'
      };

      const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
      await Controller.addFish(mockReq, mockRes);

      customAsserts(t, { exportServiceGetStub, exportServiceSaveStub, removeFishStub, exportPayloadStub }, mockReq);

      if (nonjs) {
        t.assert(mockRes.redirect.called);
      } else {
        t.assert(mockRes.called);
      }

      exportServiceGetStub.restore();
      removeFishStub.restore();
      exportServiceSaveStub.restore();
      exportPayloadStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

const addedFish = (refresh = false) =>
  test(`FishController.addedFish - Get addedFish and refresh if necessary ${refresh ? "with refresh" :
  "without refresh"}`, async (t) => {
    try {
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = {}
      mockReq.payload = {
        cancel: 'cancel',
        redirect: 'redirectUri'
      };
      const mockRes = sinon.fake();
      const addedFishStub = sinon.stub(Services, 'addedFish').resolves('addedFish');
      const exportServiceGetStub = sinon.stub(ExportPayloadService, 'get').resolves(true);
      const syncSpeciesAndLandingsStub = sinon.stub(Controller, 'syncSpeciesAndLandings').resolves(refresh);

      await Controller.addedFish(mockReq, mockRes);

      t.deepEquals(addedFishStub.getCall(0).args, [USER_ID]);
      t.deepEquals(exportServiceGetStub.getCall(0).args, [USER_ID]);
      t.deepEquals(syncSpeciesAndLandingsStub.getCall(0).args, [USER_ID, 'addedFish', true]);
      if (refresh) {
        t.assert(addedFishStub.calledTwice);
      }
      addedFishStub.restore();
      exportServiceGetStub.restore();
      syncSpeciesAndLandingsStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });
addingAFish(0,(t, stubs, mockReq) => {
  t.deepEquals(stubs.addFishStub.getCall(0).args, [{ ...mockReq.payload, user_id: USER_ID }]);
  t.deepEquals(stubs.exportServiceGetStub.getCall(0).args, [USER_ID]);
  t.deepEquals(stubs.exportPayloadStub.getCall(0).args, [{ items: [] }, 'prd']);
  t.deepEquals(stubs.exportServiceSaveStub.getCall(0).args, [
    { items: ['foo'], errors: undefined }, USER_ID
  ]);
});

addingAFish(1,(t, stubs, mockReq) => {
  t.deepEquals(stubs.addFishStub.getCall(0).args, [{ ...mockReq.payload, user_id: USER_ID }]);
  t.deepEquals(stubs.exportServiceGetStub.getCall(0).args, [USER_ID]);
  t.deepEquals(stubs.exportPayloadStub.getCall(0).args, [{ items: ['foo'] }, 'prd']);
  t.assert(!stubs.exportServiceSaveStub.called);
}, { items: ['foo'] });

addingAFish(2,(t, stubs, mockReq) => {
  t.deepEquals(stubs.addFishStub.getCall(0).args, [{ ...mockReq.payload, user_id: USER_ID }]);
  t.assert(!stubs.exportServiceGetStub.called);
  t.assert(!stubs.exportPayloadStub.called);
  t.assert(!stubs.exportServiceSaveStub.called);
}, { items: [] }, null);

addingAFish(3,(t, stubs, mockReq) => {
  t.assert(stubs.addFishStub.called);
  t.assert(!stubs.exportServiceGetStub.called);
  t.assert(!stubs.exportPayloadStub.called);
  t.assert(!stubs.exportServiceSaveStub.called);
}, { items: [] }, null, false);

cancellingAnAdd(0, (t, stubs, mockReq) => {
  t.deepEquals(stubs.removeFishStub.getCall(0).args, [
    {
      cancel: mockReq.payload.cancel,
      redirect: mockReq.payload.redirect,
      user_id: USER_ID
    }
  ]);
  t.deepEquals(stubs.exportServiceGetStub.getCall(0).args, [USER_ID]);
  t.deepEquals(stubs.exportPayloadStub.getCall(0).args, [{ items: ['foo', 'bar'] }, mockReq.payload.cancel]);
  t.deepEquals(stubs.exportServiceSaveStub.getCall(0).args, [
    { items: ['foo'], errors: undefined }, USER_ID
  ]);
});

cancellingAnAdd(1, (t, stubs, mockReq) => {
  t.deepEquals(stubs.removeFishStub.getCall(0).args, [
    {
      cancel: mockReq.payload.cancel,
      redirect: mockReq.payload.redirect,
      user_id: USER_ID
    }
  ]);
  t.deepEquals(stubs.exportServiceGetStub.getCall(0).args, [USER_ID]);
  t.deepEquals(stubs.exportPayloadStub.getCall(0).args, [{ items: [] }, mockReq.payload.cancel]);
  t.assert(!stubs.exportServiceSaveStub.called);
}, { items: []});

cancellingAnAdd(2, (t, stubs, mockReq) => {
  t.deepEquals(stubs.removeFishStub.getCall(0).args, [
    {
      cancel: mockReq.payload.cancel,
      redirect: mockReq.payload.redirect,
      user_id: USER_ID
    }
  ]);
  t.deepEquals(stubs.exportServiceGetStub.getCall(0).args, [USER_ID]);
  t.assert(!stubs.exportPayloadStub.called);
  t.assert(!stubs.exportServiceSaveStub.called);
}, {});

cancellingAnAdd(3, (t, stubs, mockReq) => {
  t.deepEquals(stubs.removeFishStub.getCall(0).args, [
    {
      cancel: mockReq.payload.cancel,
      redirect: mockReq.payload.redirect,
      user_id: USER_ID
    }
  ]);
  t.assert(!stubs.exportServiceGetStub.called);
  t.assert(!stubs.exportPayloadStub.called);
  t.assert(!stubs.exportServiceSaveStub.called);
}, {}, false);

addedFish();
addedFish(true);

test('FishController.syncSpeciesAndLandings - Should return false', async (t) => {
  try {
    const result = await Controller.syncSpeciesAndLandings(USER_ID, [], {});
    t.equals(result, false);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.syncSpeciesAndLandings - Should return false', async (t) => {
  try {
    const result = await Controller.syncSpeciesAndLandings(USER_ID, [], { items: []});
    t.equals(result, false);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.syncSpeciesAndLandings - Should return false', async (t) => {
  try {
    const result = await Controller.syncSpeciesAndLandings(USER_ID, [{ id: '0' }], {});
    t.equals(result, false);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.syncSpeciesAndLandings - Should return true remove unmatchedSpecies and add unmatched export payloads', async (t) => {
  try {
    const removeFishStub = sinon.stub(Services, 'removeFish').resolves('removeFish');
    const addFishStub = sinon.stub(Services, 'addFish').resolves('addFish');
    const result = await Controller.syncSpeciesAndLandings(
      USER_ID,
      [{ commodity_code: 'commodity_code', id: '0' }],
      { items: [{ product: { ...mockProduct } }] }
    );
    t.equals(result, true);
    t.deepEquals(removeFishStub.getCall(0).args, [{ user_id: USER_ID, cancel: '0' }]);
    t.deepEquals(addFishStub.getCall(0).args, [{
      ...unaugmentedProduct,
      user_id: USER_ID
    }]);
    removeFishStub.restore();
    addFishStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.augmentProductDetails - Augment data to include sub objects', async (t) => {
  try {
    const result = await Controller.augmentProductDetails(unaugmentedProduct);
    t.deepEquals(result, mockProduct);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.augmentProductDetails - Should extract the species code from the label', async (t) => {
  try {
    const result = await Controller.augmentProductDetails({
      ...unaugmentedProduct,
      speciesCode: false,
      species: 'Atlantic Cod (FAO_CODE)'
    });
    t.deepEquals(result, { ...mockProduct, species: { label: 'Atlantic Cod (FAO_CODE)' , code: 'FAO_CODE' }});
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.augmentProductDetails - Should call getStateByCode with the state code', async (t) => {
  try {
    const getStateByCodeStub = sinon.stub(referenceDataService, 'getStateByCode').resolves({ label: 'foo' });
    const result = await Controller.augmentProductDetails({
      ...unaugmentedProduct,
      stateLabel: false,
      state: 'FRE'
    });
    t.deepEquals(result, { ...mockProduct, state: { label: 'foo' , code: 'FRE' }});
    getStateByCodeStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('FishController.augmentProductDetails - Should call getPresentationByCode with the state code', async (t) => {
  try {
    const getStateByCodeStub = sinon.stub(referenceDataService, 'getPresentationByCode').resolves({ label: 'foo' });
    const result = await Controller.augmentProductDetails({
      ...unaugmentedProduct,
      presentationLabel: false,
      presentation: 'GUT'
    });
    t.deepEquals(result, { ...mockProduct, presentation: { label: 'foo' , code: 'GUT' }});
    getStateByCodeStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});
