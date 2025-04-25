import axios from 'axios';
import * as SUT from './reference-data.service';
import * as moment from 'moment';
import { getVesselByPlnDate}  from "./reference-data.service";
import logger from '../logger';
import { Vessel } from '../persistence/schema/frontEndModels/payload';
import { ICcQueryResult } from '../persistence/schema/onlineValidationResult';
jest.mock('uuid', () => ({ v4: () =>  'some-uuid'}));

const sinon = require('sinon');
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getConversionFactors', () => {

  it('should GET a list of conversion factors from the reference reader', async() => {
    const data = [
      {
        presentation: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1
      },
      {
        presentation: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: data });
    await expect(SUT.getConversionFactors(mockedAxios)).resolves.toEqual(data);
    expect(axios.get).toHaveBeenCalled();
  });

  it('should handle GET error of conversion factors from the reference reader', async() => {
    const error = 'Network Error';

    const mockLoggerError = sinon.spy(logger, 'error');

    mockedAxios.get.mockRejectedValueOnce(new Error(error));
    await expect(SUT.getConversionFactors(mockedAxios)).rejects.toThrow('Network Error');
    expect(axios.get).toHaveBeenCalled();
    expect(mockLoggerError.getCall(0).args[0]).toEqual(`[GET-CONVERSION-FACTORS][ERROR] Error: Network Error`);

    mockLoggerError.restore();
  });
});

describe('reportDraftCreated', () => {

  let mockLogError;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockLogError.mockRestore();
  });

  it('should call the data reader POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);
    const documentNumber = 'test-document-number';

    await SUT.reportDraftCreated(documentNumber, mockedAxios);

    expect(axios.post).toHaveBeenCalledWith('/v1/data-hub/draft', {certificateId: documentNumber});
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    const documentNumber = 'test-document-number';

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.reportDraftCreated(documentNumber, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLogError).toHaveBeenCalledWith(`[REPORT-DRAFT-CREATED][ERROR] ${error}`);
  });

});

describe('reportDeleteCreated', () => {
  let mockLogError;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockLogError.mockRestore();
  });

it('should call the data reader delete / POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);
    const documentNumber = 'test-document-number';

    await SUT.reportDocumentDeleted(documentNumber, mockedAxios);

    expect(axios.post).toHaveBeenCalledWith('/v1/data-hub/delete', { certificateId: documentNumber });
});

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    const documentNumber = 'test-document-number';

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.reportDocumentDeleted(documentNumber, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLogError).toHaveBeenCalledWith(`[REPORT-DOCUMENT-DELETED][ERROR] ${error}`);
  });
});

describe('reportSubmitCreated', () => {
  let mockLogerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockLoggerError = jest.spyOn(logger, 'error');
    mockLogerInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockLogerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should call the data reader submit / POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);
    const baseUrl = '/v1/catchcertificates/data-hub/submit';
    const documentNumber = 'GBR-3434-3434-3434';
    const queryTime = moment.utc();
    const validationData: ICcQueryResult[] = [{
      documentNumber: documentNumber,
      status: "COMPLETE",
      documentType: 'catchCertificate',
      createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
      rssNumber: 'rssWA1',
      da: 'Guernsey',
      dateLanded: '2019-07-10',
      species: 'LBE',
      weightOnCert: 121,
      rawWeightOnCert: 122,
      weightOnAllCerts: 200,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 100,
      weightFactor: 5,
      isLandingExists: false,
      isSpeciesExists: true,
      numberOfLandingsOnDay: 1,
      weightOnLanding: 51,
      weightOnLandingAllSpecies: 30,
      isOverusedThisCert: false,
      isOverusedAllCerts: true,
      isExceeding14DayLimit: true,
      overUsedInfo: [],
      durationSinceCertCreation: moment.duration(
        queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      extended: {}
    }];

    await SUT.reportDocumentSubmitted(baseUrl, validationData, mockedAxios);

    expect(mockLogerInfo).toHaveBeenCalledWith(`[POST][REPORT-DOCUMENT-SUBMIT] ${JSON.stringify({ validationData: validationData })}`);
    expect(axios.post).toHaveBeenCalledWith('/v1/catchcertificates/data-hub/submit', { validationData: validationData });
  });

  it('should log and rethrow any errors', async () => {
    const baseUrl = '/v1/catchcertificates/data-hub/submit';
    const error = new Error('400 (Bad Request)');
    const validationData = [];

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.reportDocumentSubmitted(baseUrl, validationData, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-DOCUMENT-SUBMIT][ERROR] Error: 400 (Bad Request)');
  });
});

