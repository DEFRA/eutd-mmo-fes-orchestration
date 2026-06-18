import * as test from 'tape';
import DocumentNumberService from '../../src/services/documentNumber.service';
import { SessionStoreFactory } from '../../src/session_store/factory';
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as ProcessingStatementService from '../../src/persistence/services/processingStatement';
import * as StorageDocumentService from '../../src/persistence/services/storageDoc';
import { STATUS_DRAFT } from '../../src/services/constants';
import { PROCESSING_STATEMENT_KEY, STORAGE_NOTES_KEY } from '../../src/session_store/constants';
const sinon = require('sinon');

const testRegex = /GBR-\d\d\d\d-foobar-\S\S\S\S\S\S\S\S\S/;
const userID = 'USER_ID';
const key = 'redisKey';
const contactId = 'CONTACT-123';

test('DocumentNumberService.getDocumentNumber - Returns a string with current year and a random id', async (t) => {
  try {
    const result = await DocumentNumberService.getDocumentNumber('foobar');
    t.assert(testRegex.test(result));
    const parts = result.split('-');
    t.equals(parts.length, 4, 'document number has expected number of sections');
    t.equals(parts[0], 'GBR', 'document number starts with GBR');
    t.equals(parts[1], String(new Date().getUTCFullYear()), 'document number contains current year');
    t.equals(parts[2], 'foobar', 'document number contains requested service segment');
    t.equals(parts[3].length, 9, 'document number random suffix has 9 characters');
    t.equals(/^[A-F0-9]{9}$/.test(parts[3]), true, 'document number random suffix uses uppercase hex chars');
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('DocumentNumberService.getDocument', (tester) => {
  tester.test('Routes to catch certificate draft header retrieval for generic key', async (t) => {
    let getDraftCatchCertHeadersForUserStub;
    try {
      const expected = [{ documentNumber: 'CC-1' }];
      getDraftCatchCertHeadersForUserStub = sinon.stub(CatchCertService, 'getDraftCatchCertHeadersForUser').resolves(expected);

      const result = await DocumentNumberService.getDraftDocuments(userID, key, contactId);
      t.deepEquals(result, expected);
      t.equals(getDraftCatchCertHeadersForUserStub.calledOnceWithExactly(userID, contactId), true, 'catch certificate draft headers called with expected args');
      t.end();
    } catch (e) {
      t.end(e);
    } finally {
      if (getDraftCatchCertHeadersForUserStub) getDraftCatchCertHeadersForUserStub.restore();
    }
  });

  tester.test('Routes to processing statement draft header retrieval for processing key', async (t) => {
    let getDraftDocumentHeadersStub;
    try {
      const expected = [{ documentNumber: 'PS-1' }];
      getDraftDocumentHeadersStub = sinon.stub(ProcessingStatementService, 'getDraftDocumentHeaders').resolves(expected);

      const result = await DocumentNumberService.getDraftDocuments(userID, PROCESSING_STATEMENT_KEY, contactId);
      t.deepEquals(result, expected);
      t.equals(getDraftDocumentHeadersStub.calledOnceWithExactly(userID, contactId), true, 'processing statement draft headers called with expected args');
      t.end();
    } catch (e) {
      t.end(e);
    } finally {
      if (getDraftDocumentHeadersStub) getDraftDocumentHeadersStub.restore();
    }
  });

  tester.test('Routes to storage notes draft header retrieval for storage key', async (t) => {
    let getDraftDocumentHeadersStub;
    try {
      const expected = [{ documentNumber: 'SD-1' }];
      getDraftDocumentHeadersStub = sinon.stub(StorageDocumentService, 'getDraftDocumentHeaders').resolves(expected);

      const result = await DocumentNumberService.getDraftDocuments(userID, STORAGE_NOTES_KEY, contactId);
      t.deepEquals(result, expected);
      t.equals(getDraftDocumentHeadersStub.calledOnceWithExactly(userID, contactId), true, 'storage notes draft headers called with expected args');
      t.end();
    } catch (e) {
      t.end(e);
    } finally {
      if (getDraftDocumentHeadersStub) getDraftDocumentHeadersStub.restore();
    }
  });
  tester.end();
});

test('DocumentNumberService.createDocumentNumber - adds a document object to redis', async (t) => {
  let getSessionStoreStub;
  try {
    const fakeSessionStore = {
      writeAllFor: sinon.stub().resolves(),
      tagByDocumentNumber: sinon.stub().resolves()
    };
    getSessionStoreStub = sinon.stub(SessionStoreFactory, 'getSessionStore').resolves(fakeSessionStore);

    const result = await DocumentNumberService.createDocumentNumber(userID, 'foobar', key, 'catchCertificate', contactId);

    t.assert(testRegex.test(result.documentNumber));
    t.equals(result.status, STATUS_DRAFT, 'created document has draft status');
    t.equal(typeof result.startedAt, 'string', 'created document has startedAt string');
    t.equals(getSessionStoreStub.calledOnce, true, 'session store is requested once');
    t.equals(fakeSessionStore.writeAllFor.calledOnceWithExactly(userID, contactId, key, result), true, 'document payload is written to session store');
    t.equals(fakeSessionStore.tagByDocumentNumber.calledOnceWithExactly(userID, contactId, result.documentNumber, 'catchCertificate'), true, 'document number is tagged to journey');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (getSessionStoreStub) getSessionStoreStub.restore();
  }
});