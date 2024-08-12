import * as test from 'tape';
import * as hapi from 'hapi';
const sinon = require('sinon');
import Controller from '../../src/controllers/conservation.controller';
import ConservationService from '../../src/services/conservation.service';
import { mock } from 'ts-mockito';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const mockConservation = {
  conservationReference: 'Other',
  anotherConservation: false
};

const payload = {
  currentUri: 'currentUri',
  previousUri: 'previousUri',
  dashboardUri: 'dashboardUri',
  nextUri: 'nextUri'
};

const getRequest = (nonjs = true) => {
  const mockReq = mock(hapi.Request);
  mockReq.headers = nonjs ? { accept: 'text/html' } : {};
  mockReq.payload = payload;
  mockReq.app = {
    claims : {
      sub: USER_ID
    }
  };

  return mockReq;
};

const setupTest = (conservationMock = mockConservation, nonjs = true) => {
  const mockReq = getRequest(nonjs);
  const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
  const conservationServiceStub = sinon.stub(ConservationService, 'addConservation').resolves(conservationMock);

  return { mockReq, mockRes, conservationServiceStub };
};

test('ConservationController.addConservation - Should add a conservation', async (t) => {
  try {
    const {
      mockReq,
      mockRes,
      conservationServiceStub
    } = setupTest(mockConservation, false);

    await Controller.addConservation(mockReq, mockRes as any);
    t.assert(conservationServiceStub.called);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0], mockConservation);
    conservationServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ConservationController.addConservation - Should add a conservation and not save draft as link', async (t) => {
  try {
    const {
      mockReq,
      mockRes,
      conservationServiceStub
    } = setupTest();

    await Controller.addConservation(mockReq, mockRes as any);
    t.assert(conservationServiceStub.called);
    t.assert(mockRes.redirect.called);
    t.equals(mockRes.redirect.getCall(0).args[0], payload.currentUri);
    conservationServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ConservationController.addConservation - Should add a conservation and save draft as link', async (t) => {
  try {
    const {
      mockReq,
      mockRes,
      conservationServiceStub
    } = setupTest();

    await Controller.addConservation(mockReq, mockRes as any, true);
    t.assert(conservationServiceStub.called);
    t.assert(mockRes.redirect.called);
    t.equals(mockRes.redirect.getCall(0).args[0], payload.dashboardUri);
    conservationServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

const commonTest = (setupTestOverride = {}) =>
test('ConservationController.addConservation - Should add a conservation and redirect to the next uri', async (t) => {
  try {
    const {
      mockReq,
      mockRes,
      conservationServiceStub
    } = setupTest({ ...mockConservation, ...setupTestOverride });

    await Controller.addConservation(mockReq, mockRes as any);
    t.assert(conservationServiceStub.called);
    t.assert(mockRes.redirect.called);
    t.equals(mockRes.redirect.getCall(0).args[0], payload.nextUri);
    conservationServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

commonTest({ conservationReference: 'None' });
commonTest({ anotherConservation: true });

test('ConservationController.getConservation - should return the conservation data', async (t) => {
  try {
    const mockReq = getRequest(true);
    const mockRes = sinon.fake();
    const conservationServiceStub = sinon.stub(ConservationService, 'getConservation').resolves('foo');
    await Controller.getConservation(mockReq, mockRes);
    t.assert(mockRes.called);
    t.equals(mockRes.getCall(0).args[0], 'foo');
    conservationServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ConservationController.addConservationAndSaveAsDraft - Should call addConservation', async (t) => {
  try {
    const mockReq = getRequest();
    const mockRes = {};
    const addConservationStub = sinon.stub(Controller, 'addConservation').resolves('foo');
    const result = await Controller.addConservationAndSaveAsDraft(mockReq, mockRes as any);
    t.assert(addConservationStub.called);
    t.equals(result, 'foo');
    addConservationStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});