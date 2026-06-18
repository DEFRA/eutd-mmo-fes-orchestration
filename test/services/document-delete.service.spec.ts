import * as test from 'tape';
const sinon = require('sinon');
import DocumentDeleteService from '../../src/services/document-delete.service';
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as ProcessingStatementService from '../../src/persistence/services/processingStatement';
import * as StorageDocumentService from '../../src/persistence/services/storageDoc';
import SummaryErrorsService from '../../src/services/summaryErrors.service';
import * as sessionManager from '../../src/helpers/sessionManager';
import {
  CATCH_CERTIFICATE_KEY,
  DRAFT_HEADERS_KEY,
  PROCESSING_STATEMENT_KEY,
  STORAGE_NOTES_KEY
} from '../../src/session_store/constants';
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const CONTACT_ID = 'CONTACT-123';
const DOCUMENT_NUMBER = 'DOC-123';

test('Document-delete - Remove data for a catchCertificate journey', async (t) => {
  let clearErrorsStub;
  let deleteDraftCertificateStub;
  let clearSessionDataStub;
  let invalidateDraftCacheStub;

  try {
    clearErrorsStub = sinon.stub(SummaryErrorsService, 'clearErrors').resolves();
    deleteDraftCertificateStub = sinon.stub(CatchCertService, 'deleteDraftCertificate').resolves();
    clearSessionDataStub = sinon.stub(sessionManager, 'clearSessionDataForCurrentJourney').resolves();
    invalidateDraftCacheStub = sinon.stub(CatchCertService, 'invalidateDraftCache').resolves();

    await DocumentDeleteService.deleteDocument(USER_ID, DOCUMENT_NUMBER, CATCH_CERTIFICATE_KEY, CONTACT_ID);

    t.equals(clearErrorsStub.calledOnceWithExactly(DOCUMENT_NUMBER), true, 'summary errors are cleared for the document');
    t.equals(deleteDraftCertificateStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'catch cert draft is deleted');
    t.equals(clearSessionDataStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'session data is cleared for current journey');
    t.equals(invalidateDraftCacheStub.calledTwice, true, 'draft cache invalidation is called twice');
    t.equals(invalidateDraftCacheStub.firstCall.calledWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'document cache key is invalidated');
    t.equals(invalidateDraftCacheStub.secondCall.calledWithExactly(USER_ID, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, CONTACT_ID), true, 'draft headers cache key is invalidated');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (clearErrorsStub) clearErrorsStub.restore();
    if (deleteDraftCertificateStub) deleteDraftCertificateStub.restore();
    if (clearSessionDataStub) clearSessionDataStub.restore();
    if (invalidateDraftCacheStub) invalidateDraftCacheStub.restore();
  }
});

test('Document-delete - Remove data for a processingStatement journey', async (t) => {
  let deleteDraftStatementStub;
  let clearSessionDataStub;
  let invalidateDraftCacheStub;
  let clearErrorsStub;

  try {
    deleteDraftStatementStub = sinon.stub(ProcessingStatementService, 'deleteDraftStatement').resolves();
    clearSessionDataStub = sinon.stub(sessionManager, 'clearSessionDataForCurrentJourney').resolves();
    invalidateDraftCacheStub = sinon.stub(CatchCertService, 'invalidateDraftCache').resolves();
    clearErrorsStub = sinon.stub(SummaryErrorsService, 'clearErrors').resolves();

    await DocumentDeleteService.deleteDocument(USER_ID, DOCUMENT_NUMBER, PROCESSING_STATEMENT_KEY, CONTACT_ID);

    t.equals(deleteDraftStatementStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'processing statement draft is deleted');
    t.equals(clearErrorsStub.called, false, 'summary errors are not cleared for non-catch-certificate journey');
    t.equals(clearSessionDataStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'session data is cleared for processing statement journey');
    t.equals(invalidateDraftCacheStub.calledTwice, true, 'cache invalidation is still performed twice');
    t.equals(invalidateDraftCacheStub.secondCall.calledWithExactly(USER_ID, `${PROCESSING_STATEMENT_KEY}/${DRAFT_HEADERS_KEY}`, CONTACT_ID), true, 'processing statement draft headers cache key is invalidated');

    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (deleteDraftStatementStub) deleteDraftStatementStub.restore();
    if (clearSessionDataStub) clearSessionDataStub.restore();
    if (invalidateDraftCacheStub) invalidateDraftCacheStub.restore();
    if (clearErrorsStub) clearErrorsStub.restore();
  }
});

test('Document-delete - Remove data for a storageNotes journey', async (t) => {
  let deleteDraftStub;
  let clearSessionDataStub;
  let invalidateDraftCacheStub;

  try {
    deleteDraftStub = sinon.stub(StorageDocumentService, 'deleteDraft').resolves();
    clearSessionDataStub = sinon.stub(sessionManager, 'clearSessionDataForCurrentJourney').resolves();
    invalidateDraftCacheStub = sinon.stub(CatchCertService, 'invalidateDraftCache').resolves();

    await DocumentDeleteService.deleteDocument(USER_ID, DOCUMENT_NUMBER, STORAGE_NOTES_KEY, CONTACT_ID);

    t.equals(deleteDraftStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'storage draft is deleted');
    t.equals(clearSessionDataStub.calledOnceWithExactly(USER_ID, DOCUMENT_NUMBER, CONTACT_ID), true, 'session data is cleared for storage journey');
    t.equals(invalidateDraftCacheStub.secondCall.calledWithExactly(USER_ID, `${STORAGE_NOTES_KEY}/${DRAFT_HEADERS_KEY}`, CONTACT_ID), true, 'storage draft headers cache key is invalidated');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (deleteDraftStub) deleteDraftStub.restore();
    if (clearSessionDataStub) clearSessionDataStub.restore();
    if (invalidateDraftCacheStub) invalidateDraftCacheStub.restore();
  }
});

test('Document-delete - Should throw an error for invalid journey', async (t) => {
  try {
    let error;

    try {
      await DocumentDeleteService.deleteDocument(USER_ID, DOCUMENT_NUMBER, 'invalidJourney', CONTACT_ID);
    } catch (e) {
      error = e;
    }

    t.assert(error, 'error should be thrown');
    t.equals(error.message, '[deleteDocument][INVALID-JOURNEY]', 'error message should describe invalid journey');
    t.end();
  } catch (e) {
    t.end(e);
  }
});