import * as test from 'tape';
import * as hapi from 'hapi';
const sinon = require('sinon');
import Controller from '../../src/controllers/confirmDocumentDelete.controller';
import DocumentDeleteService from '../../src/services/document-delete.service';
import { mock } from 'ts-mockito';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const journey = 'catchCertificate';

const getRequest = (deleteDocument, headers = {}) => {
  const mockReq = mock(hapi.Request);
  mockReq.app = {
    claims: {
      sub: USER_ID
    }
  };
  mockReq.payload = {
    journey,
    documentDelete: deleteDocument,
    previousUri: 'previous',
    nextUri: 'next'
  };
  mockReq.headers = {
    ...headers
  };
  return mockReq;
};

test('ConfirmDocumentDelete.confirmDocumentDelete - Should delete the document', async (t) => {
  try {
    const deleteDocumentStub = sinon.stub(DocumentDeleteService, 'deleteDocument').resolves(true);
    const mockReq = getRequest('Yes');
    const mockRes = sinon.fake();
    await Controller.confirmDocumentDelete(mockReq, mockRes as any);
    t.assert(deleteDocumentStub.called);
    t.deepEquals(deleteDocumentStub.getCall(0).args, [mockReq.app.claims.sub, mockReq.payload.journey]);
    t.assert(mockRes.called);
    deleteDocumentStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ConfirmDocumentDelete.confirmDocumentDelete - Should not delete the document', async (t) => {
  try {
    const deleteDocumentStub = sinon.stub(DocumentDeleteService, 'deleteDocument').resolves(true);
    const mockReq = getRequest('No', { accept: 'text/html' });
    const mockRes = { redirect: sinon.fake() }
    await Controller.confirmDocumentDelete(mockReq, mockRes as any);
    t.assert(!deleteDocumentStub.called);
    t.assert(mockRes.redirect.called);
    t.equals(mockRes.redirect.getCall(0).args[0], mockReq.payload.previousUri);
    deleteDocumentStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ConfirmDocumentDelete.confirmDocumentDelete - Should not respond if the function throws', async (t) => {
  try {
    const deleteDocumentStub = 
    sinon.stub(DocumentDeleteService, 'deleteDocument').resolves(Promise.reject(new Error('a')));
    const mockReq = getRequest('Yes');
    const mockRes = sinon.fake();
    await Controller.confirmDocumentDelete(mockReq, mockRes as any);
    t.assert(mockRes.called === false);
    deleteDocumentStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});