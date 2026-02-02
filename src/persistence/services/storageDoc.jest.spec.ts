import * as mongoose from 'mongoose';
import * as StorageDocumentService from "./storageDoc";
import * as FrontEndExporterSchema from "../schema/frontEndModels/exporterDetails";
import * as FrontEndTransportSchema from '../schema/frontEndModels/transport';
import { StorageDocument, ExportData } from "../schema/storageDoc";
import { MongoMemoryServer } from "mongodb-memory-server";
import { StorageDocumentModel } from "../schema/storageDoc";
import DocumentNumberService from '../../services/documentNumber.service';
import ManageCertsService from '../../services/manage-certs.service';
import * as ReferenceDataService from '../../services/reference-data.service';
import ApplicationConfig from '../../applicationConfig';

let mongoServer: MongoMemoryServer;
const defaultUserReference = 'User Reference';
const defaultUser = 'Bob';
const defaultContact = 'contactBob';

beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();
  await mongoose.connect(mongoUri).catch(err => { console.log(err) });
});

afterEach(async () => {
  await StorageDocumentModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('getDocument', () => {

  it('will return a document if a match exists', async () => {
    await createDocument('Bob', 'COMPLETE', 'doc1');

    const result = await StorageDocumentService.getDocument('doc1', 'Bob', 'contactBob');

    expect(result.documentNumber).toBe('doc1');
  });

  it('will return null if no document can be found', async () => {
    const result = await StorageDocumentService.getDocument('doc1', 'Bob', 'contactBob');

    expect(result).toBeNull();
  });

});

describe('getDraft', () => {
  it('should return draft data if it exists with a document number', async () => {
    await new StorageDocumentModel(createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        addressTwo: 'Street',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    }, 'GBR-34344-3444-344')).save();

    const result: any = await StorageDocumentService.getDraft('Bob', 'GBR-34344-3444-344', 'contactBob');

    expect(result.exportData.transportation.vehicle).toEqual('plane')
  });
});

describe('createDraft', () => {
  it('will create a new draft in the system', async () => {
    await StorageDocumentService.createDraft('Bob', 'bob@test.com', true, 'contactBob');

    const result = await StorageDocumentModel.find({ createdBy: 'Bob', createdByEmail: 'bob@test.com', status: 'DRAFT' });

    expect(result.length).toBe(1);
  });
});

describe('getDraftData', () => {

  it('should get draft data if it exists', async () => {
    await new StorageDocumentModel({
      documentNumber: 'test',
      status: 'DRAFT',
      createdAt: new Date(2020, 1, 20),
      createdBy: 'Bob',
      draftData: {
        name: 'Bob'
      }
    }).save();

    const result = await StorageDocumentService.getDraftData('Bob', 'name', 'unknown', 'contactBob');

    expect(result).toStrictEqual('Bob');
  });

  it('should return the default value if the draft does not contain the specified path', async () => {
    const defaultValue = 0

    await new StorageDocumentModel({
      documentNumber: 'test',
      status: 'DRAFT',
      createdAt: new Date(2020, 1, 20),
      createdBy: 'Bob',
      draftData: {
        name: 'Bob'
      }
    }).save();

    const result = await StorageDocumentService.getDraftData('Bob', 'age', 'contactBob', defaultValue);

    expect(result).toStrictEqual(defaultValue);
  });

  it('should return the default value if no drafts exist', async () => {
    const defaultValue = 'unknown'
    const result = await StorageDocumentService.getDraftData('Bob', 'name', 'contactBob', defaultValue);

    expect(result).toStrictEqual(defaultValue);
  });

  it('should return a default value of {} if one is not specified', async () => {
    const result = await StorageDocumentService.getDraftData('Bob', 'name', 'contactBob', undefined);

    expect(result).toStrictEqual({});
  });

});

