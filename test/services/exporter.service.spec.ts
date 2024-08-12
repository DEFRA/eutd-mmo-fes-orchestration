import * as test from 'tape';
import { SessionStoreFactory } from '../../src/session_store/factory';
import ExporterService from '../../src/services/exporter.service';

const userID = 'USER_ID';
const key = 'redisKey';
const writeToStore = async (data) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  await sessionStore.writeAllFor(userID, key, data);
};

test('ExporterService.get - Should return the data in the redis store', async (t) => {
  try {
    await writeToStore('foobar');
    const result = await ExporterService.get(userID, key);
    t.equals(result, 'foobar');
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExporterService.get - Should return an empty object if no data available', async (t) => {
  try {
    await writeToStore(null);
    const result = await ExporterService.get(userID, key);
    t.deepEquals(result, {});
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExporterService.save - Should add the data in the redis store', async (t) => {
  try {
    await writeToStore(null);
    const result = await ExporterService.save({ foo: 'bar' }, userID, key);
    t.deepEquals(result, { foo: 'bar' });
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('ExporterService.save - Should append the data in the redis store', async (t) => {
  try {
    await writeToStore({ bar: 'foo' });
    const result = await ExporterService.save({ foo: 'bar' }, userID, key);
    t.deepEquals(result, { foo: 'bar', bar: 'foo' });
    t.end();
  } catch (e) {
    t.end(e);
  }
});