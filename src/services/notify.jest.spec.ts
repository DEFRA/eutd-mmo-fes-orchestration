import ApplicationConfig from '../applicationConfig';
import logger from '../logger';
import * as SUT from './notify.service';

let mockSendEmail: jest.Mock;
let mockPrepareUpload: jest.Mock;
let mockFromConnectionString: jest.Mock;
let mockGetContainerClient: jest.Mock;
let mockGetBlockBlobClient: jest.Mock;
let mockExists: jest.Mock;
let mockDownload: jest.Mock;

jest.mock('notifications-node-client', () => {
  class NotifyClient {
    apiKey: string;

    constructor(apiKey: string) {
      this.apiKey = apiKey
    }

    sendEmail = mockSendEmail;
    prepareUpload = mockPrepareUpload;
  }

  return {
    NotifyClient: NotifyClient
  }
});

jest.mock('@azure/storage-blob', () => {
  class BlobServiceClient {
    public static fromConnectionString(connectionString) {
      return mockFromConnectionString(connectionString)
    }
  }

  return {
    BlobServiceClient
  }
});

jest.mock('@hapi/wreck', () => ({
  read: jest.fn().mockResolvedValue(''),
  prepareUpload: jest.fn().mockReturnValue(''),
}));

describe('when downloading pdf blobs', () => {
  const documentNumber = 'DOCUMENT123';
  const blobName = '_some-blob-name';
  const blobResult = {};

  let mockInfoLogger: jest.SpyInstance;
  let mockErrorLogger: jest.SpyInstance;

  beforeEach(() => {
    process.env.BLOB_STORAGE_CONNECTION = 'BLOB-STORAGE-CONNECTION';
    process.env.REF_SERVICE_BASIC_AUTH_USER ='REF-SERVICE-BASIC-AUTH-USER';
    process.env.REF_SERVICE_BASIC_AUTH_PASSWORD ='REF-SERVICE-BASIC-AUTH-PASSWORD';
    process.env.ORCH_REDIS_PASSWORD ='ORCH-REDIS-PASSWORD';
    process.env.COSMOS_DB_RW_CONNECTION_URI ='COSMOS-DB-RW-CONNECTION-URI';
    process.env.FES_NOTIFY_API_KEY ='FES-NOTIFY-API-KEY';
    process.env.FES_API_MASTER_PASSWORD ='FES-API-MASTER-PASSWORD';

    ApplicationConfig.loadProperties();

    mockInfoLogger = jest.spyOn(logger, 'info');
    mockErrorLogger = jest.spyOn(logger, 'error');

    mockExists = jest.fn().mockResolvedValue(true);
    mockDownload = jest.fn().mockResolvedValue(blobResult);
    mockGetBlockBlobClient = jest.fn().mockImplementation(() => ({
      exists: mockExists,
      download: mockDownload
    }))
    mockGetContainerClient = jest.fn().mockImplementation(() => ({
      getBlockBlobClient: mockGetBlockBlobClient
    }));
    mockFromConnectionString = jest.fn().mockImplementation(() => ({
      getContainerClient: mockGetContainerClient
    }));
  });

  afterEach(() => {
    mockInfoLogger.mockRestore();
    mockErrorLogger.mockRestore();
    jest.restoreAllMocks();
  });

  it('will get blob service client using blob connection string and download blob', async () => {
    const result = await SUT.downloadPdfBlob(documentNumber, blobName);
    expect(mockInfoLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${blobName}]`);
    expect(mockFromConnectionString).toHaveBeenCalledWith(process.env.BLOB_STORAGE_CONNECTION);
    expect(mockGetContainerClient).toHaveBeenCalledWith('export-certificates');
    expect(mockGetBlockBlobClient).toHaveBeenCalledWith(blobName);
    expect(result).toEqual(blobResult);
  });

  it('will download blob on the thrid attempt', async () => {
    mockExists = jest.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true)

    const result = await SUT.downloadPdfBlob(documentNumber, blobName);

    expect(mockInfoLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${blobName}]`);
    expect(mockFromConnectionString).toHaveBeenCalledWith(process.env.BLOB_STORAGE_CONNECTION);
    expect(mockGetContainerClient).toHaveBeenCalledWith('export-certificates');
    expect(mockGetBlockBlobClient).toHaveBeenCalledWith(blobName);

    expect(mockInfoLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${blobName}]`);

    expect(mockInfoLogger).toHaveBeenNthCalledWith(2, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${4}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(3, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${3}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(4, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${2}]`);

    expect(mockErrorLogger).not.toHaveBeenCalled();

    expect(result).toEqual(blobResult);
  });

  it('will throw if blob does not exists', async () => {
    mockExists = jest.fn().mockResolvedValue(false);

    await expect(SUT.downloadPdfBlob(documentNumber, blobName)).rejects.toThrow(`${blobName} blob does not exists`);

    expect(mockInfoLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${blobName}]`);
    expect(mockFromConnectionString).toHaveBeenCalledWith(process.env.BLOB_STORAGE_CONNECTION);
    expect(mockGetContainerClient).toHaveBeenCalledWith('export-certificates');
    expect(mockGetBlockBlobClient).toHaveBeenCalledWith(blobName);

    expect(mockInfoLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${blobName}]`);

    expect(mockInfoLogger).toHaveBeenNthCalledWith(2, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${4}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(3, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${3}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(4, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${2}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(5, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${1}]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(6, `[GOV-UK-NOTIFY][${documentNumber}][BLOB][${blobName}][RETRY-REMAINING][${0}]`);

    expect(mockErrorLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][ERROR][${documentNumber}][BLOB][${blobName}][DOES-NOT-EXIST]`);
  });
});

describe('when sending successful email notifications', () => {
  const userEmail = 'foo@foo.com';
  const documentNumber = 'DOCUMENT123';
  const successTemplateId = 'some-success-template-id';
  const upload = '';
  const options = {
    personalisation: {
      documentId: documentNumber,
      pdfURL: upload
    },
    reference: documentNumber
  };
  const results = {
    documentNumber: documentNumber,
    uri: "_some_uri.pdf",
    isBlockingEnabled: false,
    report: [{
      species: "",
      presentation: "",
      state: "",
      date: new Date(),
      vessel: "",
      failures: []
    }]
  }
  const response = {
    id: 'some-response-id',
    reference: 'DOCUMENT123',
    content: {
      subject: 'Offline Validation Success',
      body: 'Dear Bob, your offline validation was successful, please click the link below to view your Catch Certificate document',
      from_email: 'noreply@mmo.defra.com'
    },
    uri: 'some-notifications-gov-update-uri',
    template: {
      id: 'some-success-template-id',
      version: 1,
      uri: 'some-notifications-gov-template-uri'
    }
  };

  const downloadResponseParsed: any = {
    readableStreamBody: 'someDownloadableStream'
  }

  let mockInfoLogger: jest.SpyInstance;
  let mockErrorLogger: jest.SpyInstance;
  let mockDownloadPdf: jest.SpyInstance;

  beforeEach(() => {
    ApplicationConfig.loadProperties();

    ApplicationConfig._fesNotifySuccessTemplateId = successTemplateId;
    ApplicationConfig._blobStorageConnection = 'myAccount';

    mockInfoLogger = jest.spyOn(logger, 'info');
    mockErrorLogger = jest.spyOn(logger, 'error');
    mockDownloadPdf = jest.spyOn(SUT, 'downloadPdfBlob')
      .mockResolvedValue(downloadResponseParsed)
    mockSendEmail = jest.fn()
      .mockResolvedValue(response);
    mockPrepareUpload = jest.fn().mockReturnValue(upload);
  });

  afterEach(() => {
    mockInfoLogger.mockRestore();
    mockErrorLogger.mockRestore();
    mockDownloadPdf.mockRestore();
    mockSendEmail.mockRestore();
    mockPrepareUpload.mockRestore();
  });

  it('should send an email notify via GOV.UK notify if it is success', async () => {
    await SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results);
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenNthCalledWith(1, successTemplateId, 'foo@foo.com', options);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(3, `[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(response)}]`);
  });

  it('should throw an error if template id is not set', async () => {
    ApplicationConfig._fesNotifySuccessTemplateId = undefined;
    await expect(SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results)).rejects.toThrow('Template ID or Email Address are not defined');
  });

  it('should throw error if api key is not set', async () => {
    ApplicationConfig._fesNotifyApiKey = undefined;
    await expect(SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results)).rejects.toThrow('API Key is not defined');
  });

  it('should check if downloadPdfBlob is called', async () => {
    mockPrepareUpload.mockReturnValue('');
    await SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results);
    expect(mockPrepareUpload).toHaveBeenCalled();
    expect(mockPrepareUpload).toHaveBeenNthCalledWith(1, upload);
  });

  it('should throw error if downloadBlockBlobResponse is false', async () => {
    const downloadResponseParsed: any = {
      readableStreamBody: false,
    };
    mockDownload.mockReturnValue(false);
    mockDownloadPdf.mockResolvedValue(downloadResponseParsed);
    await expect(SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results)).rejects.toThrow('Fail to get readable stream');
    expect(mockErrorLogger).toHaveBeenCalled();
    expect(mockErrorLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][BLOB-STORAGE][${documentNumber}][GET-PDF-FROM-BLOB][_some_uri.pdf][NO-READABLE-STREAM-BODY][FAIL]`);
  });

  it('should throw error if send email fails', async () => {
    mockSendEmail = jest.fn()
      .mockRejectedValue({
        response: {
          data: {
            status_code: '400',
            errors: [{
              error: 'BadRequestError',
              message: "Can't send to this recipient using a team-only API key"
            }]
          }
        }
      });

    await SUT.NotifyService.sendSuccessEmailNotifyMessage(userEmail, results);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockErrorLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][FAILURE][DOCUMENT123][STATUS CODE: 400][ERRORS: [{"error":"BadRequestError","message":"Can't send to this recipient using a team-only API key"}]]`);
  });
});

describe('when sending failure email notifications', () => {
  const userEmail = 'foo@foo.com';
  const documentNumber = 'DOCUMENT123';
  const options = {
    personalisation: {
      documentId: documentNumber,
    },
    reference: documentNumber,
  };
  const response = {
    id: 'some-response-id',
    reference: 'DOCUMENT123',
    content: {
      subject: 'Offline Validation Success',
      body: 'Dear Bob, your offline validation was successful, please click the link below to view your Catch Certificate document',
      from_email: 'noreply@mmo.defra.com',
    },
    uri: 'some-notifications-gov-update-uri',
    template: {
      id: 'some-success-template-id',
      version: 1,
      uri: 'some-notifications-gov-template-uri',
    },
  };

  let mockInfoLogger: jest.SpyInstance;
  let mockErrorLogger: jest.SpyInstance;

  beforeEach(() => {
    ApplicationConfig.loadProperties();

    ApplicationConfig._fesNotifyFailureTemplateId = 'some-failure-template-id';

    mockInfoLogger = jest.spyOn(logger, 'info');
    mockErrorLogger = jest.spyOn(logger, 'error');
    mockSendEmail = jest.fn().mockResolvedValue(response);
  });

  afterEach(() => {
    mockInfoLogger.mockRestore();
    mockErrorLogger.mockRestore();
    mockSendEmail.mockRestore();
  });

  it('should send an email notify via GOV.UK notify', async () => {
    await SUT.NotifyService.sendFailureEmailNotifyMessage(userEmail, documentNumber);
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenNthCalledWith(1, 'some-failure-template-id', 'foo@foo.com', options);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(1, `[GOV-UK-NOTIFY][SENDING-FAILURE-EMAIL][DOCUMENT123]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(2, `[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(response)}]`);
  });

  it('should throw error on missing required args', async () => {
    ApplicationConfig._fesNotifyFailureTemplateId = undefined;
    await expect(() =>
      SUT.NotifyService.sendFailureEmailNotifyMessage(userEmail, documentNumber)
    ).rejects.toThrow(
      new Error('Template ID or Email Address are not defined')
    );
  });

  it('should log any errors thrown by GOV.uk notify application failure sendEmail', async () => {
    mockSendEmail = jest.fn()
      .mockRejectedValue({
        response: {
          data: {
            status_code: '400',
            errors: [{
              error: 'BadRequestError',
              message: "Can't send to this recipient using a team-only API key"
            }]
          }
        }
      });
    await SUT.NotifyService.sendFailureEmailNotifyMessage(userEmail, documentNumber);

    expect(mockErrorLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][FAILURE][${documentNumber}][STATUS CODE: 400][ERRORS: ${JSON.stringify([{
      error: 'BadRequestError',
      message: "Can't send to this recipient using a team-only API key"
    }])}]`);
  });

  it('should throw error API key is undefined for response', async () => {
    ApplicationConfig._fesNotifyApiKey = undefined;
    await expect(SUT.NotifyService.sendFailureEmailNotifyMessage(userEmail, documentNumber))
      .rejects.toThrow(new Error('API Key is not defined'));
  });

});

describe('when sending technical error email notifications', () => {
  const userEmail = 'foo@foo.com';
  const documentNumber = 'DOCUMENT123';
  const options = {
    personalisation: {
      documentId: documentNumber,
    },
    reference: documentNumber,
  };
  const response = {
    id: 'some-response-id',
    reference: 'DOCUMENT123',
    content: {
      subject: 'Your catch certificate application has a technical error',
      body: 'Dear Bob, your offline validation was successful, please click the link below to view your Catch Certificate document',
      from_email: 'noreply@mmo.defra.com',
    },
    uri: 'some-notifications-gov-update-uri',
    template: {
      id: 'some-success-template-id',
      version: 1,
      uri: 'some-notifications-gov-template-uri',
    },
  };

  let mockInfoLogger: jest.SpyInstance;
  let mockErrorLogger: jest.SpyInstance;

  beforeEach(() => {
    ApplicationConfig.loadProperties();

    ApplicationConfig._fesNotifyTechnicalErrorTemplateId =
      'some-failure-template-id';

    mockInfoLogger = jest.spyOn(logger, 'info');
    mockErrorLogger = jest.spyOn(logger, 'error');
    mockSendEmail = jest.fn().mockResolvedValue(response);
  });

  afterEach(() => {
    mockInfoLogger.mockRestore();
    mockErrorLogger.mockRestore();
    mockSendEmail.mockRestore();
  });

  it('should log any errors thrown by GOV.UK notify technical sendEmail', async () => {
    mockSendEmail.mockRejectedValue({
      response: {
        data: {
          status_code: '400',
          errors: [
            {
              error: 'BadRequestError',
              message: "Can't send to this recipient using a team-only API key",
            },
          ],
        },
      },
    });

    await SUT.NotifyService.sendTechnicalErrorEmailNotifyMessage(userEmail, documentNumber);

    expect(mockSendEmail).toHaveBeenNthCalledWith(1,'some-failure-template-id','foo@foo.com',{reference: documentNumber,personalisation: { documentId: 'DOCUMENT123'}});
    expect(mockErrorLogger).toHaveBeenCalledWith(`[GOV-UK-NOTIFY][FAILURE][${documentNumber}][STATUS CODE: 400][ERRORS: ${JSON.stringify([{error: 'BadRequestError',message: "Can't send to this recipient using a team-only API key",},])}]`);
});

  it('should send an email notify via GOV.UK notify', async () => {
    await SUT.NotifyService.sendTechnicalErrorEmailNotifyMessage(userEmail, documentNumber);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenNthCalledWith(1,'some-failure-template-id','foo@foo.com', options);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(1,`[GOV-UK-NOTIFY][SENDING-TECHNICAL-ERROR-EMAIL][DOCUMENT123]`);
    expect(mockInfoLogger).toHaveBeenNthCalledWith(2,`[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(response)}]`);
  });

  it('should throw error API key is undefined for response', async () => {
    ApplicationConfig._fesNotifyApiKey = undefined;
    await expect(SUT.NotifyService.sendTechnicalErrorEmailNotifyMessage(userEmail, documentNumber))
      .rejects.toThrow(new Error('API Key is not defined'));
  });

  it('should throw error Template ID is not defined', async () => {
    ApplicationConfig._fesNotifyTechnicalErrorTemplateId = undefined;

    await expect(SUT.NotifyService.sendTechnicalErrorEmailNotifyMessage(userEmail, documentNumber))
      .rejects.toThrow(new Error('Template ID or Email Address are not defined'));
  });
  it('should throw error Email Address is not defined', async () => {
    await expect(SUT.NotifyService.sendTechnicalErrorEmailNotifyMessage(undefined, documentNumber))
      .rejects.toThrow(new Error('Template ID or Email Address are not defined'));
  });
});