describe('upsertDraftDataForStorageDocuments', () => {

  const testUser = 'Bob'
  const testContact = 'contactBob';
  const year = new Date().getFullYear();
  const path = "path";
  const payload = { "data": "test" };

  describe('if no drafts already exist', () => {

    it('should create a new draft document if no path or payload are provided', async () => {
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact);

      const result = await StorageDocumentModel.find({ createdBy: testUser, status: 'DRAFT' });

      expect(result.length).toBe(1);

      const draft = result[0];

      expect(draft.draftData).toStrictEqual({});
      expect(draft.createdBy).toStrictEqual(testUser);
      expect(draft.documentNumber).toMatch(new RegExp(`^GBR-${year}-SD-[A-Z0-9]{9}$`));
    });

    it('should create and populate a new draft document if a path and payload are provided', async () => {
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, path, payload);

      const result = await StorageDocumentModel.find({ createdBy: testUser, status: 'DRAFT' });

      expect(result.length).toBe(1);

      const draft = result[0];

      expect(draft.draftData).toStrictEqual({ path: payload });
      expect(draft.createdBy).toStrictEqual(testUser);
      expect(draft.documentNumber).toMatch(new RegExp(`^GBR-${year}-SD-[A-Z0-9]{9}$`));
    });

  });

  describe('if a draft already exists', () => {

    it('should be able to add to the draft data', async () => {
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, 'test-1', { item: 'test 1' });
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, 'test-2', { item: 'test 2' });

      const result = await StorageDocumentModel.find({ createdBy: testUser, status: 'DRAFT' });

      expect(result.length).toBe(1);
      expect(result[0].draftData).toStrictEqual({
        'test-1': { item: 'test 1' },
        'test-2': { item: 'test 2' }
      });
    });

    it('should be able to overwrite the draft data', async () => {
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, path, { item: 'test 1' });
      await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, path, { item: 'test 2' });

      const result = await StorageDocumentModel.find({ createdBy: testUser, status: 'DRAFT' });

      expect(result.length).toBe(1);
      expect(result[0].draftData).toStrictEqual({
        path: { item: 'test 2' }
      });
    });

  });

  it('should throw an error if a payload is present but no path', async () => {
    await expect(StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, null, payload))
      .rejects
      .toThrow('[SD][upsertDraftDataForStorageDocuments][INVALID-ARGUMENTS]');
  });

  it('should not throw an error if a path is present but no payload', async () => {
    await expect(StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, path))
      .resolves
      .toBeUndefined();
  });

  it('should omit any undefined values', async () => {
    await StorageDocumentService.upsertDraftDataForStorageDocuments(testUser, testContact, path, { item: 'test 2', ok: undefined });

    const result = await StorageDocumentModel.findOne({ createdBy: testUser, status: 'DRAFT' });

    expect(result.draftData).toStrictEqual({
      path: { item: 'test 2' }
    });
  });

});

describe('getDraftDocumentHeaders', () => {
  const testUser = 'Bob';
  const testContact = 'contactBob';

  it('should return a draft if one is present', async () => {
    await createDocument('Bob');

    const result = await StorageDocumentService.getDraftDocumentHeaders(testUser, testContact);

    expect(result).toStrictEqual([
      {
        'documentNumber': 'test',
        'status': 'DRAFT',
        'startedAt': '20 Jan 2020',
        'userReference': 'User Reference'
      }]);
  });

  it('should return null if no drafts are present', async () => {
    await createDocument('Bob', 'COMPLETE');

    const result = await StorageDocumentService.getDraftDocumentHeaders(testUser, testContact);

    expect(result).toEqual([])
  });

  it('should return only drafts for the specified user', async () => {
    await createDocument('Bob', 'COMPLETE', 'test 1');
    await createDocument('Bob', 'DRAFT', 'test 2');
    await createDocument('Juan', 'DRAFT', 'test 3');
    await createDocument('Chris', 'DRAFT', 'test 4');

    const result = await StorageDocumentService.getDraftDocumentHeaders('Bob', testContact);

    expect(result).toStrictEqual([
      {
        'documentNumber': 'test 2',
        'status': 'DRAFT',
        'startedAt': '20 Jan 2020',
        'userReference': 'User Reference'
      }]);
  });

  it('should return all drafts for the specified user', async () => {
    await createDocument('Bob', 'COMPLETE', 'test 1');
    await createDocument('Bob', 'DRAFT', 'test 2');
    await createDocument('Bob', 'DRAFT', 'test 3');
    await createDocument('Bob', 'DRAFT', 'test 4');

    const result = await StorageDocumentService.getDraftDocumentHeaders('Bob', testContact);

    expect(result).toStrictEqual([
      {
        'documentNumber': 'test 2',
        'status': 'DRAFT',
        'startedAt': '20 Jan 2020',
        'userReference': 'User Reference'
      },
      {
        'documentNumber': 'test 3',
        'status': 'DRAFT',
        'startedAt': '20 Jan 2020',
        'userReference': 'User Reference'
      },
      {
        'documentNumber': 'test 4',
        'status': 'DRAFT',
        'startedAt': '20 Jan 2020',
        'userReference': 'User Reference'
      }]);
  });

  it('should return all DRAFTS for a user with the correct user reference', async () => {
    await createDocument('Foo', 'DRAFT', 'test1', new Date(2020, 0, 27), 'User Reference 1');
    await createDocument('Foo', 'DRAFT', 'test2', new Date(2020, 0, 27), 'User Reference 2');
    await createDocument('Foo', 'DRAFT', 'test3', new Date(2020, 0, 27), 'User Reference 3');
    await createDocument('Foo', 'DRAFT', 'test4', new Date(2020, 0, 27), 'User Reference 4');

    const expected = [{
      "documentNumber": "test1",
      "status": "DRAFT",
      "startedAt": "27 Jan 2020",
      "userReference": 'User Reference 1'
    },
    {
      "documentNumber": "test2",
      "status": "DRAFT",
      "startedAt": "27 Jan 2020",
      "userReference": 'User Reference 2'
    },
    {
      "documentNumber": "test3",
      "status": "DRAFT",
      "startedAt": "27 Jan 2020",
      "userReference": 'User Reference 3'
    },
    {
      "documentNumber": "test4",
      "status": "DRAFT",
      "startedAt": "27 Jan 2020",
      "userReference": 'User Reference 4'
    }];

    const result = await StorageDocumentService.getDraftDocumentHeaders('Foo', testContact);

    expect(result).toStrictEqual(expected);
  });

  it('should return drafts in createdAt descending order', async () => {
    await createDocument(testUser, 'DRAFT', 'doc1', new Date('2020-01-01'));
    await createDocument(testUser, 'DRAFT', 'doc3', new Date('2020-01-03'));
    await createDocument(testUser, 'DRAFT', 'doc2', new Date('2020-01-02'));

    const result = await StorageDocumentService.getDraftDocumentHeaders(testUser, testContact);

    expect(result).toHaveLength(3);
    expect(result[0].documentNumber).toBe('doc3');
    expect(result[1].documentNumber).toBe('doc2');
    expect(result[2].documentNumber).toBe('doc1');
  });
});

