import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import DocumentNumberService from '../../src/services/documentNumber.service';
import Controller from '../../src/controllers/document.controller';
import { DOCUMENT_NUMBER_KEY } from '../../src/session_store/constants';
import { catchCerts, storageNote, processingStatement } from '../../src/services/documentNumber.service';
import * as catchCertServices from '../../src/persistence/services/catchCert';
import * as processingStatementServices from '../../src/persistence/services/processingStatement';
import * as storageDocServices from '../../src/persistence/services/storageDoc';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const mockDocument = {
  documentNumber: 0
};

const getRequest = (type = '', resolves = mockDocument, error = null) => {
  const mockReq = mock(hapi.Request);
  mockReq.headers = {};
  mockReq.app = {
    claims: {
      sub: USER_ID
    }
  };
  mockReq.query = {
    service : 'foo',
    type
  };
  mockReq.params = { month: 5, year: 2019 } as any;
  const mockRes = sinon.fake();
  let documentNumberServiceStub;
  if (error) {
    documentNumberServiceStub = sinon.stub(DocumentNumberService, 'getDocument').rejects(error);
  } else {
    documentNumberServiceStub = sinon.stub(DocumentNumberService, 'getDocument').resolves(resolves);
  }
  
  return { mockReq, mockRes, documentNumberServiceStub };
};

test('DocumentController.getDocumentFromRedis - should request the document from the DocumentNumberService', 
async (t) => {
  try {
    
    const { mockReq, mockRes, documentNumberServiceStub } = getRequest();
    
    await Controller.getDocumentFromRedis(mockReq, mockRes as any);
    t.assert(documentNumberServiceStub.called);
    t.equals(documentNumberServiceStub.getCall(0).args[0], USER_ID);
    t.equals(documentNumberServiceStub.getCall(0).args[1], 'foo/' + DOCUMENT_NUMBER_KEY);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0], mockDocument);
    documentNumberServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('DocumentController.getAllDocuments - Should return empty data if the query type is unknown', async (t) => {
  try {
    const { mockReq, mockRes, documentNumberServiceStub } = getRequest();
    await Controller.getAllDocuments(mockReq, mockRes);
    t.assert(!documentNumberServiceStub.called);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0], { inProgress: [], completed: []});
    documentNumberServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

const testDocumentType = (type, useService, serviceFunctionName, withoutDocumentNumber = false) => 
test(`DocumentController.getAllDocuments - 
  Should return ${withoutDocumentNumber ? 'No Documents' : 'Documents'} for ${type}`, async (t) => {
  try {
    const { mockReq, mockRes, documentNumberServiceStub } = getRequest(type, 
      withoutDocumentNumber ? {} : mockDocument as any);
    const stub = sinon.stub(useService, serviceFunctionName).returns('completedCatchCerts');
    await Controller.getAllDocuments(mockReq, mockRes);
    t.assert(documentNumberServiceStub.called);
    t.assert(mockRes.called);
    t.assert(stub.called);
    t.deepEquals(mockRes.getCall(0).args[0], {
      inProgress: withoutDocumentNumber ? [] : [mockDocument],
      completed: 'completedCatchCerts'
    });
    documentNumberServiceStub.restore();
    stub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

testDocumentType(catchCerts,catchCertServices, 'getAllCatchCertsForUserByYearAndMonth');
testDocumentType(processingStatement,processingStatementServices, 'getAllProcessingStatementsForUserByYearAndMonth');
testDocumentType(storageNote, storageDocServices, 'getAllStorageDocsForUserByYearAndMonth');

testDocumentType(catchCerts,catchCertServices, 'getAllCatchCertsForUserByYearAndMonth', true);
testDocumentType(processingStatement,processingStatementServices, 'getAllProcessingStatementsForUserByYearAndMonth',true);
testDocumentType(storageNote, storageDocServices, 'getAllStorageDocsForUserByYearAndMonth',  true);

test('DocumentController.getAllDocuments - Should return empty data if a service fails', async (t) => {
  try {
    const { mockReq, mockRes, documentNumberServiceStub } = getRequest(catchCerts, mockDocument, new Error('a'));
    await Controller.getAllDocuments(mockReq, mockRes);
    t.assert(documentNumberServiceStub.called);
    t.assert(mockRes.called);
    t.deepEquals(mockRes.getCall(0).args[0], { inProgress: [], completed: []});
    documentNumberServiceStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});
