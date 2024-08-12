import * as test from 'tape';
const sinon = require('sinon');
import { getRedisOptions } from '../../src/session_store/redis';
import { IStoreable } from '../../src/session_store/storeable';
import { SessionStoreFactory } from '../../src/session_store/factory';
import DocumentDeleteService from '../../src/services/document-delete.service';
import {
  CONSERVATION_KEY,
  EXPORT_PAYLOAD_KEY,
  EXPORTER_KEY,
  SPECIES_KEY,
  DOCUMENT_NUMBER_KEY,
  SAVE_DRAFT_KEY
} from '../../src/session_store/constants';
import { MySpecies } from '../../src/validators/interfaces/species.interface';
const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';
const journey = 'catchCertificate';
const documentKey = journey + '/' + DOCUMENT_NUMBER_KEY;

const shouldBeInStore = async (sessionStore, key, t, equals) => {
  const result = await sessionStore.readAllFor(USER_ID, key);
  t.deepEqual(result, equals);
};

test('Document-delete - Remove data for a catchCertificate journey', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    
    await DocumentDeleteService.deleteDocument(USER_ID, journey);
    await Promise.all([
      await shouldBeInStore(sessionStore, journey, t, {}),
      await shouldBeInStore(sessionStore, journey + '/' + EXPORT_PAYLOAD_KEY, t, []),
      await shouldBeInStore(sessionStore, SPECIES_KEY, t, <MySpecies[]>[]),
      await shouldBeInStore(sessionStore, documentKey, t, {}),
      await shouldBeInStore(sessionStore, CONSERVATION_KEY, t, []),
      await shouldBeInStore(sessionStore, journey + '/' + SAVE_DRAFT_KEY, t, {})
    ]);
    
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('Document-delete - Remove data for a generic journey', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    
    await DocumentDeleteService.deleteDocument(USER_ID, 'test');
    await Promise.all([
      await shouldBeInStore(sessionStore, 'test', t, {}),
      await shouldBeInStore(sessionStore, 'test' + '/' + DOCUMENT_NUMBER_KEY, t, {}),
    ]);

    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('Document-delete - Should throw an error', async (t) => {
  try {
    let error;
    const sessionStoreFactoryStub = sinon.stub(SessionStoreFactory, 'getSessionStore').rejects(new Error('foo'));
    
    try {
      await DocumentDeleteService.deleteDocument(USER_ID, 'test');
    } catch (e) {
      error = e;
    }
    
    t.assert(error);
    sessionStoreFactoryStub.restore();
    t.end();
    
  } catch (e) {
    t.end(e);
  }
});