describe('getAllStorageDocsForUserByYearAndMonth', () => {
  const testContact = 'contactBob';

  it('should return documents for the given user, year, and month', async () => {
    await Promise.all([
      createDocument('Jim', 'COMPLETED', 'test 1'),
      createDocument('Bob', 'COMPLETED', 'test 2'),
      createDocument('Bob', 'COMPLETED', 'test 3'),
      createDocument('Bob', 'COMPLETED', 'test 4', new Date(2019, 0, 20)),
    ]);

    const all = await StorageDocumentService.getAllStorageDocsForUserByYearAndMonth('01-2020', 'Bob', testContact);
    const documentNumbers = all.map(sd => sd.documentNumber);

    expect(all.length).toBe(2);
    expect(documentNumbers).toContain('test 2');
    expect(documentNumbers).toContain('test 3');
  });

  it('should not return draft or void documents', async () => {
    await Promise.all([
      createDocument('Bob', 'COMPLETED', 'test 1'),
      createDocument('Bob', 'COMPLETED', 'test 2'),
      createDocument('Bob', 'DRAFT', 'test 3'),
      createDocument('Bob', 'VOID', 'test 4')
    ]);

    const all = await StorageDocumentService.getAllStorageDocsForUserByYearAndMonth('01-2020', 'Bob', testContact);
    const documentNumbers = all.map(sd => sd.documentNumber);

    expect(all.length).toBe(2);
    expect(documentNumbers).toContain('test 1');
    expect(documentNumbers).toContain('test 2');
  });

  it('should return all completed storage documents within the specified month and year with user references', async () => {
    await createDocument('Bob', 'DRAFT', 'test 1', new Date(2020, 0, 20), 'User Reference 1');
    await createDocument('Bob', 'VOID', 'test 3', new Date(2020, 1, 20), 'User Reference 2');
    await createDocument('Bob', 'COMPLETE', 'test 2', new Date(2020, 0, 20), 'User Reference 1');
    await createDocument('Bob', 'COMPLETE', 'test 4', new Date(2020, 0, 20), 'User Reference 2');

    const result = await StorageDocumentService.getAllStorageDocsForUserByYearAndMonth('01-2020', 'Bob', testContact);

    expect(result).toHaveLength(2);
    expect(result[0].userReference).toBe('User Reference 1');
    expect(result[1].userReference).toBe('User Reference 2');
  });

  it('should return all completed storage documents in createdAt descending order', async () => {
    await createDocument('Bob', 'COMPLETE', 'test 1', new Date('2020-01-01'));
    await createDocument('Bob', 'COMPLETE', 'test 3', new Date('2020-01-03'));
    await createDocument('Bob', 'COMPLETE', 'test 2', new Date('2020-01-02'));

    const result = await StorageDocumentService.getAllStorageDocsForUserByYearAndMonth('01-2020', 'Bob', testContact);

    expect(result).toHaveLength(3);
    expect(result[0].documentNumber).toBe('test 3');
    expect(result[1].documentNumber).toBe('test 2');
    expect(result[2].documentNumber).toBe('test 1');
  });
});

