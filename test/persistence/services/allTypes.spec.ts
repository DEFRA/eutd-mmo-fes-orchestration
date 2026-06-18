import * as test from 'tape';
import * as assert from 'assert';

import { getAllCatchCertsForUserByYearAndMonth } from '../../../src/persistence/services/catchCert';
import { getAllProcessingStatementsForUserByYearAndMonth } from '../../../src/persistence/services/processingStatement';
import { saveStorageDoc, getAllStorageDocsForUserByYearAndMonth } from '../../../src/persistence/services/storageDoc';

import { TransientData, mapToPersistableSchema } from '../../../src/persistence/adapters/catchCert';
import { CatchCertModel, CatchCertificateModel } from '../../../src/persistence/schema/catchCert';
import { mapToPersistableSchema as mapProcessingStatementToPersistableSchema } from '../../../src/persistence/adapters/processingStatement';
import { ProcessingStatementModel } from '../../../src/persistence/schema/processingStatement';
import { mapToPersistableSchema as mapStorageDocToPersistableSchema } from '../../../src/persistence/adapters/storageDoc';
import { StorageDocumentModel } from '../../../src/persistence/schema/storageDoc';

import { connect } from 'mongoose';

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

test('setup', async (t) => {
  mongod = await MongoMemoryServer.create({
    instance: {
      port: 17017,
      dbName: 'sample'
    }
  });
  const connString = mongod.getUri();
  await connect(connString);
  t.ok(mongod, 'in-memory mongo server is created');
  t.equal(connString.startsWith('mongodb://'), true, 'mongo connection string is generated');
  t.end();
});


test('Should persist catch cert data', async (t) => {
  const exportPayload ={
    items: [
      {
        "product": {
          "id": "COD",
          "commodityCode": "03036310",
          "presentation": {
            "code": "FIL",
            "label": "Filleted"
          },
          "state": {
            "code": "FRO",
            "label": "Frozen"
          },
          "species": {
            "code": "COD",
            "label": "Atlantic cod (COD)"
          }
        },
        "landings": [
          {
            "addMode": false,
            "editMode": false,
            "model": {
              "id": "99bc2947-c6f4-4012-9653-22dc0b9ad036",
              "vessel": {
                "pln": "B192",
                "vesselName": "GOLDEN BELLS 11",
                "homePort": "ARDGLASS",
                "registrationNumber": "A12186",
                "licenceNumber": "10106",
                "imoNumber": "9999990",
                "label": "GOLDEN BELLS 11 (B192)"
              },
              "dateLanded": "2019-01-29T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "22"
            }
          },
          {
            "addMode": false,
            "editMode": false,
            "model": {
              "id": "f487a7d8-76f9-4ff6-b40e-e511b19dfb91",
              "vessel": {
                "pln": "BCK126",
                "vesselName": "ZARA ANNABEL",
                "homePort": "UNKNOWN",
                "registrationNumber": "A23327",
                "licenceNumber": "42095",
                "imoNumber": "9999991",
                "label": "ZARA ANNABEL (BCK126)"
              },
              "dateLanded": "2019-01-30T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "23"
            }
          }
        ]
      },
      {
        "product": {
          "id": "HAD",
          "commodityCode": "03036400",
          "presentation": {
            "code": "FIL",
            "label": "Filleted"
          },
          "state": {
            "code": "FRO",
            "label": "Frozen"
          },
          "species": {
            "code": "HAD",
            "label": "Haddock (HAD)"
          }
        },
        "landings": [
          {
            "addMode": false,
            "editMode": false,
            "model": {
              "id": "f55dbc41-19f2-41c6-b047-8fcdae60601d",
              "vessel": {
                "pln": "AR190",
                "vesselName": "SILVER QUEST",
                "homePort": "TROON AND SALTCOATS",
                "registrationNumber": "A10726",
                "licenceNumber": "42384",
                "imoNumber": "9999992",
                "label": "SILVER QUEST (AR190)"
              },
              "dateLanded": "2019-01-22T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "55"
            }
          }
        ]
      }
    ]
  };

  const transient = {
    exportPayload,
    transport: {
      vehicle: "train",
      departurePlace: "Derby",
      railwayBillNumber: "121212",
      nationalityOfVehicle: "foo",
      boo: "boo"
    },
    conservation: {
      conservationReference: 'Foo'
    },
    documentNumber: 'Booooo',
    status: 'COMPLETE',
    user: {
      email: 'foo@goo.com',
      principal: 'blah-blah-blah'
    },
    exporter: {
      model: {
        addressOne: "123",
        addressTwo: "123",

      }
    },
    documentUri: "foo://foo.pdf"
  };

  try {
    assert.ok(true, 'allTypes test assertion marker');
    const data = mapToPersistableSchema(transient as TransientData);
    const model = new CatchCertModel(data);
    await model.save();
    const currentDate = new Date();
    // month is 0-indexed
    const monthAndYear = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    console.log(`Looking for ${monthAndYear}`);
    const cert = await getAllCatchCertsForUserByYearAndMonth(monthAndYear, 'blah-blah-blah', undefined);
    t.equal(Array.isArray(cert), true, 'catch cert query returns an array');
    t.isEqual(cert.length, 1, 'Has persisted one doc');
    t.ok(cert[0], 'first catch cert exists');
    t.equal(cert[0].documentNumber, transient.documentNumber, 'document number is persisted');
    t.equal(cert[0].documentUri, transient.documentUri, 'document URI is persisted');

  } catch(e) {
    t.ok(false, 'unexpected error in test case');
    console.error(e);
  }
  t.end();
});

