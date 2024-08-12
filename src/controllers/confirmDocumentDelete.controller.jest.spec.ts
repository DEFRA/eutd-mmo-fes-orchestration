import * as Hapi from "@hapi/hapi";
import Logger from '../logger';
import ComfirmDocumentDeleteController from '../controllers/confirmDocumentDelete.controller';
import DocumentDeleteService from '../services/document-delete.service';
import SaveAsDraftService from '../services/saveAsDraft.service';

import * as ReferenceReader from '../services/reference-data.service';

const h = {
  response: () => {
    function code(httpCode) {
      return httpCode;
    }

    return { code: code }
  },
  redirect: () => {
  }
} as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

const contactId = 'contactBob';

describe('confirmDocumentDelete', () => {

  let mockDeleteDocument;
  let mockDeleteDraftLink;
  let mockReportDocumentDelete;
  let mockLoggerError;
  let mockLoggerInfo;

  beforeEach(() => {
    mockDeleteDocument = jest.spyOn(DocumentDeleteService, 'deleteDocument');
    mockDeleteDraftLink = jest.spyOn(SaveAsDraftService, 'deleteDraftLink');
    mockReportDocumentDelete = jest.spyOn(ReferenceReader, 'reportDocumentDeleted');
    mockLoggerError = jest.spyOn(Logger, 'error');
    mockLoggerInfo = jest.spyOn(Logger, 'info');
  });

  afterEach(() => {
    mockDeleteDocument.mockRestore();
    mockDeleteDraftLink.mockRestore();
    mockReportDocumentDelete.mockRestore();
    mockLoggerError.mockRestore();
    mockLoggerInfo.mockRestore();
  });

  it('should report a DELETE event and delete the document and then delete the save as draft link', async () => {

    mockDeleteDocument.mockResolvedValue(null);
    mockDeleteDraftLink.mockResolvedValue(null);
    mockReportDocumentDelete.mockResolvedValue(null);

    const documentNumber = 'test-document-number';
    const userPrincipalId = 'a user id';
    const request: any = {
      app : {claims: {sub: "test", email: "test@test.com"}},
      params : {documentType: "catchCertificate"},
      payload : {
        documentDelete: 'Yes',
        nextUri: '/test-url/{documentNumber}/test'
      },
      headers: {}
    };

    const result = await ComfirmDocumentDeleteController.confirmDocumentDelete(request, h, userPrincipalId, documentNumber, contactId);

    expect(mockReportDocumentDelete).toHaveBeenCalledWith(documentNumber);
    expect(mockDeleteDocument).toHaveBeenCalled();
    expect(mockDeleteDraftLink).toHaveBeenCalled();
    expect(result).toEqual({ user_id: 'a user id', ...request.payload });
    expect(mockLoggerInfo).toHaveBeenCalledWith('[REPORT-DOCUMENT-DELETE][test-document-number][SUCCESS]');
  });

  it('should gracefully handle a DELETE event failure', async () => {

    mockDeleteDocument.mockResolvedValue(null);
    mockDeleteDraftLink.mockResolvedValue(null);

    mockReportDocumentDelete.mockRejectedValue(new Error('error'));

    const documentNumber = 'test-document-number';
    const userPrincipalId = 'a user id';
    const request: any = {
      app : {claims: {sub: "test", email: "test@test.com"}},
      params : {documentType: "catchCertificate"},
      payload : {
        documentDelete: 'Yes',
        nextUri: '/test-url/{documentNumber}/test'
      },
      headers: {}
    };

    const result = await ComfirmDocumentDeleteController.confirmDocumentDelete(request, h, userPrincipalId, documentNumber, contactId);

    expect(mockDeleteDocument).toHaveBeenCalled();
    expect(mockDeleteDraftLink).toHaveBeenCalled();
    expect(mockReportDocumentDelete).toHaveBeenCalledWith(documentNumber);

    expect(result).toEqual({ user_id: 'a user id', ...request.payload });
    expect(mockLoggerError).toHaveBeenCalledWith('[REPORT-DOCUMENT-DELETE][test-document-number][ERROR][Error: error]');
  });
});