describe('completeDraft', () => {

  let mockDate: jest.SpyInstance;

  beforeAll(() => {
    mockDate = jest.spyOn(Date, 'now');
  });

  afterAll(() => {
    mockDate.mockRestore();
  });

  const getDraft = async (documentNumber: string) => {
    const query = { documentNumber: documentNumber };
    const projection = ['-_id', '-__t', '-__v', '-audit'];
    const options = { lean: true };

    return StorageDocumentModel.findOne(query, projection, options);
  };

  it('should complete a draft certificate', async () => {
    const testDate = '2020-02-12';
    mockDate.mockReturnValue(testDate);
    const mockFeatureFlag = jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(false);
    const mockSubmitToCatch = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

    await createDocument('Bob', 'DRAFT', 'GBR-2020-CC-0E42C2DA5', new Date(2020, 0, 20), "User Reference", {
      transportation: {
        exportDate: "12/02/2020",
      },
      faciltyName: 'Facility',
    });

    await StorageDocumentService.completeDraft('GBR-2020-CC-0E42C2DA5', 'documentUri', 'bob@bob.bob');

    mockFeatureFlag.mockRestore();
    mockSubmitToCatch.mockRestore();

    const updated = await getDraft('GBR-2020-CC-0E42C2DA5');

    expect(updated).toStrictEqual({
      documentNumber: 'GBR-2020-CC-0E42C2DA5',
      documentUri: 'documentUri',
      createdAt: new Date(testDate),
      createdBy: "Bob",
      createdByEmail: 'bob@bob.bob',
      status: 'COMPLETE',
      draftData: {
        name: "Bob"
      },
      exportData: {
        catches: [],
        transportation: {
          exportDate: "12/02/2020",
        }
      },
      userReference: 'User Reference'
    });
  });

  it('should do nothing to a complete certificate', async () => {
    const mockFeatureFlag = jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(false);
    const mockSubmitToCatch = jest.spyOn(ReferenceDataService, 'submitToCatchSystem').mockResolvedValue(undefined);

    await createDocument('Bob', 'COMPLETE', 'GBR-2020-CC-0E42C2DA5');

    const original = await getDraft('ZZZ-2020-CC-0E42C2DA5');

    await StorageDocumentService.completeDraft('ZZZ-2020-CC-0E42C2DA5', 'documentUri', 'bob@bob.bob');

    mockFeatureFlag.mockRestore();
    mockSubmitToCatch.mockRestore();

    const updated = await getDraft('ZZZ-2020-CC-0E42C2DA5');

    expect(updated).toStrictEqual(original);
  });

  it('should not upsert if no document is found', async () => {
    await StorageDocumentService.completeDraft('test', 'documentUri', 'bob@bob.bob');

    const draft = await getDraft('GBR-2020-CC-NON-EXISTENT');

    expect(draft).toBeNull();
  });

});

describe('deleteDraft', () => {
  const testContact = 'contactBob';

  beforeEach(async () => {
    await Promise.all([
      createDocument('Bob', 'DRAFT', 'test 1'),
      createDocument('Bob', 'COMPLETED', 'test 2'),
      createDocument('John', 'DRAFT', 'test 3'),
      createDocument('John', 'COMPLETED', 'test 4'),
      createDocument('Ron', 'COMPLETED', 'test 5')
    ]);
  });

  it('will delete a users draft if they have one', async () => {
    await StorageDocumentService.deleteDraft('John', 'test 3', testContact);

    const statements = await StorageDocumentModel.find();
    const docNumbers = statements.map(ps => ps.documentNumber);

    expect(statements.length).toBe(4);
    expect(docNumbers).toContain('test 1');
    expect(docNumbers).toContain('test 2');
    expect(docNumbers).toContain('test 4');
    expect(docNumbers).toContain('test 5');
  });

  it('will not delete a users draft if they do not have one', async () => {
    await StorageDocumentService.deleteDraft('Ron', 'test', testContact);

    expect(await StorageDocumentModel.countDocuments()).toBe(5);
  });

});

