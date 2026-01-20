import * as test from 'tape';

import { saveCatchCert, getAllCatchCertsForUserByYearAndMonth } from '../../../src/persistence/services/catchCert';
import { saveProcessingStatement, getAllProcessingStatementsForUserByYearAndMonth } from '../../../src/persistence/services/processingStatement';
import { saveStorageDoc, getAllStorageDocsForUserByYearAndMonth } from '../../../src/persistence/services/storageDoc';

import { TransientData, mapToPersistableSchema } from '../../../src/persistence/adapters/catchCert';
import { CatchCertModel, CatchCertificateModel } from '../../../src/persistence/schema/catchCert';

import { connect } from 'mongoose';

import MongoMemoryServer from 'mongodb-memory-server';

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
  await connect(connString);
  t.end();
});


test('Should persist catch cert data', async (t) => {
  const exportPayload ={
    items: [
      {
        "product": {
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
              "exportWeight": "23"
            }
          }
        ]
      },
      {
        "product": {
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
    status: 'TEST',
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
    await saveCatchCert(transient);
    const currentDate = new Date();
    // month is 0-indexed
    const monthAndYear = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    console.log(`Looking for ${monthAndYear}`);
    const cert = await getAllCatchCertsForUserByYearAndMonth(monthAndYear, 'blah-blah-blah');
    t.isEqual(cert.length, 1, 'Has persisted one doc');

  } catch(e) {
    console.error(e);
  }
  t.end();
});

test('Should query catch cert data when year crosses over', async t => {
  try {
    const certsBeforeInsert = await getAllCatchCertsForUserByYearAndMonth('01-2019', 'blah-blah-blah');
    t.isEqual(certsBeforeInsert.length, 0, 'Has no data for January');

    const connString = await mongod.getConnectionString();
    await connect(connString);
    const exportPayload ={
      items: [
        {
          "product": {
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
                "exportWeight": "23"
              }
            }
          ]
        },
        {
          "product": {
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
      status: 'TEST',
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
    const model = new CatchCertModel(data);
    await model.save();

    const allCatchCerts = await getAllCatchCertsForUserByYearAndMonth('01-2019', 'blah-blah-blah');
    t.isEqual(allCatchCerts.length, 1, 'Has data for January');

    const certsInDec = await getAllCatchCertsForUserByYearAndMonth('12-2018', 'blah-blah-blah');
    t.isEqual(certsInDec.length, 0, 'Has no data for december');

    const certsInNov = await getAllCatchCertsForUserByYearAndMonth('11-2018', 'blah-blah-blah');
    t.isEqual(certsInNov.length, 0, 'Has no data for november');



  } catch(e) {
    console.error(e);
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
    await saveProcessingStatement(transient);
    const cert = await getAllProcessingStatementsForUserByYearAndMonth('blah-blah-blah');
    t.isEqual(cert.length, 1, 'Has persisted one doc');

  } catch (error) {
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
    await saveStorageDoc(transient);
    const cert = await getAllStorageDocsForUserByYearAndMonth('blah-blah-blah');
    t.isEqual(cert.length, 1, 'Has persisted one storage doc');

  } catch (error) {
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
      principal: 'blah-blah-blah'
    },
  };

  try {
    await saveStorageDoc(transient);
    const cert = await getAllStorageDocsForUserByYearAndMonth('blah-blah-blah');
    t.isEqual(cert.length, 0, 'Will display zero storage docs');

  } catch (error) {
    console.error(error);
  }
  t.end();

});

test('teardown', async (t) => {
  console.log('Trying to stop mongo server');
  await mongod.stop();
  console.log('Stopped mongo server');
  t.end();
});
