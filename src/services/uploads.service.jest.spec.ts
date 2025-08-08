import UploadsService from './uploads.service';
import { IUploadedLanding } from "../persistence/schema/uploads";
import { SessionStoreFactory } from '../session_store/factory';
import { UPLOAD_ROWS_KEY } from '../session_store/constants';
import ApplicationConfig from '../applicationConfig';
import * as FrontEndPayload from "../persistence/schema/frontEndModels/payload";
import axios from 'axios';

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

describe('parseAndValidateData for uploadedLandings', () => {
  let mockAxiosPost;
  let mockGetReferenceServiceUrl;

  const vessel: FrontEndPayload.Vessel = {
    cfr: 'some-cfr',
    flag: 'some-flag',
    homePort: 'some-home-port',
    imoNumber: 'some-imo-number',
    licenceNumber: 'some-licence-number',
    licenceValidTo: 'some-licence-valid-to',
    pln: 'some-pln',
    rssNumber: 'some-rss-number',
    vesselLength: 10,
    vesselName: 'some-vessel-name'
  };
  const products = [{
    species: 'Atlantic cod (COD)',
    speciesCode: 'COD',
    scientificName: 'latin atlantic cod',
    state: 'FRE',
    stateLabel: 'Fresh',
    presentation: 'WHL',
    presentationLabel: 'Whole',
    commodity_code: '0123456',
    commodity_code_description: 'some commodity code description'
  }]
  const landings = [{
    rowNumber: 1,
    originalRow: 'some-string',
    productId: 'some-product-id',
    product: {
      id: 'some-product-id',
      species: 'species',
      speciesCode: 'species-code',
      scientificName: 'some-scientic-name',
      state: 'some-state',
      stateLabel: 'some-label',
      presentation: 'some-presentation',
      presentationLabel: 'some-presentation-label',
      commodity_code: 'some-commidity-code',
      commodity_code_description: 'some-commmodity-description',
    },
    landingDate: 'some-landing-date',
    faoArea: 'faoArea',
    vessel: vessel,
    vesselPln: 'some-pln',
    exportWeight: 10,
    errors: [],
  }]
  const landingLimitDaysInFuture= ApplicationConfig._landingLimitDaysInTheFuture
  const refServiceUrl = 'some-url';
  const responseData = [
    {
      rowNumber: 1,
      originalRow: 'some-string',
      productId: 'some-product-id',
      product: {
        id: 'some-product-id',
        species: 'species',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      },
      startDate: 'some-start-date',
      landingDate: 'some-landing-date',
      faoArea: 'faoArea',
      vessel: vessel,
      vesselPln: 'some-pln',
      exportWeight: 10,
      errors: [],
    }
  ];

  beforeEach(() => {
    mockGetReferenceServiceUrl = jest.spyOn(ApplicationConfig, 'getReferenceServiceUrl');
    mockGetReferenceServiceUrl.mockReturnValue(refServiceUrl);

    mockAxiosPost = jest.spyOn(axios, 'post');
    mockAxiosPost.mockResolvedValue({ data: responseData });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call axios with the correct params', async () => {

    const expectedUrl = `${refServiceUrl}/v1/upload/landings/validate`;
    const expectedPayload = {
      products,
      landingLimitDaysInFuture,
      rows: undefined,
      landings,
    }
    await UploadsService.parseAndValidateData(expectedPayload);
    expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, expectedPayload);
  });

  it('should default products to an empty array if it is null', async () => {

    const expectedUrl = `${refServiceUrl}/v1/upload/landings/validate`;
    const expectedPayload = {
      products: [],
      landingLimitDaysInFuture,
      rows: undefined,
      landings,
    }
    await UploadsService.parseAndValidateData(expectedPayload);

    expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, expectedPayload);
  });

  it('should return the axios response data on success', async () => {
    const payload = {
      products,
      landingLimitDaysInFuture,
      rows: undefined,
      landings,
    }
    const res = await UploadsService.parseAndValidateData(payload);

    expect(res).toBe(responseData);
  });

  it('should allow any axios errors to bubble up', async () => {
    const error = new Error('something went wrong');
    const payload = {
      products,
      landingLimitDaysInFuture,
      rows: undefined,
      landings,
    }

    mockAxiosPost.mockRejectedValue(error);

    await expect(async () =>
      await UploadsService.parseAndValidateData(payload)
    ).rejects.toThrow(error);
  });
});

