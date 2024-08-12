import axios from 'axios';
import Logger from '../logger';
import ManageCertsService from './manage-certs.service';
import * as ReferenceService from './reference-data.service';
import { MongoConnection } from "../persistence/mongo";
import * as LandingsConsolidateService from "./landings-consolidate.service";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('manage-cert-service', () => {

  const contactId = 'contactBob';

  describe('voidCertificate', () => {

    let mockMongoFindOne;
    let mockMongoUpdateStatusAsVoid;
    let mockReportDocumentVoided;
    let mockLoggerError;
    let mockVoidConsolidateLandings;
   

    beforeEach(() => {
      mockMongoFindOne = jest.spyOn(MongoConnection, 'findOne');
      mockMongoUpdateStatusAsVoid = jest.spyOn(MongoConnection, 'updateStatusAsVoid');
      mockReportDocumentVoided = jest.spyOn(ReferenceService, 'reportDocumentVoided');
      mockLoggerError = jest.spyOn(Logger, 'error');
      mockedAxios.put.mockResolvedValueOnce(null);
      mockVoidConsolidateLandings = jest.spyOn(LandingsConsolidateService, 'voidConsolidateLandings');
      mockVoidConsolidateLandings.mockResolvedValue(undefined)
    });

    afterEach(() => {
      mockMongoFindOne.mockRestore();
      mockMongoUpdateStatusAsVoid.mockRestore();
      mockVoidConsolidateLandings.mockRestore()
    });

    afterAll(() => {
      jest.restoreAllMocks();
    })

    it('should handle an undefined return on findOne', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoFindOne.mockResolvedValue(undefined);

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      const result = await ManageCertsService.voidCertificate(documentNumber,userPrincipalId, contactId);
      expect(result).toBeFalsy();
    });

    it('should handle a VOID error if thrown', async () => {
      const error = new Error('Error when finding VOID document');

      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoFindOne.mockRejectedValue(error );

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      const result = await ManageCertsService.voidCertificate(documentNumber,userPrincipalId, contactId);

      expect(result).toBeFalsy();
      expect(mockLoggerError).toHaveBeenCalledWith(`[DOCUMENT-VOID][${documentNumber}][ERROR][${error.stack || error}]`);
    });

    it('should call voidConsolidateLandings with a valid documentNumber',  async () => {

      const documentNumber = 'GBR-2024-CC-EDFD19F9A';
      const userPrincipalId = 'a user id';
      mockMongoFindOne.mockResolvedValue({
        createdBy : 'a user id'
      });
    
      const result = await ManageCertsService.voidCertificate(documentNumber,userPrincipalId, contactId);
      expect(mockVoidConsolidateLandings).toHaveBeenCalled();
      expect(mockVoidConsolidateLandings).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();

    })

    it('should call reportDocumentVoided with a valid documentNumber',  async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy : 'a user id'
      });

      mockReportDocumentVoided.mockResolvedValue(null);

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      await ManageCertsService.voidCertificate(documentNumber,userPrincipalId, contactId);
      expect(mockMongoFindOne).toHaveBeenCalled();
      expect(mockMongoUpdateStatusAsVoid).toHaveBeenCalled();
      expect(mockReportDocumentVoided).toHaveBeenCalledWith(documentNumber);
    });

    it('should gracefully handle a VOID event failure', async () => {
      mockedAxios.put.mockResolvedValueOnce(null);
      mockMongoUpdateStatusAsVoid.mockResolvedValue(null);
      mockMongoFindOne.mockResolvedValue({
        createdBy : 'a user id'
      });

      mockReportDocumentVoided.mockRejectedValue(new Error('error'));

      const documentNumber = 'test-document-number';
      const userPrincipalId = 'a user id';

      await ManageCertsService.voidCertificate(documentNumber,userPrincipalId, contactId);

      expect(mockMongoFindOne).toHaveBeenCalled();
      expect(mockMongoUpdateStatusAsVoid).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-DOCUMENT-VOID][test-document-number][ERROR][Error: error]');
    });
  });

});