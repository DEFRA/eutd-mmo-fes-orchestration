import * as Hapi from "@hapi/hapi";
const sinon = require('sinon');
import ExporterController from './exporter.controller';
import ExporterService from '../services/exporter.service';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import DocumentNumberService from '../services/documentNumber.service';
import { DOCUMENT_NUMBER_KEY, EXPORTER_KEY } from '../session_store/constants';
import ServiceNames from '../validators/interfaces/service.name.enum';
import * as DocOwnerShipValidator from "../validators/documentOwnershipValidator"
import Services from '../services/exporter.service';

describe('Exporter Controller', () => {

  const req: any ={
    app : {claims: {sub: 'Bob'}},
    headers : {},
    params : {},
    payload : {}
  };

  const contactId = 'contactBob';

  describe('getExporterDetails', () => {
    let mockFn;

    afterEach(() => {
      mockFn.mockRestore();
    });

    it('should call getExporterDetails for catch certificates when we have a doc number in the header', async () => {
      mockFn = jest.spyOn(CatchCertService, 'getExporterDetails');
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };
      req.params = { journey: 'catchCertificate'};

      mockFn.mockResolvedValue({});

      await ExporterController.getExporterDetails(req,'Bob','GBR-34344-343443-343434', contactId);

      expect(mockFn).toHaveBeenCalledWith('Bob', 'GBR-34344-343443-343434', contactId);
    });

    it('should call getExporterDetails for catch certificates', async () => {
      req.params = {journey: 'catchCertificate'};

      mockFn = jest.spyOn(CatchCertService, 'getExporterDetails');
      mockFn.mockResolvedValue({});

      await ExporterController.getExporterDetails(req,'Bob',undefined, contactId);

      expect(mockFn).toHaveBeenCalledWith('Bob', undefined, contactId);
    });

    it('should call getExporterDetails for processing statements', async () => {
      req.params = {journey: 'processingStatement'};

      mockFn = jest.spyOn(ProcessingStatementService, 'getExporterDetails');
      mockFn.mockResolvedValue({});

      await ExporterController.getExporterDetails(req, 'Bob','GBR-342342-3423432-234', contactId);

      expect(mockFn).toHaveBeenCalledWith('Bob','GBR-342342-3423432-234', contactId);
    });

    it('should call getExporterDetails for storage documents', async () => {
      req.params = { journey: 'storageNotes' };
      mockFn = jest.spyOn(StorageDocumentService, 'getExporterDetails');
      mockFn.mockResolvedValue({});
      await ExporterController.getExporterDetails(req, 'Bob','GBR-3', contactId);
      expect(mockFn).toHaveBeenCalledWith('Bob','GBR-3', contactId);
    });

    it('should call getExporterDetailsFromRedis for anything else', async () => {
      req.params = { journey: 'Anything else' };
      mockFn = jest.spyOn(ExporterController, 'getExporterDetailsFromRedis');
      mockFn.mockResolvedValue({});
      await ExporterController.getExporterDetails(req,'Bob',undefined, contactId);
      expect(mockFn).toHaveBeenCalledWith('Bob', 'Anything else', contactId);
    });

    it('should call getExporterDetailsFromRedis for anything else and return', async () => {
      req.params = { journey: 'Anything else' };
      mockFn = jest.spyOn(ExporterController, 'getExporterDetailsFromRedis');
      mockFn.mockResolvedValue(undefined);
      await ExporterController.getExporterDetails(req,'Bob',undefined, contactId);
      expect(mockFn).toHaveBeenCalledWith('Bob', 'Anything else', contactId);
    });
  });

  describe('getExporterDetailsFromRedis', () => {

    const user = 'Bob';
    const journey = 'catchCertificate';
    const testData = {test: 'test'};

    let getExporterMock;
    let documentGetMock;
    let documentCreateMock;

    beforeEach(() => {
      getExporterMock = jest.spyOn(ExporterService, 'get');
      getExporterMock.mockResolvedValue(testData);

      documentGetMock = jest.spyOn(DocumentNumberService, 'getDraftDocuments');

      documentCreateMock = jest.spyOn(DocumentNumberService, 'createDocumentNumber');
      documentCreateMock.mockResolvedValue({});
    });

    afterEach(() => {
      getExporterMock.mockRestore();
      documentGetMock.mockRestore();
      documentCreateMock.mockRestore();
    });

    it('should create a document number if one does not exist', async () => {
      documentGetMock.mockResolvedValue({});

      const documentKey = `${journey}/${DOCUMENT_NUMBER_KEY}`;

      await ExporterController.getExporterDetailsFromRedis(user, journey, contactId);

      expect(documentGetMock).toHaveBeenCalledWith(user, documentKey, contactId);
      expect(documentCreateMock).toHaveBeenCalledWith(user, ServiceNames.CC, documentKey, journey, contactId);
    });

    it('should create a processing statement document number if one does not exist', async () => {
      documentGetMock.mockResolvedValue({});

      const documentKey = `processingStatement/${DOCUMENT_NUMBER_KEY}`;

      await ExporterController.getExporterDetailsFromRedis(user, 'processingStatement', contactId);

      expect(documentGetMock).toHaveBeenCalledWith(user, documentKey, contactId);
      expect(documentCreateMock).toHaveBeenCalledWith(user, ServiceNames.PS, documentKey, 'processingStatement', contactId);
    });

    it('should create a storage note document number if one does not exist', async () => {
      documentGetMock.mockResolvedValue({});

      const documentKey = `storageNotes/${DOCUMENT_NUMBER_KEY}`;

      await ExporterController.getExporterDetailsFromRedis(user, 'storageNotes', contactId);

      expect(documentGetMock).toHaveBeenCalledWith(user, documentKey, contactId);
      expect(documentCreateMock).toHaveBeenCalledWith(user, ServiceNames.SD, documentKey, 'storageNotes', contactId);
    });

    it('should create a unknown document number if one does not exist', async () => {
      documentGetMock.mockResolvedValue({});

      const documentKey = `blah/${DOCUMENT_NUMBER_KEY}`;

      await ExporterController.getExporterDetailsFromRedis(user, 'blah', contactId);

      expect(documentGetMock).toHaveBeenCalledWith(user, documentKey, contactId);
      expect(documentCreateMock).toHaveBeenCalledWith(user, 'UNKNOWN', documentKey, 'blah', contactId);
    });

    it('should get exporter data', async () => {
      documentGetMock.mockResolvedValue(testData);

      const result = await ExporterController.getExporterDetailsFromRedis(user, journey, contactId);

      expect(documentCreateMock).not.toHaveBeenCalled();
      expect(getExporterMock).toHaveBeenCalledWith(user, `${journey}/${EXPORTER_KEY}`, contactId);
      expect(result).toStrictEqual(testData);
    });

  });

  describe('addExporterDetails', () => {
    let validator;
    let mockFn;
    const res = {
      response: () => {
        function code(httpCode) {
          return httpCode;
        }

        return { code: code }
      },
      redirect: () => {}
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

    beforeAll(() => {
      validator = jest.spyOn(DocOwnerShipValidator, 'validateDocumentOwnership');
      mockFn = jest.spyOn(Services, 'save');
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };
      req.params = { journey: 'catchCertificate'};
      req.payload = { test : "test"};
    });

    it('will call to save the exporter details', async () => {
      validator.mockResolvedValue({ documentNumber: 'GBR-34344-343443-343434'});
      mockFn.mockResolvedValue({});

      await ExporterController.addExporterDetails(req, res, false, 'Bob','GBR-34344-343443-343434', contactId );

      expect(mockFn).toHaveBeenCalledWith({"error": undefined, "errors": undefined, "model": {"test": "test", "user_id": "Bob"}}, "Bob", "GBR-34344-343443-343434", "undefined/exporter", contactId);
    });

    it('will call to save the exporter details with default values', async () => {
      validator.mockResolvedValue({ documentNumber: 'GBR-34344-343443-343434'});
      mockFn.mockResolvedValue({});

      await ExporterController.addExporterDetails(req, res, undefined, 'Bob','GBR-34344-343443-343434', contactId );

      expect(mockFn).toHaveBeenCalledWith({"error": undefined, "errors": undefined, "model": {"test": "test", "user_id": "Bob"}}, "Bob", "GBR-34344-343443-343434", "undefined/exporter", contactId);
    });

    it('will call to save the exporter details with non-js', async () => {
      validator.mockResolvedValue({ documentNumber: 'GBR-34344-343443-343434'});
      mockFn.mockResolvedValue({});

      const nonJSreq = {
        ...req,
        headers: {
          documentNumber: 'GBR-34344-343443-343434',
          accept: 'text/html'
        }
      }
      await ExporterController.addExporterDetails(nonJSreq, res, undefined, 'Bob','GBR-34344-343443-343434', contactId );

      expect(mockFn).toHaveBeenCalledWith({"error": undefined, "errors": undefined, "model": {"test": "test", "user_id": "Bob"}}, "Bob", "GBR-34344-343443-343434", "undefined/exporter", contactId);
    });

    it('will call to save the exporter details with non-js for save as draft', async () => {
      validator.mockResolvedValue({ documentNumber: 'GBR-34344-343443-343434'});
      mockFn.mockResolvedValue({});

      const nonJSreq = {
        ...req,
        headers: {
          documentNumber: 'GBR-34344-343443-343434',
          accept: 'text/html'
        }
      }
      await ExporterController.addExporterDetails(nonJSreq, res, true, 'Bob','GBR-34344-343443-343434', contactId );

      expect(mockFn).toHaveBeenCalledWith({"error": undefined, "errors": undefined, "model": {"test": "test", "user_id": "Bob"}}, "Bob", "GBR-34344-343443-343434", "undefined/exporter", contactId);
    });
  });

  describe('add Exporter Details', () => {

    const req: any = {
      app : {claims: {sub: 'Bob'}}
    };

    const res = sinon.fake();
    let mockAddExporterDetails;

    const addExporterResponse = {test: 'test'};

    beforeEach(() => {
      mockAddExporterDetails = jest.spyOn(ExporterController, 'addExporterDetails');
      mockAddExporterDetails.mockResolvedValue(addExporterResponse);
    });

    afterEach(() => {
      mockAddExporterDetails.mockRestore();
    });

    it('should returns result of addExporterDetails', async () => {
      const result = await ExporterController.addExporterDetailsAndDraftLink(req, res,'test',undefined, contactId);

      expect(mockAddExporterDetails).toHaveBeenCalled();
      expect(result).toStrictEqual(addExporterResponse);
    });
  });

  describe('processSaveExporterDetailsErrors', () => {

    const h = {
      response: () => {
        function code(_httpCode) {
          function takeover() {}

          return { takeover: takeover }
        }
        return { code: code }
      },
      redirect: () => {
        return { takeover: () => {} }
      }
    } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

    let mockSaveExporterDetails;

    beforeEach(() => {
      mockSaveExporterDetails = jest.spyOn(ExporterService, 'save');
      mockSaveExporterDetails.mockResolvedValue({});
    });

    afterEach(() => {
      mockSaveExporterDetails.mockRestore();
    });

    it('will call save with the appropriate document number', async () => {
      req.payload = {};
      req.params = { journey: 'catchCertificate'};
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };

      await ExporterController.processSaveExporterDetailsErrors(req, h,{details: []},'Bob','GBR-3444-2344-234234', contactId);

      expect(mockSaveExporterDetails).toHaveBeenCalledWith({"error": "invalid","errors":{},"model": {} },"Bob","GBR-3444-2344-234234","catchCertificate/exporter", contactId);
    });

    it('will call save with the appropriate document number for non-js', async () => {
      req.payload = {};
      req.params = { journey: 'catchCertificate'};
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };

      const nonJSreq = {
        ...req,
        headers: {
          documentNumber: 'GBR-34344-343443-343434',
          accept: 'text/html'
        }
      }

      await ExporterController.processSaveExporterDetailsErrors(nonJSreq, h,{details: []},'Bob','GBR-3444-2344-234234', contactId);

      expect(mockSaveExporterDetails).toHaveBeenCalledWith({"error": "invalid","errors":{},"model": {} },"Bob","GBR-3444-2344-234234","catchCertificate/exporter", contactId);
    });

    it('will call save with the appropriate document number for non-js with nextUri', async () => {
      req.payload = {
        nextUri: 'true'
      };
      req.params = { journey: 'catchCertificate'};
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };

      const nonJSreq = {
        ...req,
        headers: {
          documentNumber: 'GBR-34344-343443-343434',
          accept: 'text/html'
        }
      }

      await ExporterController.processSaveExporterDetailsErrors(nonJSreq, h,{details: []},'Bob','GBR-3444-2344-234234', contactId);

      expect(mockSaveExporterDetails).toHaveBeenCalledWith({"error": "invalid","errors":{},"model": { "nextUri": "true" } },"Bob","GBR-3444-2344-234234","catchCertificate/exporter", contactId);
    });

    it('will call save with the appropriate document number non-js', async () => {
      req.payload = {};
      req.params = { journey: 'catchCertificate'};
      req.headers = { documentNumber: 'GBR-34344-343443-343434' };

      await ExporterController.processSaveExporterDetailsErrors(req, h,{details: []},'Bob','GBR-3444-2344-234234', contactId);

      expect(mockSaveExporterDetails).toHaveBeenCalledWith({"error": "invalid","errors":{},"model": {} },"Bob","GBR-3444-2344-234234","catchCertificate/exporter", contactId);
    });
  });
});