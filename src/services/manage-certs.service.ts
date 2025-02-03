import axios from 'axios';
import { MongoConnection } from "../persistence/mongo";
import { BLOB_STORAGE_CONTAINER_NAME } from "./constants";
import { baseConfig } from "../persistence/schema/base";
import { reportDocumentVoided } from "./reference-data.service";
import ApplicationConfig from "../applicationConfig";
import logger from "../logger";
import { validateDocumentOwner } from '../validators/documentOwnershipValidator';
import { SSL_OP_LEGACY_SERVER_CONNECT } from "constants";
import { voidConsolidateLandings } from "./landings-consolidate.service";
import ServiceNames from '../validators/interfaces/service.name.enum';
import DocumentNumberService from './documentNumber.service';
import * as pdfService from 'mmo-ecc-pdf-svc';

const https = require('https');

export default class ManageCertsService {

  public static async deleteDraftCertificate(documentNumber: string) {
    const document = await MongoConnection.findOne(baseConfig.collection, {"documentNumber" : documentNumber}) as any;
    const blobName = ManageCertsService.extractBlobName(document.documentUri);

    pdfService.deleteBlob(BLOB_STORAGE_CONTAINER_NAME, blobName);
    await MongoConnection.deleteOne(baseConfig.collection, {"documentNumber" : documentNumber});
  }

  public static async voidCertificate(documentNumber: string, userPrincipalId: string, contactId: string) {
    let voidSuccess = false;

    const document: any = await MongoConnection.findOne(baseConfig.collection, {"documentNumber" : documentNumber})
      .catch(error => logger.error(`[DOCUMENT-VOID][${documentNumber}][ERROR][${error.stack || error}]`));

      if(!document) {
      return false;
    }

    const ownerValidation = validateDocumentOwner(document, userPrincipalId, contactId);
    if (document && ownerValidation) {
      await MongoConnection.updateStatusAsVoid(baseConfig.collection, {"documentNumber" : documentNumber});
      await reportDocumentVoided(documentNumber)
        .catch(e => logger.error(`[REPORT-DOCUMENT-VOID][${documentNumber}][ERROR][${e}]`));
       voidSuccess = true;

      const data = {
        "certNumber": documentNumber,
        "timestamp": new Date().toISOString().toString(),
        "status": "VOID"
      }

      const agent = new https.Agent({
        secureOptions: SSL_OP_LEGACY_SERVER_CONNECT
      });

      const config = {
        headers: {
          'X-API-KEY': ApplicationConfig._businessContinuityKey,
          'accept': 'application/json'
        },
        httpsAgent: agent
      }

      axios.put(`${ApplicationConfig._businessContinuityUrl}/api/certificates/${documentNumber}`, data, config)
      .then(()  => logger.info('Data sent to BC server'))
      .catch(err => logger.error(`Error - Data not sent to BC server: ${err}`));

      const serviceName: ServiceNames = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);

      if (serviceName === ServiceNames.CC) {
         voidConsolidateLandings(documentNumber)
          .catch(e => logger.error(`[LANDING-CONSOLIDATION][${documentNumber}][ERROR][${e}]`));
      }
   }

    return voidSuccess;
  }

  private static extractBlobName(documentUri: string) {
    const urlMinusQueryPath = documentUri.split("?")[0];
    const urlParts = urlMinusQueryPath.split("/");

    return urlParts[urlParts.length-1];
  }

}
