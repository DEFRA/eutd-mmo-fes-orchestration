import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import Controller from '../../src/controllers/exporter.controller';
import DocumentNumberService, { catchCerts, storageNote, processingStatement } from '../../src/services/documentNumber.service';
import Services from '../../src/services/exporter.service';
import ServiceNames from '../../src/validators/interfaces/service.name.enum';
import { EXPORTER_KEY } from '../../src/session_store/constants';
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as ProcessingStatementService from '../../src/persistence/services/processingStatement';
import * as StorageDocumentService from '../../src/persistence/services/storageDoc';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const testJourney = async (journey, serviceName) =>
  test(`Exporter.getExporterDetails should call correct service for journey ${journey}`, async (t) => {
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
      const userPrincipal = USER_ID;
      const documentNumber = 'GBR-2021-CC-TEST123';
      const contactId = 'contact-123';
      
      let serviceStub;
      
      // Based on journey, stub the appropriate service
      if (journey === catchCerts) {
        serviceStub = sinon.stub(CatchCertService, 'getExporterDetails').resolves({});
      } else if (journey === processingStatement) {
        serviceStub = sinon.stub(ProcessingStatementService, 'getExporterDetails').resolves({});
      } else if (journey === storageNote) {
        serviceStub = sinon.stub(StorageDocumentService, 'getExporterDetails').resolves({});
      } else {
        // For unknown journeys, it calls getExporterDetailsFromRedis which uses DocumentNumberService
        const getDraftDocumentsStub = sinon.stub(DocumentNumberService, 'getDraftDocuments').resolves({});
        const createDocumentStub = sinon.stub(DocumentNumberService, 'createDocumentNumber').resolves(true);
        const exporterGetStub = sinon.stub(Services, 'get').resolves({});
        
        await Controller.getExporterDetails(mockReq, userPrincipal, documentNumber, contactId);
        
        t.assert(getDraftDocumentsStub.called);
        t.assert(createDocumentStub.called);
        t.assert(exporterGetStub.called);
        t.equals(createDocumentStub.getCall(0).args[1], serviceName);
        
        exporterGetStub.restore();
        createDocumentStub.restore();
        getDraftDocumentsStub.restore();
        t.end();
        return;
      }
      
      await Controller.getExporterDetails(mockReq, userPrincipal, documentNumber, contactId);
      
      t.assert(serviceStub.called);
      t.deepEquals(serviceStub.getCall(0).args, [userPrincipal, documentNumber, contactId]);
      
      serviceStub.restore();
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
      const userPrincipal = USER_ID;
      const documentNumber = 'GBR-2021-CC-TEST123';
      const contactId = 'contact-123';
      const exporterSaveStub = sinon.stub(Services, 'save').resolves(true);
      const mockRes = nonjs ? { redirect: sinon.fake() } : sinon.fake();
      await Controller.addExporterDetails(mockReq, mockRes as any, saveAsDraft, userPrincipal, documentNumber, contactId);

      t.assert(exporterSaveStub.called);
      t.deepEquals(exporterSaveStub.getCall(0).args, [
        { model: { ...mockReq.payload, user_id: USER_ID }, errors: undefined, error: undefined },
        USER_ID,
        documentNumber,
        `${mockReq.payload.journey}/${EXPORTER_KEY}`,
        contactId
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

test('Exporter.getExporterDetails - Should call CatchCertService for catchCertificate journey', async (t) => {
  try {
    const mockReq = mock(hapi.Request);
    mockReq.app = {
      claims: {
        sub: USER_ID
      }
    };
    mockReq.params = {
      journey: catchCerts
    };
    const userPrincipal = USER_ID;
    const documentNumber = 'GBR-2021-CC-TEST123';
    const contactId = 'contact-123';
    
    const getExporterDetailsStub = sinon.stub(CatchCertService, 'getExporterDetails').resolves({ foo: 'bar' });
    
    const result = await Controller.getExporterDetails(mockReq, userPrincipal, documentNumber, contactId);
    
    t.assert(getExporterDetailsStub.called);
    t.deepEquals(getExporterDetailsStub.getCall(0).args, [userPrincipal, documentNumber, contactId]);
    t.deepEquals(result, { foo: 'bar' });
    
    getExporterDetailsStub.restore();
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
    const userPrincipal = USER_ID;
    const documentNumber = 'GBR-2021-CC-TEST123';
    const contactId = 'contact-123';
    await Controller.addExporterDetailsAndDraftLink(mockReq, mockRes, userPrincipal, documentNumber, contactId);
    t.assert(addExporterStub.called);
    t.deepEquals(addExporterStub.getCall(0).args, [mockReq, mockRes, true, userPrincipal, documentNumber, contactId]);
    addExporterStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});