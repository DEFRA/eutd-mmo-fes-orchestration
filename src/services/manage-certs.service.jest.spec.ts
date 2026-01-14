import axios from 'axios';
import Logger from '../logger';
import ManageCertsService from './manage-certs.service';
import * as ReferenceService from './reference-data.service';
import { MongoConnection } from '../persistence/mongo';
import * as LandingsConsolidateService from './landings-consolidate.service';
import * as EuCountriesService from './eu-countries.service';
import * as pdfService from 'mmo-ecc-pdf-svc';
import DocumentNumberService from './documentNumber.service';
import ServiceNames from '../validators/interfaces/service.name.enum';
import { EuCatchStatus } from '../persistence/schema/catchCert';
import ApplicationConfig from '../applicationConfig';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ManageCertsService.deleteDraftCertificate', () => {
  let findOneSpy: jest.SpyInstance;
  let deleteOneSpy: jest.SpyInstance;
  let deleteBlobSpy: jest.SpyInstance;

  beforeEach(() => {
    findOneSpy = jest.spyOn(MongoConnection, 'findOne');
    deleteOneSpy = jest.spyOn(MongoConnection, 'deleteOne');
    deleteBlobSpy = jest.spyOn(pdfService, 'deleteBlob');
  });

  afterEach(() => {
    findOneSpy.mockRestore();
    deleteOneSpy.mockRestore();
    deleteBlobSpy.mockRestore();
  });

  it('deletes blob and document record', async () => {
    const fakeDoc = { documentUri: 'https://blob.core.windows.net/container/_12345.pdf?sig=abc' } as any;
    findOneSpy.mockResolvedValue(fakeDoc);
    deleteOneSpy.mockResolvedValue(null as any);
    deleteBlobSpy.mockImplementation(() => {});

    await ManageCertsService.deleteDraftCertificate('GBR-123');

    expect(findOneSpy).toHaveBeenCalledWith(expect.any(String), { documentNumber: 'GBR-123' });
    expect(deleteBlobSpy).toHaveBeenCalledWith(expect.any(String), '_12345.pdf');
    expect(deleteOneSpy).toHaveBeenCalledWith(expect.any(String), { documentNumber: 'GBR-123' });
  });
});