describe('voidStorageDocument', () => {
  const documentNumber = 'GBR-XXXX-SD-XXXXXXXX';

  let mockVoidStorageDocument;

  beforeEach(() => {
    mockVoidStorageDocument = jest.spyOn(ManageCertsService, 'voidCertificate');
    mockVoidStorageDocument.mockResolvedValue(true);
  })

  it('will void the Processing Statement matching the given document number', async () => {
    const result = await StorageDocumentService.voidStorageDocument(documentNumber, 'John', defaultContact);

    expect(mockVoidStorageDocument).toHaveBeenCalledWith(documentNumber, 'John', defaultContact);
    expect(mockVoidStorageDocument).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it('will throw an error if the Processing Statement can not be void', async () => {
    mockVoidStorageDocument.mockResolvedValue(false);

    await expect(() => StorageDocumentService.voidStorageDocument(documentNumber, 'John', defaultContact))
      .rejects
      .toThrow(`Document ${documentNumber} not be voided by user John`);
  });
});

describe('checkDocument', () => {
  it('will return a document if a match exists', async () => {
    await createDocument('Bob', 'COMPLETE', 'doc1');

    const result = await StorageDocumentService.checkDocument('doc1', 'Bob', defaultContact);

    expect(result).toBeTruthy();
  });

  it('will return null if no document can be found', async () => {
    const result = await StorageDocumentService.checkDocument('doc1', 'Bob', defaultContact);

    expect(result).toBeFalsy();
  });
});

const createDocument = async (
  userPrincipal: string,
  status: string = 'DRAFT',
  documentNumber: string = 'test',
  createdAt: Date = new Date(2020, 0, 20),
  userReference: String = defaultUserReference,
  exportData?: any
) => {
  await new StorageDocumentModel({
    documentNumber: documentNumber,
    status: status,
    createdAt: createdAt,
    createdBy: userPrincipal,
    draftData: {
      name: 'Bob'
    },
    userReference: userReference,
    exportData
  }).save();
};

describe('GetExporterDetails', () => {
  let mockGet: jest.SpyInstance;
  let mockMap: jest.SpyInstance;

  beforeAll(() => {
    mockGet = jest.spyOn(StorageDocumentService, 'getDraft');
    mockMap = jest.spyOn(FrontEndExporterSchema, 'toFrontEndPsAndSdExporterDetails');
  });

  afterAll(() => {
    mockGet.mockRestore();
    mockMap.mockRestore();
  });

  it("will return null if no draft is found", async () => {
    mockGet.mockResolvedValue(null);

    expect(await StorageDocumentService.getExporterDetails("Bob", undefined, defaultContact)).toBeNull();
  });

  it("will return null if the draft has no exporter", async () => {
    const draft = createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: null,
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    });

    mockGet.mockResolvedValue(draft);

    expect(await StorageDocumentService.getExporterDetails("Bob", undefined, defaultContact)).toBeNull();
  });

  it("will return a mapped exporter if the draft has an exporter", async () => {
    const draft = createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        addressTwo: 'Street',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    });

    mockGet.mockResolvedValue(draft);
    mockMap.mockReturnValue({ mapped: true });

    const res = await StorageDocumentService.getExporterDetails("Bob", undefined, defaultContact);

    expect(mockMap).toHaveBeenCalledWith(draft.exportData.exporterDetails);
    expect(res).toStrictEqual({ mapped: true });
  });
});

describe('UpsertDraftData', () => {
  it('will upsert details based on a document number', async () => {
    await new StorageDocumentModel(createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        addressTwo: 'Street',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    }, 'GBR-34344-3444-344')).save();

    await StorageDocumentService.upsertDraftData("Bob", 'GBR-34344-3444-344', {
      '$set': {
        'exportData.exporterDetails.exporterCompanyName': "MMO 2"
      }
    }, defaultContact);

    const result = await StorageDocumentModel.findOne({
      createdBy: 'Bob',
      status: 'DRAFT'
    }, ['exportData'], { lean: true });

    expect(result.exportData.exporterDetails.exporterCompanyName).toStrictEqual('MMO 2');
  });

  it("should not create a new certificate", async () => {
    await new StorageDocumentModel(createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        addressTwo: 'Street',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    }, 'GBR-34344-3444-344')).save();

    await StorageDocumentService.upsertDraftData('Bob', 'ZZZ-3423-234', {
      '$set': {
        'exportData.transportation.exportedFrom': 'New York'
      }
    }, defaultContact);

    const drafts = await StorageDocumentModel.find({}, ['exportData'], { lean: true })

    expect(drafts.length).toEqual(1)
  });
});

describe('Upsert Exporter Details', () => {

  const payload: FrontEndExporterSchema.Exporter = {
    model: {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: 'MMO',
      addressOne: 'Building',
      townCity: 'Town',
      postcode: 'NE1 1NE',
      _dynamicsAddress: { someData: 'original data' },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      },
      user_id: '',
      currentUri: '',
      nextUri: '',
      journey: ''
    }
  };

  it("will convert to a back end exporter details model", async () => {
    await new StorageDocumentModel(createDraft({
      catches: [],
      transportation: {
        vehicle: 'plane',
        flightNumber: 'BA078',
        containerNumber: '12345',
        departurePlace: 'Essex',
        exportDate: '18/11/2019'
      },
      exporterDetails: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        addressTwo: 'Street',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe"
        }
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    }, 'GBR-34344-3444-344')).save();

    await StorageDocumentService.upsertExporterDetails("Bob", 'GBR-34344-3444-344', payload, defaultContact);

    const result = await StorageDocumentModel.findOne({
      createdBy: 'Bob',
      status: 'DRAFT'
    }, ['exportData'], { lean: true });

    expect(result.exportData.exporterDetails.exporterCompanyName).toStrictEqual('MMO');
  });
});

