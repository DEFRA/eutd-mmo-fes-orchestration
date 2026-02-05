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
    
    t.equals(userAttributes.userPrincipal, 'ABC-DEF-GHI', 'User principal match');
    t.equals(userAttributes.attributes.length, 1, 'User attribute retrieved');
    t.equals(userAttributes.attributes[0].name, 'privacy_statement', 'Privacy statement property');
    t.equals(userAttributes.attributes[0].value, true, 'Privacy statement property accepted');
    t.end();
  } catch(e) {
    t.end(e);
  }
});


test('Save or update user attribute: save', async (t) => {
  try {
    const attributeKey = 'non_privacy_statement';
    const savedAttributes = await saveOrUpdate('ABC-DEF-GHI', attributeKey, false);
    t.equals(savedAttributes.length, 2, 'Save user attribute');
    t.equals(savedAttributes[1].name, attributeKey, 'Saved user attribute name');
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('Save or update user attribute: update', async (t) => {
  try {
    const attributeKey = 'non_privacy_statement';
    const savedAttributes = await saveOrUpdate('ABC-DEF-GHI', attributeKey, true);
    t.equals(savedAttributes.length, 2, 'Update user attribute, not added new attribute');
    t.equals(savedAttributes[1].name, attributeKey, 'Updated user attribute value');
    t.equals(savedAttributes[1].value, true, 'Updated user attribute value');
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('teardown', async (t) => {
  console.log('Trying to stop mongo server');
  await mongod.stop();
  console.log('Stopped mongo server');
  t.end();
});