describe('manage-cert-service', () => {

  const contactId = 'contactBob';

  describe('voidCertificate', () => {

    let mockMongoFindOne: jest.SpyInstance;
    let mockMongoUpdateStatusAsVoid: jest.SpyInstance;
    let mockReportDocumentVoided: jest.SpyInstance;
    let mockLoggerError: jest.SpyInstance;
    let mockVoidConsolidateLandings: jest.SpyInstance;
    let mockSubmitToCatch: jest.SpyInstance;

    beforeEach(() => {
      mockMongoFindOne = jest.spyOn(MongoConnection, 'findOne');
      mockMongoUpdateStatusAsVoid = jest.spyOn(MongoConnection, 'updateStatusAsVoid');
      mockReportDocumentVoided = jest.spyOn(ReferenceService, 'reportDocumentVoided');
      mockLoggerError = jest.spyOn(Logger, 'error');
      mockedAxios.put.mockResolvedValueOnce(null);
      mockVoidConsolidateLandings = jest.spyOn(LandingsConsolidateService, 'voidConsolidateLandings');
      mockVoidConsolidateLandings.mockResolvedValue(undefined);
      mockSubmitToCatch = jest.spyOn(ReferenceService, 'submitToCatchSystem');
      jest.spyOn(EuCountriesService, 'isEuCountry').mockResolvedValue(false);
      mockSubmitToCatch.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockMongoFindOne.mockRestore();
      mockMongoUpdateStatusAsVoid.mockRestore();
      mockVoidConsolidateLandings.mockRestore();
      mockSubmitToCatch.mockRestore();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('should handle an undefined return on findOne', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoFindOne.mockResolvedValue(undefined);

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      const result = await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);
      expect(result).toBeFalsy();
    });

    it('should handle a VOID error if thrown', async () => {
      const error = new Error('Error when finding VOID document');

      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoFindOne.mockRejectedValue(error);

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      const result = await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(result).toBeFalsy();
      expect(mockLoggerError).toHaveBeenCalledWith(`[DOCUMENT-VOID][${documentNumber}][ERROR][${error.stack || error}]`);
    });

    it('should call voidConsolidateLandings with a valid documentNumber', async () => {

      const documentNumber = 'GBR-2024-CC-EDFD19F9A';
      const userPrincipalId = 'a user id';
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id'
      });

      const result = await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);
      expect(mockVoidConsolidateLandings).toHaveBeenCalled();
      expect(mockVoidConsolidateLandings).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();

    })

    it('should call reportDocumentVoided with a valid documentNumber', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id'
      });

      mockReportDocumentVoided.mockResolvedValue(null);

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);
      expect(mockMongoFindOne).toHaveBeenCalled();
      expect(mockMongoUpdateStatusAsVoid).toHaveBeenCalled();
      expect(mockReportDocumentVoided).toHaveBeenCalledWith(documentNumber);
      expect(mockSubmitToCatch).not.toHaveBeenCalled();
    });

    it('should call submit to catch with a valid documentNumber for a document previously sent to catch', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: {
          status: 'SUCCESS',
          reference: 'EU.CATCH.CC.0123456789'
        },
        exportData: {
          exportedTo: { officialCountryName: 'SPAIN' }
        }
      });

      mockReportDocumentVoided.mockResolvedValue(null);

      const documentNumber = 'GBR-2024-CC-12345678';
      const userPrincipalId = 'a user id';
      
      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.CC);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);
      expect(mockSubmitToCatch).toHaveBeenCalledWith(documentNumber, 'void');
      
      getServiceSpy.mockRestore();
    });

    it('should call submit to catch with a valid documentNumber and catch error from submitting to catch', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: {
          status: 'SUCCESS',
          reference: 'EU.CATCH.CC.0123456789'
        }
      });

      mockReportDocumentVoided.mockResolvedValue(null);
      mockSubmitToCatch.mockRejectedValue(new Error ('something went wrong'));

      const documentNumber = 'GBR-2024-CC-12345678';
      const userPrincipalId = 'a user id';
      
      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.CC);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);
      expect(mockLoggerError).toHaveBeenCalledWith('[CATCH-SYSTEM-VOID][GBR-2024-CC-12345678][ERROR][something went wrong]');
      
      getServiceSpy.mockRestore();
    });

    it('should gracefully handle a VOID event failure', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id'
      });

      mockReportDocumentVoided.mockRejectedValue(new Error('error'));

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockMongoFindOne).toHaveBeenCalled();
      expect(mockMongoUpdateStatusAsVoid).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-DOCUMENT-VOID][test-document-number][ERROR][Error: error]');
    });

    it('should not submit to catch when EU is failed', async () => {
      const documentNumber = 'SD-0001-TEST';
      const userPrincipalId = 'a user id';

      // document indicates it was previously submitted to catch
      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: 'FAILED' },
        exportData: { exportedTo: null }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.SD);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).not.toHaveBeenCalled();
      getServiceSpy.mockRestore();
    });

    it('should submit to catch for NMD when successfully submitted before and flag is enabled', async () => {
      const documentNumber = 'GBR-2024-SD-12345678';
      const userPrincipalId = 'a user id';

      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: EuCatchStatus.Success }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.SD);
      jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(true);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).toHaveBeenCalledWith(documentNumber, 'void');

      getServiceSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should NOT submit to catch for NMD when flag is disabled even if successfully submitted before', async () => {
      const documentNumber = 'GBR-2024-SD-12345678';
      const userPrincipalId = 'a user id';

      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: EuCatchStatus.Success }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.SD);
      jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(false);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).not.toHaveBeenCalled();

      getServiceSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should submit to catch for PS when successfully submitted before and flag is enabled', async () => {
      const documentNumber = 'GBR-2024-PS-12345678';
      const userPrincipalId = 'a user id';

      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: EuCatchStatus.Success }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.PS);
      jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(true);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).toHaveBeenCalledWith(documentNumber, 'void');

      getServiceSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should NOT submit to catch for PS when flag is disabled even if successfully submitted before', async () => {
      const documentNumber = 'GBR-2024-PS-12345678';
      const userPrincipalId = 'a user id';

      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: EuCatchStatus.Success }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.PS);
      jest.spyOn(ApplicationConfig, 'enableNmdPsEuCatch', 'get').mockReturnValue(false);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).not.toHaveBeenCalled();

      getServiceSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should submit to catch for CC when successfully submitted before', async () => {
      const documentNumber = 'GBR-2024-CC-12345678';
      const userPrincipalId = 'a user id';

      mockMongoFindOne.mockResolvedValue({
        createdBy: 'a user id',
        catchSubmission: { status: EuCatchStatus.Success }
      });

      const getServiceSpy = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber').mockReturnValue(ServiceNames.CC);

      await ManageCertsService.voidCertificate(documentNumber, userPrincipalId, contactId);

      expect(mockSubmitToCatch).toHaveBeenCalledWith(documentNumber, 'void');

      getServiceSpy.mockRestore();
    });
  });

});