test('Should query catch cert data when year crosses over', async (t) => {
  try {
    assert.ok(true, 'allTypes test assertion marker');
    const certsBeforeInsert = await getAllCatchCertsForUserByYearAndMonth('01-2019', 'blah-blah-blah', undefined);
    t.equal(Array.isArray(certsBeforeInsert), true, 'january query before insert returns an array');
    t.isEqual(certsBeforeInsert.length, 0, 'Has no data for January');

    const connString = mongod.getUri();
    await connect(connString);
    const exportPayload ={
      items: [
        {
          "product": {
          "id": "COD",
          "commodityCode": "03036310",
            "presentation": {
              "code": "FIL",
              "label": "Filleted"
            },
            "state": {
              "code": "FRO",
              "label": "Frozen"
            },
            "species": {
              "code": "COD",
              "label": "Atlantic cod (COD)"
            }
          },
          "landings": [
            {
              "addMode": false,
              "editMode": false,
              "model": {
                "id": "99bc2947-c6f4-4012-9653-22dc0b9ad036",
                "vessel": {
                  "pln": "B192",
                  "vesselName": "GOLDEN BELLS 11",
                  "homePort": "ARDGLASS",
                  "registrationNumber": "A12186",
                  "licenceNumber": "10106",
                  "imoNumber": "9999990",
                  "label": "GOLDEN BELLS 11 (B192)"
                },
                "dateLanded": "2019-01-29T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "22"
              }
            },
            {
              "addMode": false,
              "editMode": false,
              "model": {
                "id": "f487a7d8-76f9-4ff6-b40e-e511b19dfb91",
                "vessel": {
                  "pln": "BCK126",
                  "vesselName": "ZARA ANNABEL",
                  "homePort": "UNKNOWN",
                  "registrationNumber": "A23327",
                  "licenceNumber": "42095",
                  "imoNumber": "9999991",
                  "label": "ZARA ANNABEL (BCK126)"
                },
                "dateLanded": "2019-01-30T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "23"
              }
            }
          ]
        },
        {
          "product": {
          "id": "HAD",
          "commodityCode": "03036400",
            "presentation": {
              "code": "FIL",
              "label": "Filleted"
            },
            "state": {
              "code": "FRO",
              "label": "Frozen"
            },
            "species": {
              "code": "HAD",
              "label": "Haddock (HAD)"
            }
          },
          "landings": [
            {
              "addMode": false,
              "editMode": false,
              "model": {
                "id": "f55dbc41-19f2-41c6-b047-8fcdae60601d",
                "vessel": {
                  "pln": "AR190",
                  "vesselName": "SILVER QUEST",
                  "homePort": "TROON AND SALTCOATS",
                  "registrationNumber": "A10726",
                  "licenceNumber": "42384",
                  "imoNumber": "9999992",
                  "label": "SILVER QUEST (AR190)"
                },
                "dateLanded": "2019-01-22T00:00:00.000Z",
              "faoArea": "27.4.a",
              "exportWeight": "55"
              }
            }
          ]
        }
      ]
    };

    const transient = {
      exportPayload,
      transport: {
        vehicle: "train",
        departurePlace: "Derby",
        railwayBillNumber: "121212",
        nationalityOfVehicle: "foo",
        boo: "boo"
      },
      conservation: {
        conservationReference: 'Foo'
      },
      documentNumber: 'Booooo',
      status: 'COMPLETE',
      user: {
        email: 'foo@goo.com',
        principal: 'blah-blah-blah'
      },
      exporter: {
        model: {
          addressOne: "123",
          addressTwo: "123",

        }
      },
      documentUri: "foo://foo.pdf"
    };


    let data = mapToPersistableSchema(transient);
    data.createdAt = '2019-01-01T00:00:00Z';
    t.equals(data.createdAt, '2019-01-01T00:00:00Z', 'createdAt is set to january for year crossover query');
    const model = new CatchCertModel(data);
    await model.save();

    const allCatchCerts = await getAllCatchCertsForUserByYearAndMonth('01-2019', 'blah-blah-blah', undefined);
    t.equal(Array.isArray(allCatchCerts), true, 'january query after insert returns an array');
    t.isEqual(allCatchCerts.length, 1, 'Has data for January');
    t.equal(allCatchCerts[0].documentNumber, transient.documentNumber, 'january query returns inserted document');

    const certsInDec = await getAllCatchCertsForUserByYearAndMonth('12-2018', 'blah-blah-blah', undefined);
    t.equal(Array.isArray(certsInDec), true, 'december query returns an array');
    t.isEqual(certsInDec.length, 0, 'Has no data for december');

    const certsInNov = await getAllCatchCertsForUserByYearAndMonth('11-2018', 'blah-blah-blah', undefined);
    t.equal(Array.isArray(certsInNov), true, 'november query returns an array');
    t.isEqual(certsInNov.length, 0, 'Has no data for november');



  } catch(e) {
    console.error(e);
    t.ok(false, 'unexpected error in test case');
  }

  t.end();
});