describe('parseAndValidateData for csv rows', () => {
  let mockAxiosPost;
  let mockGetReferenceServiceUrl;
  const vessel: FrontEndPayload.Vessel = {
    cfr: 'some-cfr',
    flag: 'some-flag',
    homePort: 'some-home-port',
    imoNumber: 'some-imo-number',
    licenceNumber: 'some-licence-number',
    licenceValidTo: 'some-licence-valid-to',
    pln: 'some-pln',
    rssNumber: 'some-rss-number',
    vesselLength: 10,
    vesselName: 'some-vessel-name'
  };
  const products = [{
    species: 'Atlantic cod (COD)',
    speciesCode: 'COD',
    scientificName: 'latin atlantic cod',
    state: 'FRE',
    stateLabel: 'Fresh',
    presentation: 'WHL',
    presentationLabel: 'Whole',
    commodity_code: '0123456',
    commodity_code_description: 'some commodity code description'
  }]
  const csvRows = ['PRD738,10/12/2020,FAO18,H1100,100']
  const landingLimitDaysInFuture= ApplicationConfig._landingLimitDaysInTheFuture
  const refServiceUrl = 'some-url';
  const responseData = [
    {
      rowNumber: 1,
      originalRow: 'some-string',
      productId: 'some-product-id',
      product: {
        id: 'some-product-id',
        species: 'species',
        speciesCode: 'species-code',
        scientificName: 'some-scientic-name',
        state: 'some-state',
        stateLabel: 'some-label',
        presentation: 'some-presentation',
        presentationLabel: 'some-presentation-label',
        commodity_code: 'some-commidity-code',
        commodity_code_description: 'some-commmodity-description',
      },
      landingDate: 'some-landing-date',
      faoArea: 'faoArea',
      vessel: vessel,
      vesselPln: 'some-pln',
      exportWeight: 10,
      errors: [],
    }
  ];

  beforeEach(() => {
    mockGetReferenceServiceUrl = jest.spyOn(ApplicationConfig, 'getReferenceServiceUrl');
    mockGetReferenceServiceUrl.mockReturnValue(refServiceUrl);

    mockAxiosPost = jest.spyOn(axios, 'post');
    mockAxiosPost.mockResolvedValue({ data: responseData });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call axios with the correct params', async () => {

    const expectedUrl = `${refServiceUrl}/v1/upload/landings/validate`;
    const expectedPayload = {
      products,
      landingLimitDaysInFuture,
      csvRows,
      landings: undefined,
    }
    await UploadsService.parseAndValidateData(expectedPayload);
    expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, expectedPayload);
  });

  it('should default products to an empty array if it is null', async () => {

    const expectedUrl = `${refServiceUrl}/v1/upload/landings/validate`;
    const expectedPayload = {
      products: [],
      landingLimitDaysInFuture,
      csvRows,
      landings: undefined,
    }
    await UploadsService.parseAndValidateData(expectedPayload);

    expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, expectedPayload);
  });

  it('should return the axios response data on success', async () => {
    const payload = {
      products,
      landingLimitDaysInFuture,
      csvRows,
      landings: undefined,
    }
    const res = await UploadsService.parseAndValidateData(payload);

    expect(res).toBe(responseData);
  });

  it('should allow any axios errors to bubble up', async () => {
    const error = new Error('something went wrong');
    const payload = {
      products,
      landingLimitDaysInFuture,
      csvRows,
      landings: undefined,
    }

    mockAxiosPost.mockRejectedValue(error);

    await expect(async () =>
      await UploadsService.parseAndValidateData(payload)
    ).rejects.toThrow(error);
  });
});