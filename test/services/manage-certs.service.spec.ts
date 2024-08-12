import ManageCertsService from '../../src/services/manage-certs.service';
import * as test from 'tape';
import logger from '../../src/logger';
import MongoMemoryServer from "mongodb-memory-server";
import {MongoConnection} from "../../src/persistence/mongo";
import {baseConfig} from "../../src/persistence/schema/base";

let mongod;

test('setup', async (t) => {
  mongod = new MongoMemoryServer({
    instance: {
      port: 17017,
      ip: 'localhost',
      dbName: 'sample'
    },
    binary: {
      // This is the most recent version supported
      version: '3.6.3'
    },
    debug: true
  });
  const connString = await mongod.getConnectionString();

  await MongoConnection.connect(connString, 'sample', '');
  t.end();
});

test('Void certificate not allowed for another user', async (t) => {
  try {
    const currentUserId = "12345677";
    const badUser = "1111";
    const catchCertificate = {
      "createdBy" : "12345677",
      "documentNumber" : "GBR-2019-CC-FC25A01CC",
      "documentUri" : "http://localhost:3001/pdf/export-certificates/Export%20Certificate_1550087885823.pdf?st=2019-02-13T19%3A53%3A06Z&se=2020-02-13T19%3A58%3A06Z&sp=r&sv=2018-03-28&sr=b&sig=z6OJJFbgLA0Bp3%2FsNqz174Ewxq%2B4YbbTZMPwIeEiNpY%3D"
    };
    await MongoConnection.insert(baseConfig.collection, catchCertificate);
    let persistedCatchCert = await MongoConnection.findOne(baseConfig.collection, catchCertificate);
    t.equals(!!persistedCatchCert, true);

    const voidResult = await ManageCertsService.voidCertificate(catchCertificate.documentNumber, badUser);

    t.equals(voidResult, false);
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('Void certificate not allowed for another document of another user', async (t) => {
  try {
    const currentUserId = "12345677";
    const catchCertificate = {
      "createdBy" : "12345677",
      "documentNumber" : "GBR-2019-CC-FC25A01CC",
      "documentUri" : "http://localhost:3001/pdf/export-certificates/Export%20Certificate_1550087885823.pdf?st=2019-02-13T19%3A53%3A06Z&se=2020-02-13T19%3A58%3A06Z&sp=r&sv=2018-03-28&sr=b&sig=z6OJJFbgLA0Bp3%2FsNqz174Ewxq%2B4YbbTZMPwIeEiNpY%3D"
    };

    const badCertificate = {
      "createdBy" : "001",
      "documentNumber" : "GBR-2019-CC-FC25A01AA",
      "documentUri" : "http://localhost:3001/pdf/export-certificates/Export%20Certificate_1550087885823.pdf?st=2019-02-13T19%3A53%3A06Z&se=2020-02-13T19%3A58%3A06Z&sp=r&sv=2018-03-28&sr=b&sig=z6OJJFbgLA0Bp3%2FsNqz174Ewxq%2B4YbbTZMPwIeEiNpY%3D"
    };
    await MongoConnection.insert(baseConfig.collection, catchCertificate);
    let persistedCatchCert = await MongoConnection.findOne(baseConfig.collection, catchCertificate);
    t.equals(!!persistedCatchCert, true);


    const voidResult = await ManageCertsService.voidCertificate(badCertificate.documentNumber, currentUserId);

    t.equals(voidResult, false);
    t.end();
  } catch(e) {
    t.end(e);
  }
});

test('Void certificate of document created by same user', async (t) => {
  try {
    const currentUserId = "12345677";
    const catchCertificate = {
      "createdBy" : "12345677",
      "documentNumber" : "GBR-2019-CC-FC25A01CC",
      "documentUri" : "http://localhost:3001/pdf/export-certificates/Export%20Certificate_1550087885823.pdf?st=2019-02-13T19%3A53%3A06Z&se=2020-02-13T19%3A58%3A06Z&sp=r&sv=2018-03-28&sr=b&sig=z6OJJFbgLA0Bp3%2FsNqz174Ewxq%2B4YbbTZMPwIeEiNpY%3D"
    };
    await MongoConnection.insert(baseConfig.collection, catchCertificate);
    let persistedCatchCert = await MongoConnection.findOne(baseConfig.collection, catchCertificate);
    t.equals(!!persistedCatchCert, true);

    const voidResult = await ManageCertsService.voidCertificate(catchCertificate.documentNumber, currentUserId);

    t.equals(voidResult, true);
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
