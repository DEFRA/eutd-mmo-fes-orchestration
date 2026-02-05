import { v4 as uuidv4 } from  'uuid';

import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { sortBy } from 'lodash';

import * as Service from './foreignCatchCert';
import { IForeignCatchCert } from '../schema/foreignCatchCert';
import { StorageDocumentModel } from '../schema/storageDoc';
import { ProcessingStatementModel } from '../schema/processingStatement';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri).catch(err => {console.log(err)});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const createDocument = (documentNumber, catches) =>
  ({
    documentUri: 'http://www.bob.com',
		exportData: {
			catches
		},
		createdByEmail: 'bob@bob.com',
		createdBy: 'bob',
		createdAt: new Date(),
    documentNumber,
    status: 'COMPLETE',
	});



describe('data driven', () => {

  // use the test.each to run the same test logic on multiple sets of data

  test.each(
    [
      [ 'basic test',
        // documents
        [
          {
            type: 'SD',
            documentNumber: '12345',
            status: 'COMPLETE',
            catches: [
              {certificateNumber: 'FCC051', product: 'cats', weightOnCC: 500, productWeight: 500}]
          }
        ],
        // expected
        {
          'FCC051': [
            {
              species: 'cats', totalWeight: 500, allocatedWeight: 500, createdByDocument: '12345',
            },
          ]
        }
      ],

      [ 'SD and PS',
        // documents
        [
          {
            type: 'SD',
            documentNumber: '52345',
            status:'COMPLETE',
            catches: [
              {certificateNumber: 'FCC061', product: 'cats', weightOnCC: 500, productWeight: 400}]
          },
          {
            type: 'PS',
            documentNumber: '52346',
            status:'COMPLETE',
            catches: [
              { catchCertificateNumber: 'FCC061', species: 'cats', totalWeightLanded: 500, exportWeightBeforeProcessing: 100}
            ]},
        ],
        // expected
        {
          'FCC061': [
            { species: 'cats', totalWeight: 500, allocatedWeight: 500, createdByDocument: '52345' },
          ]
        }
      ],

      [ 'SD and PS multiple catches',
        // documents
        [
          {
            type: 'SD',
            documentNumber: '62345',
            status:'COMPLETE',
            catches: [
              {certificateNumber: 'FCC071', product: 'cats', weightOnCC: 500, productWeight: 400},
              {certificateNumber: 'FCC071', product: 'dogs', weightOnCC: 500, productWeight: 400}
            ]
          },
          {
            type: 'SD',
            documentNumber: '62346',
            status:'COMPLETE',
            catches: [
              {certificateNumber: 'FCC071', product: 'cats', weightOnCC: 100, productWeight: 200},
              {certificateNumber: 'FCC071', product: 'dogs', weightOnCC: 100, productWeight: 200},
              {certificateNumber: 'FCC071', product: 'monkeys', weightOnCC: 100, productWeight: 200},
            ]
          },
          {
            type: 'PS',
            documentNumber: '62347',
            status:'COMPLETE',
            catches: [
              {catchCertificateNumber: 'FCC071', species: 'cats', totalWeightLanded: 200, exportWeightBeforeProcessing: 300},
              {catchCertificateNumber: 'FCC081', species: 'cats', totalWeightLanded: 1000, exportWeightBeforeProcessing: 300},
            ]},
        ],
        // expected
        {
          'FCC071': [
            { species: 'cats', totalWeight: 500, allocatedWeight: 900, createdByDocument: '62345' },
            { species: 'dogs', totalWeight: 500, allocatedWeight: 600, createdByDocument: '62345' },
            { species: 'monkeys', totalWeight: 100, allocatedWeight: 200, createdByDocument: '62346' },
          ],
          'FCC081': [
            { species: 'cats', totalWeight: 1000, allocatedWeight: 300, createdByDocument: '62347' },
          ],
        }
      ],

    ])(
    'generate correct foreign catch certificates from input: %s',
    async (name, documents: any[], expectedItems: any) => {

      for (const { type, documentNumber, catches } of documents) {
        if (type == 'SD') {
          const model = new StorageDocumentModel(createDocument(documentNumber, catches));
          await model.save();
        }
        if (type == 'PS') {
          const model = new ProcessingStatementModel(createDocument(documentNumber, catches));
          await model.save();
        }
      }

      const fccNumbers = Object.keys(expectedItems);

      const res: IForeignCatchCert[] = await Service.getWeightTotalsByCatchCert(fccNumbers);

      fccNumbers.forEach( (fccNumber) => {

        const fcc = res.find( _ => _.certificateNumber == fccNumber)

        expect(fcc.certificateNumber).toBe(fccNumber);

        expect(sortBy(fcc.items, item => item.species))
          .toEqual(sortBy(expectedItems[fccNumber], item => item.species));

      });

  });

});


it('should handle legacy data (storage documents without weightOnCC attribute)', async () => {
  // Orignally Storage Documents only had one field for weight
  // Any legacy data in mongo can be ignored.  However it should be handled gracefully
  const documents = [
    {
      type: 'SD',
      documentNumber: uuidv4(),
      catches: [
        {certificateNumber: 'FCC031', product: 'cats', productWeight: 100},
    ]}
  ]

  const expectedItems = {
    'FCC031': [
      {
        species: 'cats',
        totalWeight: 0,
        allocatedWeight: 100,
        createdByDocument: documents[0].documentNumber
      },
    ]
  };

  for (const {type, documentNumber, catches} of documents) {
    if (type == 'SD') {
      const model = new StorageDocumentModel(createDocument(documentNumber, catches));
      await model.save();
    }
    if (type == 'PS') {
      const model = new ProcessingStatementModel(createDocument(documentNumber, catches));
      await model.save();
    }
  }

	const res: IForeignCatchCert[] = await Service.getWeightTotalsByCatchCert(['FCC031']);

  const fcc = res.find( _ => _.certificateNumber == 'FCC031')

  expect(fcc.certificateNumber).toBe('FCC031');

  expect(sortBy(fcc.items, item => item.species))
    .toEqual(sortBy(expectedItems.FCC031, item => item.species));

});

it('should return empty array in edge cases', async () => {

  const weightTotal1: IForeignCatchCert[] = await Service.getWeightTotalsByCatchCert([]);

  expect(weightTotal1).toEqual([]);

  const weightTotal2: IForeignCatchCert[] = await Service.getWeightTotalsByCatchCert(['abc']);

  expect(weightTotal2).toEqual([]);
});

