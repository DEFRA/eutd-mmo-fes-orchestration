import DocumentNumberService, { processingStatement, storageNote } from './documentNumber.service';
import * as CatchCertService from "../persistence/services/catchCert";
import * as ProcessingStatementService from "../persistence/services/processingStatement";
import * as StorageDocumentService from "../persistence/services/storageDoc";
import { DOCUMENT_NUMBER_KEY } from '../session_store/constants';
import ServiceNames from '../validators/interfaces/service.name.enum';

describe('getDraftDocument', () => {

  const defaultUser = 'Bob';
  const contactId = 'contactBob';
  const key = 'aKey';

  const expected = {
    documentNumber : "docNumber",
    status: 'someStatus',
    startedAt: 'a date'
  };

  let mockGetCCHeaders;
  let mockGetPSHeaders;
  let mockGetSDHeaders;

  beforeEach(() => {
    mockGetCCHeaders = jest.spyOn(CatchCertService, 'getDraftCatchCertHeadersForUser');
    mockGetPSHeaders = jest.spyOn(ProcessingStatementService, 'getDraftDocumentHeaders');
    mockGetSDHeaders = jest.spyOn(StorageDocumentService, 'getDraftDocumentHeaders');
  });

  afterEach(() => {
    mockGetCCHeaders.mockRestore();
    mockGetPSHeaders.mockRestore();
    mockGetSDHeaders.mockRestore();
  });

  it('should return data if data is returned from mongo', async () => {
    mockGetCCHeaders.mockReturnValue(expected);

    const result = await DocumentNumberService.getDraftDocuments(defaultUser, key, contactId);

    expect(mockGetCCHeaders).toHaveBeenCalled();
    expect(mockGetPSHeaders).not.toHaveBeenCalled();
    expect(mockGetSDHeaders).not.toHaveBeenCalled();
    expect(result).toStrictEqual(expected);
  });

  it('should return an empty object if no data is returned from mongo', async () => {
    mockGetCCHeaders.mockReturnValue(null);

    const result = await DocumentNumberService.getDraftDocuments(defaultUser, key, contactId);

    expect(mockGetCCHeaders).toHaveBeenCalled();
    expect(mockGetPSHeaders).not.toHaveBeenCalled();
    expect(mockGetSDHeaders).not.toHaveBeenCalled();
    expect(result).toStrictEqual([]);
  });

  it('should call the PS service if the key contains processingStatement', async () => {
    mockGetPSHeaders.mockReturnValue(expected);

    const result = await DocumentNumberService.getDraftDocuments(defaultUser, `${processingStatement}/${DOCUMENT_NUMBER_KEY}`, contactId);

    expect(mockGetCCHeaders).not.toHaveBeenCalled();
    expect(mockGetPSHeaders).toHaveBeenCalled();
    expect(mockGetSDHeaders).not.toHaveBeenCalled();
    expect(result).toStrictEqual(expected);
  });

  it('should call the SD service if the key contains storageNote', async () => {
    mockGetSDHeaders.mockReturnValue(expected);

    const result = await DocumentNumberService.getDraftDocuments(defaultUser, `${storageNote}/${DOCUMENT_NUMBER_KEY}`, contactId);

    expect(mockGetCCHeaders).not.toHaveBeenCalled();
    expect(mockGetPSHeaders).not.toHaveBeenCalled();
    expect(mockGetSDHeaders).toHaveBeenCalled();
    expect(result).toStrictEqual(expected);
  });

});

describe('getServiceNameFromDocumentNumber', () => {

  it('should return CC for a CC document number', () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('CC');

    expect(DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)).toBe(ServiceNames.CC);
  });

  it('should return PS for a PS document number', () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('PS');

    expect(DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)).toBe(ServiceNames.PS);
  });

  it('should return SD for a SD document number', () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('SD');

    expect(DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)).toBe(ServiceNames.SD);
  });

  it('should return UNKNOWN for anything else', () => {
    const tests = [undefined, null, '', 'test', DocumentNumberService.getDocumentNumber('XX')]

    tests.map(documentNumber => {
      expect(DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)).toBe(ServiceNames.UNKNOWN);
    });
  });

});

