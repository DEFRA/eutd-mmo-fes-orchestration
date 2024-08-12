import ApplicationConfig from '../applicationConfig';
import { BlobServiceClient, BlobDownloadResponseParsed } from '@azure/storage-blob';
import { IExportCertificateResults } from '../persistence/schema/exportCertificateResults';
import { BLOB_STORAGE_CONTAINER_NAME } from './constants';
import logger from '../logger';

const Wreck = require('@hapi/wreck');
const NotifyClient = require('notifications-node-client').NotifyClient;

export const downloadPdfBlob = async (documentNumber: string, uri: string): Promise<BlobDownloadResponseParsed> => {
  logger.info(`[GOV-UK-NOTIFY][DOWNLOAD-PDF][${documentNumber}][BLOB][${uri}]`);
  const blobServiceClient = BlobServiceClient.fromConnectionString(ApplicationConfig._blobStorageConnection);
  const containerClient = blobServiceClient.getContainerClient(BLOB_STORAGE_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(uri);

  let uploaded = await blockBlobClient.exists();
  let retries = 5;

   while (!uploaded) {
     retries--;
     logger.info(`[GOV-UK-NOTIFY][${documentNumber}][BLOB][${uri}][RETRY-REMAINING][${retries}]`);

     if (retries <= 0 && !uploaded) {
       logger.error(`[GOV-UK-NOTIFY][ERROR][${documentNumber}][BLOB][${uri}][DOES-NOT-EXIST]`);
       throw new Error(`${uri} blob does not exists`);
     }

     uploaded = await blockBlobClient.exists();
   }

  return await blockBlobClient.download();
}

export class NotifyService {

  public static async sendSuccessEmailNotifyMessage(userEmail: string, results: IExportCertificateResults) {
    const { documentNumber, uri } = results;

    if (!ApplicationConfig._fesNotifyApiKey)
      throw new Error('API Key is not defined');

    if (!ApplicationConfig._fesNotifySuccessTemplateId || !userEmail)
      throw new Error('Template ID or Email Address are not defined');

    logger.info(`[GOV-UK-NOTIFY][SENDING-SUCCESS-EMAIL][${documentNumber}]`);
    const downloadBlockBlobResponse = await downloadPdfBlob(documentNumber, uri);

    if (!downloadBlockBlobResponse.readableStreamBody) {
      logger.error(`[GOV-UK-NOTIFY][BLOB-STORAGE][${documentNumber}][GET-PDF-FROM-BLOB][${uri}][NO-READABLE-STREAM-BODY][FAIL]`);
      throw new Error('Fail to get readable stream');
    }

    logger.info(`[GOV-UK-NOTIFY][BLOB-STORAGE][${documentNumber}][GET-PDF-FROM-BLOB][${uri}][SUCCESS]`);

    const notifyClient = new NotifyClient(ApplicationConfig._fesNotifyApiKey);
    const upload = notifyClient.prepareUpload(await Wreck.read(downloadBlockBlobResponse.readableStreamBody, {}));
    await notifyClient
      .sendEmail(ApplicationConfig._fesNotifySuccessTemplateId, userEmail, {
        personalisation: {
          documentId: documentNumber,
          pdfURL: upload
        },
        reference: documentNumber
      })
      .then(res => logger.info(`[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(res)}]`))
      .catch(err => {
        if (err.response)
          logger.error(`[GOV-UK-NOTIFY][FAILURE][${documentNumber}][STATUS CODE: ${err.response.data.status_code}][ERRORS: ${JSON.stringify(err.response.data.errors)}]`);
      });
  }

  public static async sendFailureEmailNotifyMessage(userEmail: string, documentNumber: string) {

    if (!ApplicationConfig._fesNotifyApiKey)
      throw new Error('API Key is not defined');

    if (!ApplicationConfig._fesNotifyFailureTemplateId || !userEmail)
      throw new Error('Template ID or Email Address are not defined');

    logger.info(`[GOV-UK-NOTIFY][SENDING-FAILURE-EMAIL][${documentNumber}]`);

    const notifyClient = new NotifyClient(ApplicationConfig._fesNotifyApiKey);
    await notifyClient
      .sendEmail(ApplicationConfig._fesNotifyFailureTemplateId , userEmail, {
        personalisation: {
          documentId: documentNumber
        },
        reference: documentNumber
      })
      .then(res => logger.info(`[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(res)}]`))
      .catch(err => {
        if (err.response)
          logger.error(`[GOV-UK-NOTIFY][FAILURE][${documentNumber}][STATUS CODE: ${err.response.data.status_code}][ERRORS: ${JSON.stringify(err.response.data.errors)}]`);
      });
  }

  public static async sendTechnicalErrorEmailNotifyMessage(userEmail: string, documentNumber: string) {
    if (!ApplicationConfig._fesNotifyApiKey)
      throw new Error('API Key is not defined');

    if (!ApplicationConfig._fesNotifyTechnicalErrorTemplateId || !userEmail)
      throw new Error('Template ID or Email Address are not defined');

    logger.info(`[GOV-UK-NOTIFY][SENDING-TECHNICAL-ERROR-EMAIL][${documentNumber}]`);

    const notifyClient = new NotifyClient(ApplicationConfig._fesNotifyApiKey);
    const personalisation = {
      documentId: documentNumber
    };

    await notifyClient
      .sendEmail(ApplicationConfig._fesNotifyTechnicalErrorTemplateId, userEmail, {
        personalisation: personalisation,
        reference: documentNumber
      })
      .then(res => logger.info(`[GOV-UK-NOTIFY][SUCCESS][${documentNumber}][RESPONSE][${JSON.stringify(res)}]`))
      .catch(err => {
        if (err.response)
          logger.error(`[GOV-UK-NOTIFY][FAILURE][${documentNumber}][STATUS CODE: ${err.response.data.status_code}][ERRORS: ${JSON.stringify(err.response.data.errors)}]`);
      });
  }

}