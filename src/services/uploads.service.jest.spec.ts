import UploadsService from './uploads.service';
import { IUploadedLanding } from "../persistence/schema/uploads";
import { SessionStoreFactory } from '../session_store/factory';
import { UPLOAD_ROWS_KEY } from '../session_store/constants';

describe('save uploaded rows to redis', () => {

  const uploadRows: IUploadedLanding[] = [{
    rowNumber: 1,
    originalRow: "PRD735,10/10/2020,FAO18,PH1100,100",
    productId: "PRD735",
    product: {
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      scientificName: 'latin atlantic cod',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      commodity_code: '0123456',
      commodity_code_description: 'some commodity code description'
    },
    landingDate: '10-10-2020',
    faoArea: 'FAO018',
    vessel: {
      pln: 'PH1100',
      vesselName: 'WIRON 5'
    },
    vesselPln: 'PH1100',
    exportWeight: 100,
    errors: []
  }];

  const userPrinciple = 'aUserPrinciple';
  const contactId = 'aContactId';

  let mockSaveSessionStore: jest.SpyInstance;
  const mockSessionStore = {
    writeFor: jest.fn()
  };

  beforeAll(() => {
    mockSaveSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockSaveSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterAll(() => {
    mockSaveSessionStore.mockRestore();
  });

  it('should call writeFor with the right parameters', async () => {
    await UploadsService.cacheUploadedRows(userPrinciple, contactId, uploadRows);
    expect(mockSessionStore.writeFor).toHaveBeenCalledWith(userPrinciple, contactId, UPLOAD_ROWS_KEY, uploadRows);
  });

});

describe('get uploaded rows from redis', () => {

  const uploadRows: IUploadedLanding[] = [{
    rowNumber: 1,
    originalRow: "PRD735,10/10/2020,FAO18,PH1100,100",
    productId: "PRD735",
    product: {
      species: 'Atlantic cod (COD)',
      speciesCode: 'COD',
      scientificName: 'latin atlantic cod',
      state: 'FRE',
      stateLabel: 'Fresh',
      presentation: 'WHL',
      presentationLabel: 'Whole',
      commodity_code: '0123456',
      commodity_code_description: 'some commodity code description'
    },
    landingDate: '10-10-2020',
    faoArea: 'FAO018',
    vessel: {
      pln: 'PH1100',
      vesselName: 'WIRON 5'
    },
    vesselPln: 'PH1100',
    exportWeight: 100,
    errors: []
  }];

  const userPrinciple = 'aUserPrinciple';
  const contactId = 'aContactId';

  let mockReadSessionStore: jest.SpyInstance;
  const mockSessionStore = {
    readFor: jest.fn().mockImplementation(() => Promise.resolve(uploadRows))
  };

  beforeAll(() => {
    mockReadSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockReadSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterAll(() => {
    mockReadSessionStore.mockRestore();
  });

  it('should call readFor with the right parameters', async () => {
    const result = await UploadsService.getCacheUploadedRows(userPrinciple, contactId);
    expect(mockSessionStore.readFor).toHaveBeenCalledWith(userPrinciple, contactId, UPLOAD_ROWS_KEY);
    expect(result).toStrictEqual(uploadRows);
  });

});

describe('delete uploaded rows from redis', () => {

  const userPrinciple = 'aUserPrinciple';
  const contactId = 'aContactId';

  let mockSaveSessionStore: jest.SpyInstance;
  const mockSessionStore = {
    deleteFor: jest.fn()
  };

  beforeAll(() => {
    mockSaveSessionStore = jest.spyOn(SessionStoreFactory, 'getSessionStore');
    mockSaveSessionStore.mockResolvedValue(mockSessionStore);
  });

  afterAll(() => {
    mockSaveSessionStore.mockRestore();
  });

  it('should call deleteFor with the right parameters', async () => {
    await UploadsService.invalidateCacheUploadedRows(userPrinciple, contactId);
    expect(mockSessionStore.deleteFor).toHaveBeenCalledWith(userPrinciple, contactId, UPLOAD_ROWS_KEY);
  });

});