describe('getUniqueDocumentNumber', () => {

  let mockGetDocumentNumber;
  let mockModel;

  beforeEach(() => {
    mockGetDocumentNumber = jest.spyOn(DocumentNumberService, 'getDocumentNumber');
    mockModel = { exists: jest.fn() };
  });

  afterEach(() => {
    mockGetDocumentNumber.mockRestore();
  });

  it('should return a document number', async () => {
    mockModel.exists.mockResolvedValue(false);
    mockGetDocumentNumber.mockReturnValue('doc1');

    const result = await DocumentNumberService.getUniqueDocumentNumber('CC', mockModel);

    expect(result).toBe('doc1');
    expect(mockGetDocumentNumber).toHaveBeenCalledTimes(1);
  });

  it('should keep generating new document numbers until it creates one which is unique', async () => {
    mockModel.exists.mockResolvedValueOnce(true);
    mockModel.exists.mockResolvedValueOnce(true);
    mockModel.exists.mockResolvedValueOnce(false);

    mockGetDocumentNumber.mockReturnValueOnce('doc1');
    mockGetDocumentNumber.mockReturnValueOnce('doc2');
    mockGetDocumentNumber.mockReturnValueOnce('doc3');

    const result = await DocumentNumberService.getUniqueDocumentNumber('CC', mockModel);

    expect(result).toBe('doc3');
    expect(mockGetDocumentNumber).toHaveBeenCalledTimes(3);
  });

  it('should throw an error if it cant generate a unique document number after 10 attempts', async () => {
    mockModel.exists.mockResolvedValue(true);
    mockGetDocumentNumber.mockReturnValue('doc1');

    await expect(DocumentNumberService.getUniqueDocumentNumber('CC', mockModel)).rejects.toThrow('[getUniqueDocumentNumber][service: CC][ERROR] Failed to create a unique document number.');

    expect(mockGetDocumentNumber).toHaveBeenCalledTimes(10);
  });

});

describe('getDocument', () => {

  let mockGetServiceName;
  let mockGetCC;
  let mockGetPS;
  let mockGetSD;

  const contactId = 'contactBob';

  beforeAll(() => {
    mockGetServiceName = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber');
    mockGetCC = jest.spyOn(CatchCertService, 'getDocument');
    mockGetPS = jest.spyOn(ProcessingStatementService, 'getDocument');
    mockGetSD = jest.spyOn(StorageDocumentService, 'getDocument');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it(`will return null if the service name can't be found for the document number`, async () => {
    mockGetServiceName.mockReturnValue(null);
    mockGetCC.mockResolvedValue(null);

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toBeNull();
  });

  it('will return null if no document is found', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.CC);
    mockGetCC.mockResolvedValue(null);

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toBeNull();
  });

  it('will return null if the found document status is not complete or pending', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.CC);
    mockGetCC.mockResolvedValue({documentNumber: 'doc1', status: 'DRAFT'});

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toBeNull();
  });

  it('will return document details if a completed CC is found', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.CC);
    mockGetCC.mockResolvedValue({
      documentNumber: 'doc1',
      documentUri: 'uri',
      status: 'COMPLETE',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toMatchObject({
      documentNumber: 'doc1',
      documentUri: 'uri',
      documentStatus: 'COMPLETE',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });
  });

  it('will return document details if a pending CC is found', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.CC);
    mockGetCC.mockResolvedValue({
      documentNumber: 'doc1',
      documentUri: 'uri',
      status: 'PENDING',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);
    expect(result).toMatchObject({
      documentNumber: 'doc1',
      documentUri: 'uri',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });
  });

  it('will return document details if a completed PS is found', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.PS);
    mockGetPS.mockResolvedValue({
      documentNumber: 'doc1',
      documentUri: 'uri',
      status: 'COMPLETE',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toMatchObject({
      documentNumber: 'doc1',
      documentUri: 'uri',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });
  });

  it('will return document details if a completed SD is found', async () => {
    mockGetServiceName.mockReturnValue(ServiceNames.SD);
    mockGetSD.mockResolvedValue({
      documentNumber: 'doc1',
      documentUri: 'uri',
      status: 'COMPLETE',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });

    const result = await DocumentNumberService.getDocument('doc1', 'Bob', contactId);

    expect(result).toMatchObject({
      documentNumber: 'doc1',
      documentUri: 'uri',
      createdAt: '2022-03-04T09:45:11.000Z',
      userReference: '',
    });
  });

});

