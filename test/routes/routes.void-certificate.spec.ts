import { serverTest } from '../testHelpers';
import {MongoConnection} from "../../src/persistence/mongo";
import MongoMemoryServer from "mongodb-memory-server";
import {baseConfig} from "../../src/persistence/schema/base";

serverTest('[POST] void a certificate', async (server, t) => {
	let mongod = new MongoMemoryServer({
    instance: {
      port: 17017,
      ip: 'localhost',
      dbName: 'sample'
    },
    binary: {
      version: '3.6.3'
    },
    debug: true
  });
  const connString = await mongod.getConnectionString();
  
  await MongoConnection.connect(connString, 'sample', '');
  const catchCertificate = {
    "documentNumber" : "GBR-2019-CC-FC25A01CC",
    "documentUri" : "http://localhost:3001/pdf/export-certificates/Export%20Certificate_1550087885823.pdf?st=2019-02-13T19%3A53%3A06Z&se=2020-02-13T19%3A58%3A06Z&sp=r&sv=2018-03-28&sr=b&sig=z6OJJFbgLA0Bp3%2FsNqz174Ewxq%2B4YbbTZMPwIeEiNpY%3D"
  };
  
  await MongoConnection.insert(baseConfig.collection, catchCertificate);
  
  const response = await server.inject({
    method: 'POST',
    url: '/v1/void-certificate',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      documentVoid: 'Yes',
      documentNumber: 'GBR-2019-CC-FC25A01CC'
    }
  });
  
  t.equals(response.statusCode, 200, 'Status code is 200');

  console.log('Trying to stop mongo server');
  await mongod.stop();
  console.log('Stopped mongo server');
});

serverTest('[POST] attempt to void a certificate should return 400 for invalid input', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/void-certificate',
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {}
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});