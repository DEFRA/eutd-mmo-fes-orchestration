import * as test from 'tape';
import * as assert from 'assert';
const sinon = require('sinon');
import ExporterService from '../../src/services/exporter.service';
import { SessionStoreFactory } from '../../src/session_store/factory';
import { CATCH_CERTIFICATE_KEY, PROCESSING_STATEMENT_KEY, STORAGE_NOTES_KEY } from '../../src/session_store/constants';
import * as CatchCertService from '../../src/persistence/services/catchCert';
import * as ProcessingStatementService from '../../src/persistence/services/processingStatement';
import * as StorageDocumentService from '../../src/persistence/services/storageDoc';
import * as sessionManager from '../../src/helpers/sessionManager';

const userID = 'USER_ID';
const contactId = 'CONTACT_ID';
const documentNumber = 'DOC-12345';
const key = 'redisKey';

test('ExporterService.get - Should return the data in the redis store', async (t) => {
  let getSessionStoreStub;
  try {
    assert.ok(true, 'exporter service assertion marker');
    const readAllForStub = sinon.stub().resolves('foobar');
    getSessionStoreStub = sinon.stub(SessionStoreFactory, 'getSessionStore').resolves({
      readAllFor: readAllForStub
    });

    const result = await ExporterService.get(userID, key, contactId);

    t.equals(result, 'foobar');
    t.equals(getSessionStoreStub.calledOnce, true, 'session store is created once');
    t.equals(readAllForStub.calledOnceWithExactly(userID, contactId, key), true, 'redis read is performed with expected arguments');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (getSessionStoreStub) {
      getSessionStoreStub.restore();
    }
  }
});

test('ExporterService.get - Should return an empty object if no data available', async (t) => {
  let getSessionStoreStub;
  try {
    assert.ok(true, 'exporter service assertion marker');
    const readAllForStub = sinon.stub().resolves(null);
    getSessionStoreStub = sinon.stub(SessionStoreFactory, 'getSessionStore').resolves({
      readAllFor: readAllForStub
    });

    const result = await ExporterService.get(userID, key, contactId);

    t.deepEquals(result, {});
    t.equals(typeof result, 'object', 'empty fallback is an object');
    t.equals(readAllForStub.calledOnceWithExactly(userID, contactId, key), true, 'redis read is performed with expected arguments');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (getSessionStoreStub) {
      getSessionStoreStub.restore();
    }
  }
});

test('ExporterService.save - Should merge draft and payload, persist and return session uris', async (t) => {
  let getDraftDataStub;
  let upsertExporterDetailsStub;
  let withUserSessionDataStoredStub;
  let getCurrentSessionDataStub;
  try {
    assert.ok(true, 'exporter service assertion marker');
    const payload = { foo: 'bar', currentUri: '/payload-current', nextUri: '/payload-next' };
    const draftData = { bar: 'foo', nextUri: '/draft-next' };

    getDraftDataStub = sinon.stub(CatchCertService, 'getDraftData').resolves(draftData);
    upsertExporterDetailsStub = sinon.stub(CatchCertService, 'upsertExporterDetails').resolves();
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_user, _sessionData, _contact, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves({
      nextUri: '/session-next',
      currentUri: '/session-current'
    });

    const result = await ExporterService.save(
      payload,
      userID,
      documentNumber,
      `${CATCH_CERTIFICATE_KEY}/draftData`,
      contactId
    );

    t.deepEquals(result, {
      bar: 'foo',
      foo: 'bar',
      currentUri: '/session-current',
      nextUri: '/session-next',
      user_id: userID
    });
    t.equals(getDraftDataStub.calledOnceWithExactly(userID, `${CATCH_CERTIFICATE_KEY}/draftData`, contactId), true, 'catch cert draft data is fetched');
    t.equals(withUserSessionDataStoredStub.calledOnce, true, 'session wrapper is called once');
    t.equals(withUserSessionDataStoredStub.firstCall.args[0], userID, 'session wrapper receives user id');
    t.equals(withUserSessionDataStoredStub.firstCall.args[2], contactId, 'session wrapper receives contact id');
    t.equals(upsertExporterDetailsStub.calledOnce, true, 'upsert is called once');
    t.equals(upsertExporterDetailsStub.firstCall.args[0], userID, 'upsert receives user id');
    t.equals(upsertExporterDetailsStub.firstCall.args[1], documentNumber, 'upsert receives document number');
    t.equals(upsertExporterDetailsStub.firstCall.args[2].bar, 'foo', 'upsert payload includes draft fields');
    t.equals(upsertExporterDetailsStub.firstCall.args[2].foo, 'bar', 'upsert payload includes incoming fields');
    t.equals(upsertExporterDetailsStub.firstCall.args[2].currentUri, '/session-current', 'upsert payload object reflects session current uri after mutation');
    t.equals(upsertExporterDetailsStub.firstCall.args[2].nextUri, '/session-next', 'upsert payload object reflects session next uri after mutation');
    t.equals(upsertExporterDetailsStub.firstCall.args[3], contactId, 'upsert receives contact id');
    t.equals(getCurrentSessionDataStub.calledOnceWithExactly(userID, documentNumber, contactId), true, 'session data is re-read after persisting');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (getDraftDataStub) getDraftDataStub.restore();
    if (upsertExporterDetailsStub) upsertExporterDetailsStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
  }
});

