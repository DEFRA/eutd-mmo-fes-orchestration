import * as test from 'tape';

import { connect } from 'mongoose';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { save, find, saveOrUpdate } from '../../../src/persistence/services/userAttributes';
import { IUserAttributes } from '../../../src/persistence/schema/userAttributes';

let mongod: MongoMemoryServer;

test('setup', async (t) => {
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'sample'
    }
  });
  const connString = mongod.getUri();
  await connect(connString);
  t.ok(mongod, 'in-memory mongo server is created');
  t.equal(connString.startsWith('mongodb://'), true, 'mongo connection string is generated');
  t.end();
});

test('Set user attribute', async(t) => {
  try {
    const data = {
      userPrincipal: 'ABC-DEF-GHI',
      attributes: [
        {
          name: 'privacy_statement',
          value: true,
          modifiedAt: '2019-02-26T23:54:00Z'
        }
      ]
    } as IUserAttributes;
    await save(data);
    const userAttributes = await find('ABC-DEF-GHI');
    console.log(userAttributes.attributes);
    t.ok(userAttributes, 'user attributes are found after save');
    t.equals(userAttributes.userPrincipal, 'ABC-DEF-GHI', 'User principal match');
    t.equals(userAttributes.attributes.length, 1, 'User attribute retrieved');
    t.equals(userAttributes.attributes[0].name, 'privacy_statement', 'Privacy statement property');
    t.equals(userAttributes.attributes[0].value, true, 'Privacy statement property accepted');
    t.equal(new Date(userAttributes.attributes[0].modifiedAt).toISOString(), '2019-02-26T23:54:00.000Z', 'Privacy statement modifiedAt persisted');
    const selectedOnly = await find('ABC-DEF-GHI', ['userPrincipal']);
    t.equals(selectedOnly.userPrincipal, 'ABC-DEF-GHI', 'Projected query keeps user principal');
    t.equals((selectedOnly as any).attributes, undefined, 'Projected query omits attributes collection');
    t.end();
  } catch(e) {
    t.end(e);
  }
});


test('Save or update user attribute: save', async (t) => {
  try {
    const attributeKey = 'non_privacy_statement';
    const savedAttributes = await saveOrUpdate('ABC-DEF-GHI', attributeKey, false);
    const savedModifiedAt = savedAttributes[1].modifiedAt;
    t.equals(savedAttributes.length, 2, 'Save user attribute');
    t.equals(savedAttributes[1].name, attributeKey, 'Saved user attribute name');
    t.equals(savedAttributes[1].value, false, 'Saved user attribute value');
    t.equal(typeof savedModifiedAt, 'string', 'Saved user attribute has modifiedAt string');
    t.equal(Number.isNaN(Date.parse(savedModifiedAt)), false, 'Saved user attribute modifiedAt is a valid date');

    const userAttributes = await find('ABC-DEF-GHI');
    t.equals(userAttributes.attributes.length, 2, 'Saved attribute is persisted');
    t.equals(userAttributes.attributes[1].name, attributeKey, 'Persisted attribute has expected name');
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('Save or update user attribute: update', async (t) => {
  try {
    const attributeKey = 'non_privacy_statement';
    const beforeUpdate = await find('ABC-DEF-GHI');
    const beforeModifiedAt = beforeUpdate.attributes.find((attr) => attr.name === attributeKey)?.modifiedAt;

    const savedAttributes = await saveOrUpdate('ABC-DEF-GHI', attributeKey, true);
    t.equals(savedAttributes.length, 2, 'Update user attribute, not added new attribute');
    t.equals(savedAttributes[1].name, attributeKey, 'Updated user attribute value');
    t.equals(savedAttributes[1].value, true, 'Updated user attribute value');
    t.notEqual(savedAttributes[1].modifiedAt, beforeModifiedAt, 'Updated attribute modifiedAt is refreshed');

    const persistedAfterUpdate = await find('ABC-DEF-GHI');
    const updatedAttribute = persistedAfterUpdate.attributes.find((attr) => attr.name === attributeKey);
    t.ok(updatedAttribute, 'Updated attribute exists in persisted data');
    t.equals(updatedAttribute.value, true, 'Persisted updated attribute value is true');
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('teardown', async (t) => {
  console.log('Trying to stop mongo server');
  await mongod.stop();
  console.log('Stopped mongo server');
  t.ok(mongod, 'mongo server instance is available for teardown');
  t.pass('mongo server stopped');
  t.end();
});