describe('countDocuments', () => {
  let mockCountCC;
  let mockCountPS;
  let mockCountSD;

  const userPrincipal = 'ABC';
  const contactId = 'contactBob';

  beforeAll(() => {
    mockCountCC = jest.spyOn(CatchCertService, 'countCompletedDocuments');
    mockCountPS = jest.spyOn(ProcessingStatementService, 'countCompletedDocuments');
    mockCountSD = jest.spyOn(StorageDocumentService, 'countCompletedDocuments');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return count for CC', async () => {
    mockCountCC.mockReturnValue(1);

    const result = await DocumentNumberService.countDocuments('catchCertificate', userPrincipal, contactId);

    expect(result).toBe(1);
  });

  it('should return count for PS', async () => {
    mockCountPS.mockReturnValue(1);

    const result = await DocumentNumberService.countDocuments('processingStatement', userPrincipal, contactId);

    expect(result).toBe(1);
  });

  it('should return count for SD', async () => {
    mockCountSD.mockReturnValue(1);

    const result = await DocumentNumberService.countDocuments('storageNotes', userPrincipal, contactId);

    expect(result).toBe(1);
  });
});

describe('getCompletedDocuments', () => {
  let mockGetCC;
  let mockGetPS;
  let mockGetSD;

  const userPrincipal = 'ABC';
  const contactId = 'contactBob';

  beforeAll(() => {
    mockGetCC = jest.spyOn(CatchCertService, 'getCompletedDocuments');
    mockGetPS = jest.spyOn(ProcessingStatementService, 'getCompletedDocuments');
    mockGetSD = jest.spyOn(StorageDocumentService, 'getCompletedDocuments');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return CC documents', async () => {
    const documents = [
      {
        documentNumber: 'GBR-2021-CC-469123515',
        status: 'COMPLETE',
        documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
        createdAt: '2021-10-11T15:01:18.000Z',
        userReference: '',
      }
    ];
    mockGetCC.mockResolvedValue(documents);

    const result = await DocumentNumberService.getCompletedDocuments('catchCertificate', userPrincipal, contactId, 1, 1);

    expect(result).toBe(documents);
  });

  it('should return PS documents', async () => {
    const documents = [
      {
        documentNumber: 'GBR-2021-PS-469123515',
        status: 'COMPLETE',
        documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
        createdAt: '2021-10-11T15:01:18.000Z',
        userReference: '',
      }
    ];
    mockGetPS.mockResolvedValue(documents);

    const result = await DocumentNumberService.getCompletedDocuments('processingStatement', userPrincipal, contactId, 1, 1);

    expect(result).toBe(documents);
  });

  it('should return SD documents', async () => {
    const documents = [
      {
        documentNumber: 'GBR-2021-SD-469123515',
        status: 'COMPLETE',
        documentUri: '_d45c484f-6cdb-478a-a314-190ba8444868.pdf',
        createdAt: '2021-10-11T15:01:18.000Z',
        userReference: '',
      }
    ];
    mockGetSD.mockResolvedValue(documents);

    const result = await DocumentNumberService.getCompletedDocuments('storageNotes', userPrincipal, contactId, 1, 1);

    expect(result).toBe(documents);
  });
});