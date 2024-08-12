import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import Controller from '../../src/controllers/exporter.controller';
import DocumentNumberService, { catchCerts, storageNote, processingStatement } from '../../src/services/documentNumber.service';
import Services from '../../src/services/exporter.service';
import ServiceNames from '../../src/validators/interfaces/service.name.enum';
import { EXPORTER_KEY } from '../../src/session_store/constants';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const testJourney = async (journey, serviceName) =>
  test(`Exporter.getExporterDetails should createDocumentNumber for journey ${journey}`, async (t) => {
    try {
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.params = {
        journey
      };
      const mockRes = sinon.fake();
      const getDocumentStub = sinon.stub(DocumentNumberService, 'getDocument').resolves({});
      const createDocumentStub = sinon.stub(DocumentNumberService, 'createDocumentNumber').resolves(true);
      const exporterGetStub = sinon.stub(Services, 'get').resolves(true);
      await Controller.getExporterDetails(mockReq, mockRes);
      t.assert(getDocumentStub.called);
      t.assert(createDocumentStub.called);
      t.assert(exporterGetStub.called);
      t.equals(createDocumentStub.getCall(0).args[1], serviceName);
      exporterGetStub.restore();
      createDocumentStub.restore();
      getDocumentStub.restore();
      t.end();
    } catch (e) {
        t.end(e);
    }
  });

const addExporterDetailsHelper = (saveAsDraft=false, nonjs = false) =>
  test('Exporter.addExporterDetails - Should save the exporter', async (t) => {
    try {
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = nonjs ? { accept: 'text/html' } : {}
      mockReq.payload = {
        currentUri: 'currentUri',
        dashboardUri: 'dashboardUri',
        nextUri: 'nextUri',
        journey: catchCerts
      }
      const exporterSaveStub = sinon.stub(Services, 'save').resolves(true);
      const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
      await Controller.addExporterDetails(mockReq, mockRes as any, saveAsDraft);

      t.assert(exporterSaveStub.called);
      t.deepEquals(exporterSaveStub.getCall(0).args, [
        { model: { ...mockReq.payload, user_id: USER_ID }, errors: undefined, error: undefined },
        USER_ID,
        `${mockReq.payload.journey}/${EXPORTER_KEY}`
      ]);
      if (nonjs) {
        t.assert(mockRes.redirect.called);
        t.equals(
          mockRes.redirect.getCall(0).args[0],
          saveAsDraft ? mockReq.payload.dashboardUri : mockReq.payload.nextUri
        );
      }
      exporterSaveStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

testJourney(catchCerts, ServiceNames.CC);
testJourney(storageNote, ServiceNames.SD);
testJourney(processingStatement, ServiceNames.PS);
testJourney('unknown', ServiceNames.UNKNOWN);

test('Exporter.getExporterDetails - Should not create a document if already found', async (t) => {
  try {
    const mockReq = mock(hapi.Request);
    mockReq.app = {
      claims: {
        sub: USER_ID
      }
    };
    mockReq.params = {
      journey: ''
    };
    const mockRes = sinon.fake();
    const getDocumentStub = sinon.stub(DocumentNumberService, 'getDocument').resolves({ foo: 'bar' });
    const createDocumentStub = sinon.stub(DocumentNumberService, 'createDocumentNumber').resolves(true);
    const exporterGetStub = sinon.stub(Services, 'get').resolves(true);
    await Controller.getExporterDetails(mockReq, mockRes);

    exporterGetStub.restore();
    createDocumentStub.restore();
    getDocumentStub.restore();
    t.assert(!createDocumentStub.called);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

addExporterDetailsHelper();
addExporterDetailsHelper(true, true);
addExporterDetailsHelper(false, true);

test('Exporter.addExporterDetailsAndDraftLink - Should call addExporterDetails', async (t) => {
  try {
    const addExporterStub = sinon.stub(Controller, 'addExporterDetails').resolves(true);
    const mockReq = mock(hapi.Request);
    const mockRes = sinon.fake();
    await Controller.addExporterDetailsAndDraftLink(mockReq, mockRes);
    t.assert(addExporterStub.called);
    t.deepEquals(addExporterStub.getCall(0).args, [mockReq, mockRes, true]);
    addExporterStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});