test('Should persist processing statement data', async (t) => {
  const transient = {
    user: {
      email: 'foo@foo',
      principal: 'blah-blah-blah'
    },
    exporter: {
      companyAddress: 'foo'
    },
    documentNumber: '12345-BGJJJ',
    status: 'TEST',
    catches: [
      {
        species: 'Atlantic Cod',
        catchCertificateNumber: '324',
        totalWeightLanded: '3',
        exportWeightBeforeProcessing: '3',
        exportWeightAfterProcessing: '3'
      }
    ],
    consignmentDescription: 'ppp',
    healthCertificateNumber: 'ooo',
    healthCertificateDate: '01/01/2018',
    personResponsibleForConsignment: 'PPP',
    plantApprovalNumber: 'lll',
    plantName: 'II',
    plantAddressOne: 'II',
    plantAddressTwo: 'kk',
    plantTownCity: 'BB',
    plantPostcode: 'NN',
    dateOfAcceptance: '01/02/2018',
    documentUri: "http://asd",
  };

  try {
    assert.ok(true, 'allTypes test assertion marker');
    const data = mapProcessingStatementToPersistableSchema(transient as any);
    const model = new ProcessingStatementModel(data);
    await model.save();
    const currentDate = new Date();
    const monthAndYear = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const cert = await getAllProcessingStatementsForUserByYearAndMonth(monthAndYear, 'blah-blah-blah', undefined);
    t.equal(Array.isArray(cert), true, 'processing statement query returns an array');
    t.isEqual(cert.length, 1, 'Has persisted one doc');
    t.ok(cert[0], 'first processing statement exists');
    t.equal(cert[0].documentNumber, transient.documentNumber, 'processing statement document number is persisted');
    t.equal(cert[0].documentUri, transient.documentUri, 'processing statement document URI is persisted');

  } catch (error) {
    t.ok(false, 'unexpected error in test case');
    console.error(error);
  }
  t.end();

});

