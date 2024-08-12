import * as test from 'tape';
import DocumentNumberService from '../../src/services/documentNumber.service';
import { SessionStoreFactory } from '../../src/session_store/factory';

const testRegex = /GBR-\d\d\d\d-foobar-\S\S\S\S\S\S\S\S\S/;
const userID = 'USER_ID';
const key = 'redisKey';

test('DocumentNumberService.getDocumentNumber - Returns a string with current year and a random id', async (t) => {
  try {
    const result = await DocumentNumberService.getDocumentNumber('foobar');
    t.assert(testRegex.test(result));
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('DocumentNumberService.getDocument', (tester) => {
  const writeToStore = async (data) => {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    await sessionStore.writeAllFor(userID, key, data);
  };
  tester.test('Returns an empty object if the store contains a null value', async (t) => {
    try {
      await writeToStore(null);
      const result = await DocumentNumberService.getDraftDocuments(userID, key);
      t.deepEquals(result, {});
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

  tester.test('Returns an object from the sessionStore', async (t) => {
    try {
      await writeToStore('foo');
      const result = await DocumentNumberService.getDraftDocuments(userID, key);
      t.equals(result, 'foo');
      t.end();
    } catch (e) {
      t.end(e);
    }
  });
  tester.end();
});

test('DocumentNumberService.createDocumentNumber - adds a document object to redis', async (t) => {
  try {
    const sessionStore = await SessionStoreFactory.getSessionStore({});
    const result = await DocumentNumberService.createDocumentNumber(userID, 'foobar', key, 'catchCertificate');
    const inStore = await sessionStore.readAllFor(userID, key);

    t.deepEquals(inStore, result);
    t.assert(testRegex.test(result.documentNumber));
    t.end();
  } catch (e) {
    t.end(e);
  }
});