describe('getStorageNotesDraftNumber', () => {
  const sampleDocument = (name: String) => {
    return {
      documentNumber: 'GBR-2020-CC-0E42C2DA5',
      status: 'DRAFT',
      createdAt: new Date('2020-01-16'),
      createdBy: name,
      userReference: 'User Reference'
    }
  }

  it('should return a catch cert number for a draft', async () => {
    await new StorageDocumentModel(sampleDocument("Bob")).save();

    const result = await StorageDocumentService.getDraftCertificateNumber("Bob", defaultContact);

    expect(result).toEqual('GBR-2020-CC-0E42C2DA5');
  });

  it('should return undefined if certificate does not exist', async () => {
    await new StorageDocumentModel(sampleDocument("Pete")).save();

    const result = await StorageDocumentService.getDraftCertificateNumber("Bob", defaultContact);

    expect(result).toEqual(undefined);
  });
});

const createDraft = (exportData: ExportData, documentNumber: string = 'X'): StorageDocument => {
  return {
    documentNumber: documentNumber,
    status: 'DRAFT',
    createdAt: '2019-01-01',
    createdBy: 'Bob',
    createdByEmail: '',
    draftData: null,
    exportData: exportData,
    documentUri: '',
    requestByAdmin: true,
    userReference: 'User Reference'
  }
};