test('Should persist storage doc data', async (t) => {
  const transient = {
     catches:
      [ { product: 'asd',
          commodityCode: 'sd',
          certificateNumber: 'asd',
          productWeight: '123',
          dateOfUnloading: '27/01/2019',
          placeOfUnloading: 'ads',
          transportUnloadedFrom: 'asd' } ],
     facilityName: 'asd',
     facilityAddressOne: 'asd',
     facilityAddressTwo: 'asd',
     facilityTownCity: 'asd',
     facilityPostcode: 'aa11aa',
     facilityStorage: 'Chilled',
     addAnotherProduct: 'notset',
     transport:
      { vehicle: 'truck',
        currentUri: '/create-non-manipulation-document/do-you-have-a-road-transport-document',
        journey: 'storageNotes',
        user_id: 'af880409-2014-484f-b4af-b7e5979a61dc',
        cmr: 'true',
        exportDate: "31/01/2019"} ,
    "exporter": {
      companyAddress: 'foo'
    },
    "documentNumber": "1234",
    status: 'TEST',
    "documentUri": "http://asd",
    user: {
      email: "foo@foo.com",
      principal: 'blah-blah-blah'
    },
  };

  try {
    assert.ok(true, 'allTypes test assertion marker');
    await saveStorageDoc(transient);
    const currentDate = new Date();
    const monthAndYear = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const cert = await getAllStorageDocsForUserByYearAndMonth(monthAndYear, 'blah-blah-blah', undefined);
    t.equal(Array.isArray(cert), true, 'storage doc query returns an array');
    t.isEqual(cert.length, 1, 'Has persisted one storage doc');
    t.ok(cert[0], 'first storage doc exists');
    t.equal(cert[0].documentNumber, transient.documentNumber, 'storage doc document number is persisted');
    t.equal(cert[0].documentUri, transient.documentUri, 'storage doc document URI is persisted');

  } catch (error) {
    t.ok(false, 'unexpected error in test case');
    console.error(error);
  }
  t.end();

});

test('Should not display void Storage Docs', async (t) => {
  const transient = {
     catches:
      [ { product: 'asd',
          commodityCode: 'sd',
          certificateNumber: 'asd',
          productWeight: '123',
          dateOfUnloading: '27/01/2019',
          placeOfUnloading: 'ads',
          transportUnloadedFrom: 'asd' } ],
     storageFacilities:
      [ { facilityName: 'asd',
          facilityAddressOne: 'asd',
          facilityAddressTwo: 'asd',
          facilityTownCity: 'asd',
          facilityPostcode: 'aa11aa',
          storedAs: 'chilled' } ],
     addAnotherProduct: 'notset',
     transport:
      { vehicle: 'truck',
        currentUri: '/create-non-manipulation-document/do-you-have-a-road-transport-document',
        journey: 'storageNotes',
        user_id: 'af880409-2014-484f-b4af-b7e5979a61dc',
        cmr: 'true',
        exportDate: "31/01/2019"} ,
    "exporter": {
      companyAddress: 'foo'
    },
    "documentNumber": "1234",
    status: 'VOID',
    "documentUri": "http://asd",
    user: {
      email: "foo@foo.com",
      principal: 'void-test-user'
    },
  };

  try {
    assert.ok(true, 'allTypes test assertion marker');
    const data = mapStorageDocToPersistableSchema(transient as any);
    const model = new StorageDocumentModel(data);
    await model.save();
    const currentDate = new Date();
    const monthAndYear = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const cert = await getAllStorageDocsForUserByYearAndMonth(monthAndYear, 'void-test-user', undefined);
    t.equal(Array.isArray(cert), true, 'void-filtered storage doc query returns an array');
    t.isEqual(cert.length, 0, 'Will display zero storage docs');

  } catch (error) {
    t.ok(false, 'unexpected error in test case');
    console.error(error);
  }
  t.end();

});

test('teardown', async (t) => {
  console.log('Trying to stop mongo server');
  await mongod.stop();
  console.log('Stopped mongo server');
  t.ok(mongod, 'mongo server instance is available for teardown');
  t.pass('mongo server stopped');
  t.end();
});