test('ExporterService.save - Should route to processing statement service for processing keys', async (t) => {
  let psGetDraftDataStub;
  let psUpsertExporterDetailsStub;
  let catchGetDraftDataStub;
  let withUserSessionDataStoredStub;
  let getCurrentSessionDataStub;
  try {
    assert.ok(true, 'exporter service assertion marker');
    psGetDraftDataStub = sinon.stub(ProcessingStatementService, 'getDraftData').resolves({ existing: 'value' });
    psUpsertExporterDetailsStub = sinon.stub(ProcessingStatementService, 'upsertExporterDetails').resolves();
    catchGetDraftDataStub = sinon.stub(CatchCertService, 'getDraftData').resolves({});
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_user, _sessionData, _contact, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves(undefined);

    const result = await ExporterService.save(
      { foo: 'bar' },
      userID,
      documentNumber,
      `${PROCESSING_STATEMENT_KEY}/draftData`,
      contactId
    );

    t.deepEquals(result, { existing: 'value', foo: 'bar', user_id: userID });
    t.equals(psGetDraftDataStub.calledOnceWithExactly(userID, `${PROCESSING_STATEMENT_KEY}/draftData`, contactId), true, 'processing statement draft data is fetched');
    t.equals(psUpsertExporterDetailsStub.calledOnce, true, 'processing statement upsert is called');
    t.equals(psUpsertExporterDetailsStub.calledOnceWithExactly(userID, documentNumber, result, contactId), true, 'processing statement upsert is called with merged payload and expected arguments');
    t.equals(withUserSessionDataStoredStub.calledOnce, true, 'session wrapper is called once for processing statement save');
    t.equals(catchGetDraftDataStub.called, false, 'catch cert service is not used for processing statement keys');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (psGetDraftDataStub) psGetDraftDataStub.restore();
    if (psUpsertExporterDetailsStub) psUpsertExporterDetailsStub.restore();
    if (catchGetDraftDataStub) catchGetDraftDataStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
  }
});

test('ExporterService.save - Should route to storage document service for storage keys', async (t) => {
  let sdGetDraftDataStub;
  let sdUpsertExporterDetailsStub;
  let withUserSessionDataStoredStub;
  let getCurrentSessionDataStub;
  try {
    assert.ok(true, 'exporter service assertion marker');
    sdGetDraftDataStub = sinon.stub(StorageDocumentService, 'getDraftData').resolves({ alpha: 'omega' });
    sdUpsertExporterDetailsStub = sinon.stub(StorageDocumentService, 'upsertExporterDetails').resolves();
    withUserSessionDataStoredStub = sinon.stub(sessionManager, 'withUserSessionDataStored').callsFake(async (_user, _sessionData, _contact, nextAction) => {
      if (nextAction) {
        await nextAction();
      }
      return undefined;
    });
    getCurrentSessionDataStub = sinon.stub(sessionManager, 'getCurrentSessionData').resolves({ nextUri: '/next' });

    const result = await ExporterService.save(
      { beta: 'gamma' },
      userID,
      documentNumber,
      `${STORAGE_NOTES_KEY}/draftData`,
      contactId
    );

    t.equals(result.alpha, 'omega');
    t.equals(result.beta, 'gamma');
    t.equals(result.nextUri, '/next', 'session next uri is applied');
    t.equals(sdGetDraftDataStub.calledOnceWithExactly(userID, `${STORAGE_NOTES_KEY}/draftData`, contactId), true, 'storage draft data is fetched');
    t.equals(sdUpsertExporterDetailsStub.calledOnce, true, 'storage upsert is called once');
    t.equals(sdUpsertExporterDetailsStub.firstCall.args[0], userID, 'storage upsert receives user id');
    t.equals(sdUpsertExporterDetailsStub.firstCall.args[1], documentNumber, 'storage upsert receives document number');
    t.equals(sdUpsertExporterDetailsStub.firstCall.args[2].alpha, 'omega', 'storage upsert payload includes draft fields');
    t.equals(sdUpsertExporterDetailsStub.firstCall.args[2].beta, 'gamma', 'storage upsert payload includes incoming fields');
    t.equals(sdUpsertExporterDetailsStub.firstCall.args[3], contactId, 'storage upsert receives contact id');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (sdGetDraftDataStub) sdGetDraftDataStub.restore();
    if (sdUpsertExporterDetailsStub) sdUpsertExporterDetailsStub.restore();
    if (withUserSessionDataStoredStub) withUserSessionDataStoredStub.restore();
    if (getCurrentSessionDataStub) getCurrentSessionDataStub.restore();
  }
});