describe('upsertTransportDetails', () => {

  const transport: FrontEndTransportSchema.Transport = {
    vehicle: 'truck',
    cmr: 'true',
  };

  let spy;

  beforeEach(() => {
    spy = jest.spyOn(StorageDocumentService, 'upsertDraftData');
    spy.mockResolvedValue(null);
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should call upsertDraftData to export transportation', async () => {
    await StorageDocumentService.upsertTransportDetails('Bob', transport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalledWith(
      'Bob',
      'GBR-234234-234234-23424',
      {
        '$set': {
          'exportData.transportation': {
            "cmr": true,
            "vehicle": "truck"
          }
        }
      },
      'contactBob'
    )
  });
  it('should call upsertDraftData to arrival transportation', async () => {
    transport.arrival = true;
    await StorageDocumentService.upsertTransportDetails('Bob', transport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalledWith(
      'Bob',
      'GBR-234234-234234-23424',
      {
        '$set': {
          'exportData.arrivalTransportation': {
            "cmr": true,
            "vehicle": "truck"
          }
        }
      },
      'contactBob'
    )
  });

  it('should validate and reject invalid container numbers for train arrival', async () => {
    const trainTransport = {
      vehicle: 'train',
      arrival: true,
      containerNumbers: ['INVALID123'] // Invalid format
    };

    await expect(
      StorageDocumentService.upsertTransportDetails('Bob', trainTransport, 'GBR-234234-234234-23424', defaultContact)
    ).rejects.toThrow();
  });

  it('should validate and reject invalid container numbers for truck arrival', async () => {
    const truckTransport = {
      vehicle: 'truck',
      arrival: true,
      containerNumbers: ['ABC1234567'] // Missing U/J/Z/R character
    };

    await expect(
      StorageDocumentService.upsertTransportDetails('Bob', truckTransport, 'GBR-234234-234234-23424', defaultContact)
    ).rejects.toThrow();
  });

  it('should accept valid container numbers for train arrival', async () => {
    const trainTransport = {
      vehicle: 'train',
      arrival: true,
      containerNumbers: ['ABCU1234567', 'XYZJ7654321']
    };

    await StorageDocumentService.upsertTransportDetails('Bob', trainTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });

  it('should accept valid container numbers for truck arrival', async () => {
    const truckTransport = {
      vehicle: 'truck',
      arrival: true,
      containerNumbers: ['ABCZ1234567']
    };

    await StorageDocumentService.upsertTransportDetails('Bob', truckTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });

  it('should not validate container numbers for departure transport', async () => {
    const departureTransport = {
      vehicle: 'train',
      arrival: false,
      containerNumbers: ['INVALID123'] // Invalid but should not be validated for departure
    };

    await StorageDocumentService.upsertTransportDetails('Bob', departureTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });

  it('should not validate container numbers for plane arrival', async () => {
    const planeTransport = {
      vehicle: 'plane',
      arrival: true,
      containerNumbers: ['INVALID123'] // Invalid but should not be validated for plane
    };

    await StorageDocumentService.upsertTransportDetails('Bob', planeTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });

  it('should accept empty container numbers array', async () => {
    const trainTransport = {
      vehicle: 'train',
      arrival: true,
      containerNumbers: []
    };

    await StorageDocumentService.upsertTransportDetails('Bob', trainTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });

  it('should accept undefined container numbers', async () => {
    const trainTransport = {
      vehicle: 'train',
      arrival: true,
      containerNumbers: undefined
    };

    await StorageDocumentService.upsertTransportDetails('Bob', trainTransport, 'GBR-234234-234234-23424', defaultContact);

    expect(spy).toHaveBeenCalled();
  });
});

describe('getTransportDetails', () => {

  let mockGetDraft;
  let mockToFrontEndTransport;

  beforeEach(() => {
    mockGetDraft = jest.spyOn(StorageDocumentService, 'getDraft');
    mockToFrontEndTransport = jest.spyOn(FrontEndTransportSchema, 'toFrontEndTransport');
    mockToFrontEndTransport.mockResolvedValue(null);
  });

  afterEach(() => {
    mockGetDraft.mockRestore();
    mockToFrontEndTransport.mockRestore();
  });

  it('should map the mongo transport data if it exists', async () => {
    const draft = {
      exportData: {
        transportation: { 'test': 'test' }
      }
    }

    mockGetDraft.mockResolvedValue(draft);
    mockToFrontEndTransport.mockReturnValue(draft.exportData.transportation);

    const res = await StorageDocumentService.getTransportDetails('Bob', 'GBR-3442-2344', defaultContact);

    expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-3442-2344', defaultContact);
    expect(mockToFrontEndTransport).toHaveBeenCalledWith(draft.exportData.transportation);
    expect(res).toStrictEqual(draft.exportData.transportation);
  });

  it('should return null if no transport data exists in mongo', async () => {
    mockGetDraft.mockResolvedValue(null);
    mockToFrontEndTransport.mockReturnValue(null);

    const res = await StorageDocumentService.getTransportDetails('Bob', 'GBR-3442-2344', defaultContact);

    expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-3442-2344', defaultContact);
    expect(mockToFrontEndTransport).not.toHaveBeenCalled();
    expect(res).toBeNull();
  });

});

describe('upsertUserReference', () => {

  let spy;

  beforeEach(() => {
    spy = jest.spyOn(StorageDocumentService, 'upsertDraftData');
    spy.mockResolvedValue(null);
  });

  afterEach(() => {
    spy.mockRestore();
  })

  it("will call upsert draft data with the correct parameters", async () => {
    await StorageDocumentService.upsertUserReference('Bob', 'document123', 'reference456', defaultContact);

    expect(spy).toHaveBeenCalledWith('Bob', 'document123', { '$set': { 'userReference': 'reference456' } }, defaultContact)
  });

});

describe('getExportLocation', () => {
  let mockGetDraft;

  beforeAll(() => {
    mockGetDraft = jest.spyOn(StorageDocumentService, 'getDraft');
  });

  afterAll(() => {
    mockGetDraft.mockRestore();
  });

  it('should return null if there is no draft', async () => {
    mockGetDraft.mockResolvedValue(null);

    expect(await StorageDocumentService.getExportLocation('Bob', undefined, defaultContact)).toBeNull();
  });

  it('should return null if the draft has no transportation', async () => {
    const draft = createDraft({
      catches: null,
      storageFacilities: null,
      exporterDetails: null,
      transportation: null,
      facilityName: '',
    });

    mockGetDraft.mockResolvedValue(draft);

    expect(await StorageDocumentService.getExportLocation(defaultUser, undefined, defaultContact)).toBeNull();
  });

  it('should return export location if exportedTo exists', async () => {
    const draft = createDraft({
      catches: null,
      storageFacilities: null,
      exporterDetails: null,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      facilityName: 'Facility',
    });

    mockGetDraft.mockResolvedValue(draft);

    const res = await StorageDocumentService.getExportLocation(defaultUser, 'GBR-3442-2344-23444', defaultContact);

    expect(mockGetDraft).toHaveBeenCalledWith('Bob', 'GBR-3442-2344-23444', defaultContact);
    expect(res).toEqual({
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });
});

describe('upsertExportLocation', () => {
  it('should update exportData.exportedTo', async () => {
    await new StorageDocumentModel({
      documentNumber: 'RJH-2020-SD-0E42C2DA5',
      status: 'DRAFT',
      createdAt: new Date(2020, 1, 20),
      createdBy: 'Bob',
      draftData: {
        name: 'Bob'
      }
    }).save();

    await StorageDocumentService.upsertExportLocation(
      defaultUser,
      {
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      'RJH-2020-SD-0E42C2DA5',
      defaultContact);

    const storageDoc = await StorageDocumentModel.findOne(
      { createdBy: 'Bob', status: 'DRAFT', documentNumber: 'RJH-2020-SD-0E42C2DA5' },
      ['exportData'],
      { lean: true }
    );

    expect(storageDoc.exportData).toStrictEqual({
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP",
      },
    });
  });
});

describe('cloneStorageDocument', () => {
  const originalDocNumber = 'GBR-2021-SD-012345678';
  const cloneDocNumber = 'GBR-2021-SD-012345679';
  const requestByAdmin = false;
  const voidOriginal = false;

  const original: StorageDocument = {
    createdAt: new Date('2020-01-01').toISOString(),
    createdBy: "Bob",
    createdByEmail: "hi@ivinapontes.com",
    status: "DRAFT",
    documentNumber: originalDocNumber,
    requestByAdmin: false,
    userReference: "this is a reference",
    exportData: {
      catches: [{
        product: "Mola rock crab (CWE)",
        commodityCode: "12",
        certificateNumber: "12",
        productWeight: "12",
        weightOnCC: "12",
        placeOfUnloading: "12",
        dateOfUnloading: "26/05/2021",
        transportUnloadedFrom: "12",
        id: "12-1622029341",
        scientificName: "Cancer edwardsii"
      }],
      exporterDetails: {
        contactId: "70676bc6-295e-ea11-a811-000d3a20f8d4",
        accountId: "7d676bc6-295e-ea11-a811-000d3a20f8d4",
        exporterCompanyName: "Fish trader",
        addressOne: "The cat is flat, Building name, street name",
        buildingNumber: null,
        subBuildingName: "The cat is flat",
        buildingName: "Building name",
        streetName: "Street name",
        county: "Ealing",
        country: "United Kingdom of Great Britain and Northern Ireland",
        townCity: "LONDON",
        postcode: "W3 0ab",
        _dynamicsAddress: {
        },
        _dynamicsUser: {
          firstName: "Ivina",
          lastName: "Pontes"
        }
      },
      exportedTo: {
        officialCountryName: "Sweden",
        isoCodeAlpha2: "SE",
        isoCodeAlpha3: "SWE",
        isoNumericCode: "752"
      },
      transportation: {
        vehicle: "truck",
        exportedTo: {
          officialCountryName: "Sweden",
          isoCodeAlpha2: "SE",
          isoCodeAlpha3: "SWE",
          isoNumericCode: "752"
        },
        cmr: true
      },
      facilityName: 'ssss',
      facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
      facilityTownCity: 'asdads',
      facilityPostcode: '12343',
      facilitySubBuildingName: 'sdsa',
      facilityBuildingNumber: 'sadsad',
      facilityBuildingName: 'ewr',
      facilityStreetName: 'sadasd',
      facilityCounty: 'england',
      facilityCountry: 'Afghanistan',
      facilityApprovalNumber: 'TSF001',
      facilityStorage: 'chilled, frozen',
      facilityArrivalDate: '17/10/2025',
      _facilityUpdated: false
    }

  }

  beforeEach(async () => {
    jest
      .spyOn(DocumentNumberService, 'getUniqueDocumentNumber')
      .mockResolvedValue(cloneDocNumber);

    await new StorageDocumentModel(original).save();
  });

  it('will throw an error if the storage document can not be found', async () => {
    const invalidDocNumber = 'GBR-2021-SD-0123456789';

    await expect(() => StorageDocumentService.cloneStorageDocument(invalidDocNumber, 'Bob', defaultContact, requestByAdmin, voidOriginal))
      .rejects
      .toThrow('Document GBR-2021-SD-0123456789 not found for user Bob');
  });

  it('will return the document number of the newly created copy', async () => {
    const result = await StorageDocumentService.cloneStorageDocument(originalDocNumber, 'Bob', defaultContact, requestByAdmin, voidOriginal);

    expect(result).toBe(cloneDocNumber);
  });

  it('will clone an existing storage document', async () => {
    await StorageDocumentService.cloneStorageDocument(originalDocNumber, 'Bob', defaultContact, requestByAdmin, voidOriginal);

    const clone = await StorageDocumentService.getDocument(cloneDocNumber, 'Bob', defaultContact);

    expect(clone).not.toBeNull();
  });

  it('will not link the clone with the original - changes to one do not effect the other', async () => {
    await StorageDocumentService.cloneStorageDocument(originalDocNumber, 'Bob', defaultContact, requestByAdmin, voidOriginal);

    await StorageDocumentService.upsertDraftData(
      'Bob',
      originalDocNumber,
      { '$set': { 'exportData.exporterDetails.exporterCompanyName': 'Modified' } },
      defaultContact
    );

    const updated = await StorageDocumentService.getDocument(originalDocNumber, 'Bob', defaultContact);

    expect(updated.exportData.exporterDetails.exporterCompanyName).toBe('Modified');

    const cloned = await StorageDocumentService.getDocument(cloneDocNumber, 'Bob', defaultContact);

    expect(cloned.exportData.exporterDetails.exporterCompanyName)
      .toBe('Fish trader');

    expect(cloned.requestByAdmin).toBe(false);
  });
});