describe('reportDocumentVoided', () => {
  let mockLogError;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockLogError.mockRestore();
  });

  it('should call the data reader void / POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);
    const documentNumber = 'test-document-number';

    await SUT.reportDocumentVoided(documentNumber, mockedAxios);

    expect(axios.post).toHaveBeenCalledWith('/v1/data-hub/void', { certificateId: documentNumber, isFromExporter : true });
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    const documentNumber = 'test-document-number';

    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(SUT.reportDocumentVoided(documentNumber, mockedAxios)).rejects.toThrow(error.message);

    expect(mockLogError).toHaveBeenCalledWith(`[REPORT-DOCUMENT-VOIDED][ERROR] ${error}`);
  });
});

describe('getSeasonalFish', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        presentation: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1,
      },
      {
        presentation: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48,
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getSeasonalFish(mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getSeasonalFish(mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      { err: error },
      `[GET-SEASONAL-FISH][ERROR]${error}`
    );
  });
});

describe('checkVesselLicense', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  const vessel: Vessel = {
    pln: "PH1100",
    vesselName: "WIRON 5",
    flag: "GBR",
    cfr: "GBRC20514",
    homePort: "PLYMOUTH",
    licenceNumber: "12480",
    licenceValidTo: "2382-12-31T00:00:00",
    imoNumber: "9249556"
  }

  it('returns response data', async () => {
    const data = {
      fishingVesselName:"WIRON 5",
      ircs:"2HGD8",
      flag:"GBR",
      homePort:"PLYMOUTH",
      registrationNumber:"PH1100",
      imo:9249556,
      fishingLicenceNumber:"12480",
      fishingLicenceValidFrom:"2016-09-01T00:00:00",
      fishingLicenceValidTo:"2382-12-31T00:00:00",
      adminPort:"PLYMOUTH",
      rssNumber:"C20514",
      vesselLength:50.63,
      cfr:"GBRC20514"
    };
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.checkVesselLicense(vessel, '01/01/1990', mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.checkVesselLicense(vessel, '01/01/1990', mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Vessel WIRON 5 has no valid license',
      `${error.message}`
    );
  });
});

describe('getVessel', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        presentation: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1,
      },
      {
        presentation: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48,
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getVessel('pln', 'name', mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getVessel('pln', 'name', mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to get vessel for pln and name',
      error
    );
  });
});

describe('searchVessel', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        "pln": "SU177",
        "vesselName": "BENJAMIN GUY",
        "flag": "GBR",
        "cfr": "GBRB10920",
        "homePort": "PORTSMOUTH",
        "licenceNumber": "22578",
        "imoNumber": null,
        "licenceValidTo": "2382-12-31T00:00:00",
        "rssNumber": "B10920",
        "vesselLength": 9.94
      }
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.searchVessel('pln', '12/09/2021', mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.searchVessel('pln', 'name', mockedAxios)).rejects.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Vessel has no valid license',
      error.message
    );
  });
});

describe('getVesselByPlnDate', ()=> {

  const mockResponseItem = {
    "pln": "SU177",
    "vesselName": "BENJAMIN GUY",
    "flag": "GBR",
    "cfr": "GBRB10920",
    "homePort": "PORTSMOUTH",
    "licenceNumber": "22578",
    "imoNumber": null,
    "licenceValidTo": "2382-12-31T00:00:00",
    "rssNumber": "B10920",
    "vesselLength": 9.94
  };

  let mockSearchVessel;
  let mockLogerError;

  beforeEach(() => {
    mockSearchVessel = jest.spyOn(SUT, 'searchVessel');
    mockSearchVessel.mockResolvedValue([mockResponseItem]);

    mockLogerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a vessel when found only one', async () => {
    const result = await getVesselByPlnDate('SU177', '12/03/2021');

    expect(result).toEqual(mockResponseItem);
  });

  it('should return undefined when vessel no found', async () => {
    const result = await getVesselByPlnDate('noPLNfound', '12/03/2021');

    expect(result).toEqual(undefined)
  });

  it('should return undefined when multiple found', async () => {
    mockSearchVessel.mockResolvedValue([mockResponseItem, mockResponseItem]);

    const result = await getVesselByPlnDate('SU177', '12/03/2021');

    expect(mockLogerError).toHaveBeenCalledWith(`[GET-VESSEL-BY-PLN-DATE][ERROR][Multiple vessels with same PLN Date: []`);
    expect(result).toEqual(undefined);
  });

  it('should return undefined if search vessel return null', async () => {
    mockSearchVessel.mockResolvedValue(null);

    const result = await getVesselByPlnDate('SU177', '12/03/2021');

    expect(mockLogerError).not.toHaveBeenCalledWith(`[GET-VESSEL-BY-PLN-DATE][ERROR][Multiple vessels with same PLN Date: ${mockResponseItem}]`);
    expect(result).toEqual(undefined);
  });

});

describe('getSpecies', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        presentation: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1,
      },
      {
        presentation: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48,
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getSpecies('label', mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getSpecies('label', mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to get species for code',
      error
    );
  });
});

