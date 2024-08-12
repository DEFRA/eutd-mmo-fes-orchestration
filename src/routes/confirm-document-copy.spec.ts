import * as Hapi from '@hapi/hapi';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import * as ReferenceDataService from '../services/reference-data.service';
import * as MonitoringService from '../services/protective-monitoring.service';
import * as constants from '../session_store/constants';
import ConfirmDocumentCopyRoutes from './confirm-document-copy';
import logger from '../logger';
import { DocumentStatuses } from '../persistence/schema/catchCert';

describe('confirm document copy routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new ConfirmDocumentCopyRoutes()
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('POST /confirm-copy-certificate', () => {

    let mockValidateDocumentOwnership;
    let mockReportDraftCreated;
    let mockLogError;
    let mockLogDebug;
    let mockPostEventData;

    const document = {
      documentNumber: 'GBR-2020-CC-0E42C2DA5'
    };

    beforeAll(() => {
      mockLogError = jest.spyOn(logger, 'error');
      mockLogDebug = jest.spyOn(logger, 'debug');
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockReportDraftCreated = jest.spyOn(ReferenceDataService, 'reportDraftCreated');
      mockPostEventData = jest.spyOn(MonitoringService, 'postEventData');
    });

    beforeEach(() => {
      mockValidateDocumentOwnership.mockResolvedValue(document);
      mockReportDraftCreated.mockResolvedValue(true);
      mockPostEventData.mockResolvedValue(null);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe('when copying a catch certificate', () => {
      let mockCloneCC;
      let mockVoidCC;

      beforeEach(() => {
        mockCloneCC = jest.spyOn(CatchCertService, 'cloneCatchCertificate');
        mockVoidCC = jest.spyOn(CatchCertService, 'voidCatchCertificate');
        mockCloneCC.mockResolvedValue('1234');
        mockVoidCC.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCloneCC.mockRestore();
        mockVoidCC.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
            roles: ['MMO-ECC-Service-Management']
          }
        },
        headers: {
          documentNumber: 'DOCUMENT123'
        },
        payload: {
          voidOriginal: false,
          journey: constants.CATCH_CERTIFICATE_KEY,
          copyDocumentAcknowledged: true,
          excludeLandings: true
        }
      };

      it('will return 200 with the document number of the copy if there are no errors', async () => {
        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(mockCloneCC).toHaveBeenCalledWith('DOCUMENT123', 'Bob', true, 'contactBob', true, false);

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will return 200 with the document number of the copy even when landings are not to be excluded', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob',
              contactId: 'contactBob',
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {
            voidOriginal: false,
            journey: constants.CATCH_CERTIFICATE_KEY,
            copyDocumentAcknowledged: true,
            excludeLandings: false
          }
        });

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(mockCloneCC).toHaveBeenCalledWith('DOCUMENT123', 'Bob', false, 'contactBob', false, false);

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';

        await server.inject(request);

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][COPIED][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][SUCCESS]`);

        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will not void the origin document', async () => {
        await server.inject(request);

        expect(mockVoidCC).not.toHaveBeenCalled();
        expect(mockPostEventData).not.toHaveBeenCalled();
      });

      it('will report the newly created draft', async () => {
        await server.inject(request);

        expect(mockReportDraftCreated).toHaveBeenCalledWith('1234');
      });

      it('will log any error from reporting and continue processing the request normally', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';
        const e = new Error('something went wrong');

        mockReportDraftCreated.mockRejectedValue(e);

        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}][ERROR][${e.stack || e}]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will return 400 with errors if the payload is empty', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {}
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.any.required',
          journey: 'error.journey.any.required',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.required'
        });
      });

      it('will return 400 with errors if the payload is invalid', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {
            voidOriginal: 'test',
            journey: true,
            copyDocumentAcknowledged: 'test',
            excludeLandings: 'test'
          }
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.boolean.base',
          journey: 'error.journey.string.base',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.boolean.base',
          excludeLandings: "error.excludeLandings.boolean.base"
        });
      });

      it('will return an empty 403 error if the document can not be copied', async () => {
        mockValidateDocumentOwnership.mockResolvedValue(undefined);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(403);
        expect(response.result).toBeNull();
      })

      it('will log any errors', async () => {
        const error = new Error('something went wrong');

        mockCloneCC.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
      });

      it('will return an empty 500 error if the copying process throws an error', async () => {
        const error = new Error('something went wrong');

        mockCloneCC.mockRejectedValue(error);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
        expect(mockReportDraftCreated).not.toHaveBeenCalled();
      });

      it('will only allow COMPLETE documents to be copied', async () => {
        await server.inject(request);

        expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
          request.app.claims.sub,
          request.headers.documentNumber,
          [DocumentStatuses.Complete],
          'contactBob'
        );
      });

    });

    describe('when copying a processing statement', () => {
      let mockClonePS;
      let mockVoidPS;

      beforeEach(() => {
        mockClonePS = jest.spyOn(ProcessingStatementService, 'cloneProcessingStatement');
        mockVoidPS = jest.spyOn(ProcessingStatementService, 'voidProcessingStatement');
        mockClonePS.mockResolvedValue('1234');
        mockVoidPS.mockResolvedValue(true);
      });

      afterEach(() => {
        mockClonePS.mockRestore();
        mockVoidPS.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentNumber: 'DOCUMENT123'
        },
        payload: {
          voidOriginal: false,
          journey: constants.PROCESSING_STATEMENT_KEY,
          copyDocumentAcknowledged: true
        }
      };

      it('will return 200 with the document number of the copy if there are no errors', async () => {
        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';

        await server.inject(request);

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][COPIED][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][SUCCESS]`);

        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will not void the origin document', async () => {
        await server.inject(request);

        expect(mockVoidPS).not.toHaveBeenCalled();
        expect(mockPostEventData).not.toHaveBeenCalled();
      });

      it('will report the newly created draft', async () => {
        await server.inject(request);

        expect(mockReportDraftCreated).toHaveBeenCalledWith('1234');
      });

      it('will log any error from reporting and continue processing the request normally', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';
        const e = new Error('something went wrong');

        mockReportDraftCreated.mockRejectedValue(e);

        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}][ERROR][${e.stack || e}]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will return 400 with errors if the payload is empty', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {}
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.any.required',
          journey: 'error.journey.any.required',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.required'
        });
      });

      it('will return 400 with errors if the payload is invalid', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {
            voidOriginal: 'test',
            journey: true,
            copyDocumentAcknowledged: 'test'
          }
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.boolean.base',
          journey: 'error.journey.string.base',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.boolean.base',
        });
      });

      it('will return an empty 403 error if the document can not be copied', async () => {
        mockValidateDocumentOwnership.mockResolvedValue(undefined);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(403);
        expect(response.result).toBeNull();
      })

      it('will log any errors', async () => {
        const error = new Error('something went wrong');

        mockClonePS.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
      });

      it('will return an empty 500 error if the copying process throws an error', async () => {
        const error = new Error('something went wrong');

        mockClonePS.mockRejectedValue(error);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
        expect(mockReportDraftCreated).not.toHaveBeenCalled();
      });

      it('will only allow COMPLETE documents to be copied', async () => {
        await server.inject(request);

        expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
          request.app.claims.sub,
          request.headers.documentNumber,
          [DocumentStatuses.Complete],
          'contactBob'
        );
      });

    });

    describe('when copying a storage document', () => {
      let mockCloneSD;
      let mockVoidSD;

      beforeEach(() => {
        mockCloneSD = jest.spyOn(StorageDocumentService, 'cloneStorageDocument');
        mockVoidSD = jest.spyOn(StorageDocumentService, 'voidStorageDocument');
        mockCloneSD.mockResolvedValue('1234');
        mockVoidSD.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCloneSD.mockRestore();
        mockVoidSD.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentNumber: 'DOCUMENT123'
        },
        payload: {
          voidOriginal: false,
          journey: constants.STORAGE_NOTES_KEY,
          copyDocumentAcknowledged: true
        }
      };

      it('will return 200 with the document number of the copy if there are no errors', async () => {
        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';

        await server.inject(request);

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][COPIED][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][SUCCESS]`);

        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will not void the origin document', async () => {
        await server.inject(request);

        expect(mockVoidSD).not.toHaveBeenCalled();
        expect(mockPostEventData).not.toHaveBeenCalled();
      });

      it('will report the newly created draft', async () => {
        await server.inject(request);

        expect(mockReportDraftCreated).toHaveBeenCalledWith('1234');
      });

      it('will log any error from reporting and continue processing the request normally', async () => {
        const documentNumber = request.headers.documentNumber;
        const newDocumentNumber = '1234';
        const e = new Error('something went wrong');

        mockReportDraftCreated.mockRejectedValue(e);

        const response = await server.inject(request);

        const expected = { documentNumber: 'DOCUMENT123', newDocumentNumber: '1234', voidOriginal: false, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}][ERROR][${e.stack || e}]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

      it('will return 400 with errors if the payload is empty', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {}
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.any.required',
          journey: 'error.journey.any.required',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.required'
        });
      });

      it('will return 400 with errors if the payload is invalid', async () => {
        const invalidRequest = {
          method: 'POST',
          url: '/v1/confirm-copy-certificate',
          app: {
            claims: {
              sub: 'Bob'
            }
          },
          headers: {
            documentNumber: 'DOCUMENT123'
          },
          payload: {
            voidOriginal: 'test',
            journey: true,
            copyDocumentAcknowledged: 'test'
          }
        };

        const response = await server.inject(invalidRequest);

        expect(response.statusCode).toBe(400);
        expect(response.result).toStrictEqual({
          voidOriginal: 'error.voidOriginal.boolean.base',
          journey: 'error.journey.string.base',
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.boolean.base',
        });
      });

      it('will return an empty 403 error if the document can not be copied', async () => {
        mockValidateDocumentOwnership.mockResolvedValue(undefined);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(403);
        expect(response.result).toBeNull();
      })

      it('will log any errors', async () => {
        const error = new Error('something went wrong');

        mockCloneSD.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
      });

      it('will return an empty 500 error if the copying process throws an error', async () => {
        const error = new Error('something went wrong');

        mockCloneSD.mockRejectedValue(error);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
        expect(mockReportDraftCreated).not.toHaveBeenCalled();
      });

      it('will only allow COMPLETE documents to be copied', async () => {
        await server.inject(request);

        expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
          request.app.claims.sub,
          request.headers.documentNumber,
          [DocumentStatuses.Complete],
          'contactBob'
        );
      });

    });

    describe('when attempting to copy anything else', () => {

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        headers: {
          documentNumber: 'DOCUMENT123'
        },
        payload: {
          voidOriginal: false,
          journey: 'UNKNOWN',
          copyDocumentAcknowledged: true
        }
      };


      it('will return 500 with the error', async () => {
        const response = await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith('[COPY-CERTIFICATE][ERROR][JOURNEY-UNKNOWN]');

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
        expect(mockReportDraftCreated).not.toHaveBeenCalled();
      });

    });

    describe('When copying and voiding a catch certificate', () => {
      let mockCloneCC;
      let mockVoidCC;

      beforeEach(() => {
        mockCloneCC = jest.spyOn(CatchCertService, 'cloneCatchCertificate');
        mockVoidCC = jest.spyOn(CatchCertService, 'voidCatchCertificate');
        mockCloneCC.mockResolvedValue('1234');
        mockVoidCC.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCloneCC.mockRestore();
        mockVoidCC.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-CC-XXXXXXXX'
        },
        payload: {
          voidOriginal: true,
          ipAddress: 'client-ip',
          journey: constants.CATCH_CERTIFICATE_KEY,
          copyDocumentAcknowledged: true,
          excludeLandings: true
        }
      };

      it('will VOID and log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockVoidCC).toHaveBeenCalled();
        expect(mockVoidCC).toHaveBeenCalledWith(documentNumber, 'Bob', "some-contact-id");

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will log any errors thrown whilst voiding', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst voiding catch certificate');

        mockVoidCC.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will post a positive VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'User voided a catch certificate',
          `void/catch certificate/dn:${documentNumber}`,
          'client-ip',
          0,
          'today:some-contact-id',
          'VOID-CC'
        );
      });

      it('will post a negative VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        mockVoidCC.mockResolvedValue(false);

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'An attempt was made to void a catch certificate not created by the current user',
          `void/catch certificate/dn:${documentNumber}`,
          'client-ip',
          5,
          'today:some-contact-id',
          'VOID-CC'
        );
      });

      it('will catch any errors thrown whilst posting VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst posting VOID event');

        mockPostEventData.mockRejectedValue(error);

        const response = await server.inject(request);

        const expected = { documentNumber: 'GBR-XXXX-CC-XXXXXXXX', newDocumentNumber: '1234', voidOriginal: true, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][EVENT-HUB][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

    });

    describe('When copying and voiding a processing statement', () => {
      let mockClonePS;
      let mockVoidPS;

      beforeEach(() => {
        mockClonePS = jest.spyOn(ProcessingStatementService, 'cloneProcessingStatement');
        mockVoidPS = jest.spyOn(ProcessingStatementService, 'voidProcessingStatement');
        mockClonePS.mockResolvedValue('1234');
        mockVoidPS.mockResolvedValue(true);
      });

      afterEach(() => {
        mockClonePS.mockRestore();
        mockVoidPS.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-PS-XXXXXXXX'
        },
        payload: {
          voidOriginal: true,
          ipAddress: 'client-ip',
          journey: constants.PROCESSING_STATEMENT_KEY,
          copyDocumentAcknowledged: true
        }
      };

      it('will VOID and log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockVoidPS).toHaveBeenCalled();
        expect(mockVoidPS).toHaveBeenCalledWith(documentNumber, 'Bob', "some-contact-id");

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will log any errors thrown whilst voiding', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst voiding processing statment');

        mockVoidPS.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will post a positive VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'User voided a processing statement',
          `void/processing statement/dn:${documentNumber}`,
          'client-ip',
          0,
          'today:some-contact-id',
          'VOID-PS'
        );
      });

      it('will post a negative VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        mockVoidPS.mockResolvedValue(false);

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'An attempt was made to void a processing statement not created by the current user',
          `void/processing statement/dn:${documentNumber}`,
          'client-ip',
          5,
          'today:some-contact-id',
          'VOID-PS'
        );
      });

      it('will catch any errors thrown whilst posting VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst posting VOID event');

        mockPostEventData.mockRejectedValue(error);

        const response = await server.inject(request);

        const expected = { documentNumber: 'GBR-XXXX-PS-XXXXXXXX', newDocumentNumber: '1234', voidOriginal: true, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][EVENT-HUB][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

    });

    describe('When copying and voiding a storage document', () => {
      let mockCloneSD;
      let mockVoidSD;

      beforeEach(() => {
        mockCloneSD = jest.spyOn(StorageDocumentService, 'cloneStorageDocument');
        mockVoidSD = jest.spyOn(StorageDocumentService, 'voidStorageDocument');
        mockCloneSD.mockResolvedValue('1234');
        mockVoidSD.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCloneSD.mockRestore();
        mockVoidSD.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-SD-XXXXXXXX'
        },
        payload: {
          voidOriginal: true,
          ipAddress: 'client-ip',
          journey: constants.STORAGE_NOTES_KEY,
          copyDocumentAcknowledged: true
        }
      };

      it('will VOID and log the whole process for debugging', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockVoidSD).toHaveBeenCalled();
        expect(mockVoidSD).toHaveBeenCalledWith(documentNumber, 'Bob', "some-contact-id");

        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will log any errors thrown whilst voiding', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst voiding storage document');

        mockVoidSD.mockRejectedValue(error);

        await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
      });

      it('will post a positive VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'User voided a storage document',
          `void/storage document/dn:${documentNumber}`,
          'client-ip',
          0,
          'today:some-contact-id',
          'VOID-SD'
        );
      });

      it('will post a negative VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;

        mockVoidSD.mockResolvedValue(false);

        await server.inject(request);

        expect(mockPostEventData).toHaveBeenCalledWith(
          'Bob',
          'An attempt was made to void a storage document not created by the current user',
          `void/storage document/dn:${documentNumber}`,
          'client-ip',
          5,
          'today:some-contact-id',
          'VOID-SD'
        );
      });

      it('will catch any errors thrown whilst posting VOID event to protective monitoring', async () => {
        const documentNumber = request.headers.documentNumber;
        const error = new Error('something went wrong whilst posting VOID event');

        mockPostEventData.mockRejectedValue(error);

        const response = await server.inject(request);

        const expected = { documentNumber: 'GBR-XXXX-SD-XXXXXXXX', newDocumentNumber: '1234', voidOriginal: true, copyDocumentAcknowledged: true };

        expect(mockLogError).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][EVENT-HUB][ERROR][${error.stack || error}]`);
        expect(mockLogDebug).toHaveBeenCalledWith(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual(expected);
      });

    });

    describe('when attempting to copy and void anything else', () => {

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-SD-XXXXXXXX'
        },
        payload: {
          voidOriginal: true,
          ipAddress: 'client-ip',
          journey: 'UNKNOWN',
          copyDocumentAcknowledged: true
        }
      };


      it('will return 500 with the error', async () => {
        const response = await server.inject(request);

        expect(mockLogError).toHaveBeenCalledWith('[COPY-CERTIFICATE][ERROR][JOURNEY-UNKNOWN]');

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
        expect(mockPostEventData).not.toHaveBeenCalled();
      });

    });

    describe('When acknowledging the copy of a catch certificate', () => {
      let mockCloneCC;

      beforeEach(() => {
        mockCloneCC = jest.spyOn(CatchCertService, 'cloneCatchCertificate');
        mockCloneCC.mockResolvedValue('1234');
      });

      afterEach(() => {
        mockCloneCC.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-CC-XXXXXXXX'
        },
        payload: {
          voidOriginal: false,
          journey: constants.CATCH_CERTIFICATE_KEY,
          copyDocumentAcknowledged: false
        }
      };

      it('should not copy and log the debugger process', async () => {
        const response = await server.inject(request);

        expect(mockCloneCC).not.toHaveBeenCalled();
        expect(response.statusCode).toBe(400);

        expect(response.result).toStrictEqual({
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.invalid',
        });

        expect(mockLogError).not.toHaveBeenCalled();
        expect(mockLogDebug).not.toHaveBeenCalled();
      });
    });

    describe('When acknowledging the copy of a processing statement', () => {
      let mockClonePS;

      beforeEach(() => {
        mockClonePS = jest.spyOn(ProcessingStatementService, 'cloneProcessingStatement');
        mockClonePS.mockResolvedValue('1234');
      });

      afterEach(() => {
        mockClonePS.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-PS-XXXXXXXX'
        },
        payload: {
          voidOriginal: false,
          journey: constants.PROCESSING_STATEMENT_KEY,
          copyDocumentAcknowledged: false
        }
      };

      it('should not copy and log the debugger process', async () => {
        const response = await server.inject(request);

        expect(mockClonePS).not.toHaveBeenCalled();
        expect(response.statusCode).toBe(400);

        expect(response.result).toStrictEqual({
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.invalid',
        });

        expect(mockLogError).not.toHaveBeenCalled();
        expect(mockLogDebug).not.toHaveBeenCalled();
      });
    });

    describe('When acknowledging the copy of a storage document', () => {
      let mockCloneSD;

      beforeEach(() => {
        mockCloneSD = jest.spyOn(StorageDocumentService, 'cloneStorageDocument');
        mockCloneSD.mockResolvedValue('1234');
      });

      afterEach(() => {
        mockCloneSD.mockRestore();
      });

      const request: any = {
        method: 'POST',
        url: '/v1/confirm-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            auth_time: 'today',
            contactId: 'some-contact-id'
          }
        },
        headers: {
          documentNumber: 'GBR-XXXX-SD-XXXXXXXX'
        },
        payload: {
          voidOriginal: false,
          journey: constants.STORAGE_NOTES_KEY,
          copyDocumentAcknowledged: false
        }
      };

      it('should not copy and log the debugger process', async () => {
        const response = await server.inject(request);

        expect(mockCloneSD).not.toHaveBeenCalled();
        expect(response.statusCode).toBe(400);

        expect(response.result).toStrictEqual({
          copyDocumentAcknowledged: 'error.copyDocumentAcknowledged.any.invalid',
        });

        expect(mockLogError).not.toHaveBeenCalled();
        expect(mockLogDebug).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET /check-copy-certificate', () => {

    let mockLogDebug;
    let mockLogError;
    let mockValidateDocumentOwnership;

    beforeEach(() => {
      mockValidateDocumentOwnership = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockLogDebug = jest.spyOn(logger, 'debug');
      mockLogError = jest.spyOn(logger, 'error');

      mockValidateDocumentOwnership.mockResolvedValue({ documentNumber: 'GBR-34344-343443-343434' });
    });

    afterEach(() => {
      mockValidateDocumentOwnership.mockRestore();
    });

    describe('for a Catch Certificate', () => {

      const request: any = {
        method: 'GET',
        url: '/v1/check-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentnumber: 'GBR-XXXX-CC-XXXXXXXXX'
        }
      };

      let mockCheckCC;

      beforeEach(() => {
        mockCheckCC = jest.spyOn(CatchCertService, 'checkDocument');
        mockCheckCC.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCheckCC.mockRestore();
      });

      describe('When the document can be copied', () => {

        it('will return 200 confirming that a document can be cloned if there are no errors', async () => {
          const response = await server.inject(request);

          const expected = { canCopy: true };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

        it('will check if the a document exists for a given document number', async () => {
          await server.inject(request);

          expect(mockCheckCC).toHaveBeenCalledWith('GBR-XXXX-CC-XXXXXXXXX', 'Bob', 'contactBob', "catchCertificate");
        });

        it('will log the whole process for debugging', async () => {
          const documentNumber = request.headers.documentnumber;

          await server.inject(request);

          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][START]`);
          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][SUCCESS][true]`);
        });

        it('will return an empty 403 error if the document can not be copied', async () => {
          mockValidateDocumentOwnership.mockResolvedValue(undefined);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(403);
          expect(response.result).toBeNull();
        })

        it('will log any errors', async () => {
          const error = new Error('something went wrong');

          mockCheckCC.mockRejectedValue(error);

          await server.inject(request);

          expect(mockLogError).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        });

        it('will return an empty 500 error if the checking process throws an error', async () => {
          const error = new Error('something went wrong');

          mockCheckCC.mockRejectedValue(error);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(500);
          expect(response.result).toBeNull();
        });

        it('will only check COMPLETE documents', async () => {
          await server.inject(request);

          expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
            request.app.claims.sub,
            request.headers.documentnumber,
            [DocumentStatuses.Complete],
            'contactBob'
          );
        });
      });

      describe('When the document does not exist', () => {

        it('will return 200 confirming that a document can NOT be cloned if there are no errors', async () => {

          mockCheckCC.mockResolvedValue(false);

          const response = await server.inject(request);

          const expected = { canCopy: false };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

      });

    });

    describe('for a Processing Statement', () => {

      const request: any = {
        method: 'GET',
        url: '/v1/check-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentnumber: 'GBR-XXXX-PS-XXXXXXXXX'
        }
      };

      let mockCheckPS;

      beforeEach(() => {
        mockCheckPS = jest.spyOn(ProcessingStatementService, 'checkDocument');
        mockCheckPS.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCheckPS.mockRestore();
      });

      describe('When the document can be copied', () => {

        it('will return 200 confirming that a document can be cloned if there are no errors', async () => {
          const response = await server.inject(request);

          const expected = { canCopy: true };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

        it('will check if the a document exists for a given document number', async () => {
          await server.inject(request);

          expect(mockCheckPS).toHaveBeenCalledWith('GBR-XXXX-PS-XXXXXXXXX', 'Bob', 'contactBob');
        });

        it('will log the whole process for debugging', async () => {
          const documentNumber = request.headers.documentnumber;

          await server.inject(request);

          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][START]`);
          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][SUCCESS][true]`);
        });

        it('will return an empty 403 error if the document can not be copied', async () => {
          mockValidateDocumentOwnership.mockResolvedValue(undefined);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(403);
          expect(response.result).toBeNull();
        })

        it('will log any errors', async () => {
          const error = new Error('something went wrong');

          mockCheckPS.mockRejectedValue(error);

          await server.inject(request);

          expect(mockLogError).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        });

        it('will return an empty 500 error if the checking process throws an error', async () => {
          const error = new Error('something went wrong');

          mockCheckPS.mockRejectedValue(error);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(500);
          expect(response.result).toBeNull();
        });

        it('will only check COMPLETE documents', async () => {
          await server.inject(request);

          expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
            request.app.claims.sub,
            request.headers.documentnumber,
            [DocumentStatuses.Complete],
            'contactBob'
          );
        });
      });

      describe('When the document does not exist', () => {

        it('will return 200 confirming that a document can NOT be cloned if there are no errors', async () => {

          mockCheckPS.mockResolvedValue(false);

          const response = await server.inject(request);

          const expected = { canCopy: false };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

      });

    });

    describe('for a Storage Document', () => {

      const request: any = {
        method: 'GET',
        url: '/v1/check-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentnumber: 'GBR-XXXX-SD-XXXXXXXXX'
        }
      };

      let mockCheckSD;

      beforeEach(() => {
        mockCheckSD = jest.spyOn(StorageDocumentService, 'checkDocument');
        mockCheckSD.mockResolvedValue(true);
      });

      afterEach(() => {
        mockCheckSD.mockRestore();
      });

      describe('When the document can be copied', () => {

        it('will return 200 confirming that a document can be cloned if there are no errors', async () => {
          const response = await server.inject(request);

          const expected = { canCopy: true };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

        it('will check if the a document exists for a given document number', async () => {
          await server.inject(request);

          expect(mockCheckSD).toHaveBeenCalledWith('GBR-XXXX-SD-XXXXXXXXX', 'Bob', 'contactBob');
        });

        it('will log the whole process for debugging', async () => {
          const documentNumber = request.headers.documentnumber;

          await server.inject(request);

          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][START]`);
          expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][SUCCESS][true]`);
        });

        it('will return an empty 403 error if the document can not be copied', async () => {
          mockValidateDocumentOwnership.mockResolvedValue(undefined);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(403);
          expect(response.result).toBeNull();
        })

        it('will log any errors', async () => {
          const error = new Error('something went wrong');

          mockCheckSD.mockRejectedValue(error);

          await server.inject(request);

          expect(mockLogError).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
        });

        it('will return an empty 500 error if the checking process throws an error', async () => {
          const error = new Error('something went wrong');

          mockCheckSD.mockRejectedValue(error);

          const response = await server.inject(request);

          expect(response.statusCode).toBe(500);
          expect(response.result).toBeNull();
        });

        it('will only check COMPLETE documents', async () => {
          await server.inject(request);

          expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
            request.app.claims.sub,
            request.headers.documentnumber,
            [DocumentStatuses.Complete],
            'contactBob'
          );
        });
      });

      describe('When the document does not exist', () => {

        it('will return 200 confirming that a document can NOT be cloned if there are no errors', async () => {

          mockCheckSD.mockResolvedValue(false);

          const response = await server.inject(request);

          const expected = { canCopy: false };

          expect(response.statusCode).toBe(200);
          expect(response.result).toEqual(expected);
        });

      });

    });

    describe('for anything else', () => {

      const request: any = {
        method: 'GET',
        url: '/v1/check-copy-certificate',
        app: {
          claims: {
            sub: 'Bob',
            contactId: 'contactBob',
          }
        },
        headers: {
          documentnumber: 'GBR-XXXX-XX-XXXXXXXXX'
        }
      };

      it('will return 500 confirming that a document with an invalid service name can not be cloned', async () => {
        const documentNumber = request.headers.documentnumber;
        const response = await server.inject(request);

        expect(mockLogDebug).toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][START]`);
        expect(mockLogError).toHaveBeenCalledWith('[CHECK-COPY-CERTIFICATE][ERROR][INVALID-SERVICE-NAME]');
        expect(mockLogDebug).not.toHaveBeenCalledWith(`[CHECK-COPY-CERTIFICATE][${documentNumber}][SUCCESS][true]`);

        expect(response.statusCode).toBe(500);
        expect(response.result).toBeNull();
      });

      it('will return an empty 403 error if the document can not be copied', async () => {
        mockValidateDocumentOwnership.mockResolvedValue(undefined);

        const response = await server.inject(request);

        expect(response.statusCode).toBe(403);
        expect(response.result).toBeNull();
      })

      it('will only check COMPLETE documents', async () => {
        await server.inject(request);

        expect(mockValidateDocumentOwnership).toHaveBeenCalledWith(
          request.app.claims.sub,
          request.headers.documentnumber,
          [DocumentStatuses.Complete],
          'contactBob'
        );
      });

    });

  })

});