describe('getSpeciesByFaoCode', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        presentation: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1,
      },
      {
        presentation: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48,
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getSpeciesByFaoCode('code', mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getSpeciesByFaoCode('code', mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to get species for code',
      error
    );
  });
});

describe('getPresentationByCode', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        value: "WHL",
        species: "MAS",
        state: "FRO",
        toLiveWeightFactor: 1,
      },
      {
        value: "GUT",
        species: "BSF",
        state: "FRO",
        toLiveWeightFactor: 1.48,
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getPresentationByCode('WHL', mockedAxios);

    expect(response).toEqual(data[0]);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getPresentationByCode('WHL', mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to get presentation for code',
      error
    );
  });
});

describe('getStateByCode', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        value: "ABC",
        state: "ABC"
      },
      {
        value: "FRO",
        state: "FRO"
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const response = await SUT.getStateByCode('FRO', mockedAxios);

    expect(response).toEqual(data[1]);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.get.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.getStateByCode('FRO', mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to get state for code',
      error
    );
  });
});

describe('refreshLandings', () => {

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns response data', async () => {
    const data = [
      {
        value: "ABC",
        state: "ABC"
      },
      {
        value: "FRO",
        state: "FRO"
      },
    ];
    mockedAxios.post.mockResolvedValueOnce({ data });

    const response = await SUT.refreshLandings({pln: 'pln', dateLanded: '01/01/1990'}, mockedAxios);

    expect(response).toEqual(data);
  });

  it('should log and rethrow any errors', async () => {
    const error = new Error('something bad has happened');
    mockedAxios.post.mockRejectedValueOnce(error);
    const mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerError.mockReturnValue(null);

    await expect(SUT.refreshLandings({pln: 'pln', dateLanded: '01/01/1990'}, mockedAxios)).resolves.toThrow(error.message);

    expect(mockLoggerError).toHaveBeenCalledWith(
      `[REFRESHING-LANDINGS][ERROR][${error}]`
    );
  });
});

describe('virusDetected', ()=>{

  const mockFileName = 'file-name.csv';
  const mockContent = 'file-content';
  const mockDocNumber = 'docNum-1234';
  const mockPayload = {
    fileName: mockFileName,
    content : Buffer.from(mockContent).toString('base64'),
    documentNumber: mockDocNumber,
    key: 'some-uuid'
  };
  let mockLogError;
  let mockLogInfo;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
    mockLogInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockLogError.mockRestore();
    mockLogInfo.mockRestore();
  });

  it('should log and call the data reader virus scan / POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);

    await SUT.virusDetected(mockFileName,mockContent, mockDocNumber, mockedAxios);

    expect(mockLogInfo).toHaveBeenCalledWith(`[AV-API][VIRUS-CHECKER][CSV][${mockDocNumber}][CALLING-API][${mockPayload.key}]`);
    expect(axios.post).toHaveBeenCalledWith('/v1/virusChecker/csv', mockPayload);
  });

  it('should log and return undefined if  virus scan / POST api failed', async () => {
    mockedAxios.post.mockRejectedValue(new Error('an error'));

    await SUT.virusDetected(mockFileName,mockContent, mockDocNumber, mockedAxios);

    expect(mockLogError).toHaveBeenCalledWith(`[AV-API][VIRUS-CHECKER][CSV][${mockDocNumber}][ERROR][${mockPayload.key}] Error: an error`)
  });

  it('should return the data reader virus scan / POST api value for virusDetected', async () => {
    mockedAxios.post.mockResolvedValueOnce({virusDetected: 'some value'});

    await SUT.virusDetected(mockFileName,mockContent, mockDocNumber, mockedAxios);

    expect(mockLogInfo).toHaveBeenCalledWith(`[AV-API][VIRUS-CHECKER][CSV][${mockDocNumber}][CALLING-API][${mockPayload.key}]`);
    expect(axios.post).toHaveBeenCalledWith('/v1/virusChecker/csv', mockPayload);
  });

});

describe('isLegallyDue', ()=>{

  const mockDocNumber = 'docNum-1234';
  const mockPayload = {
    documentNumber: mockDocNumber,
  };
  let mockLogError;
  let mockLogInfo;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
    mockLogInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockLogError.mockRestore();
    mockLogInfo.mockRestore();
  });

  it('should call the isLegallyDue POST api', async () => {
    mockedAxios.post.mockResolvedValueOnce(null);

    await SUT.addIsLegallyDue(mockDocNumber, mockedAxios);

    expect(axios.post).toHaveBeenCalledWith('/v1/isLegallyDue', mockPayload);
  });

  it('should handle errors from calling isLegallyDue POST api with invalid documentNumber', async () => {
    mockedAxios.post.mockRejectedValue(new Error('an error'));

    await SUT.addIsLegallyDue('undefined', mockedAxios);

    expect(mockLogError).toHaveBeenCalledWith('Failed to update exportData is legally due status', new Error('an error'))
  });

});