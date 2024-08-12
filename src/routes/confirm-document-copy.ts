import * as Hapi from '@hapi/hapi';
import * as CatchCertService from '../persistence/services/catchCert';
import * as ProcessingStatmentService from '../persistence/services/processingStatement';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { reportDraftCreated } from '../services/reference-data.service';
import { DocumentStatuses } from '../persistence/schema/catchCert';
import * as Joi from 'joi';
import DocumentNumberService, { catchCerts, processingStatement, storageNote } from '../services/documentNumber.service';
import { postEventData } from '../services/protective-monitoring.service';
import {
  JOURNEY,
  PROTECTIVE_MONITORING_PRIORITY_NORMAL,
  PROTECTIVE_MONITORING_VOID_TRANSACTION,
  PROTECTIVE_MONITORING_PRIORITY_UNUSUAL
} from '../services/constants';
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from '../helpers/errorExtractor';
import logger from '../logger';

import ServiceNames from '../validators/interfaces/service.name.enum';
import { HapiRequestApplicationStateExtended } from '../types';
export default class ConfirmDocumentCopyRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise<void>(resolve => {
      server.route([
        {
          method: 'POST',
          path: '/v1/confirm-copy-certificate',
          options: {
            security: true,
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(
                request,
                h,
                async (userPrincipal, documentNumber, contactId) => {
                  logger.debug(`[COPY-CERTIFICATE][${documentNumber}][START]`);

                  const roles: string[] = (request.app as HapiRequestApplicationStateExtended).claims.roles;
                  const requestByAdmin: boolean = roles ?
                    roles.includes('MMO-ECC-Service-Management')
                    || roles.includes('MMO-ECC-Support-User')
                    || roles.includes('MMO-ECC-IUU-Single-Liaison-Officer')
                    || roles.includes('MMO-ECC-Regulatory-User') : false;

                  logger.debug(`[COPY-CERTIFICATE][REQUESTED-BY-ADMIN][${requestByAdmin}]`);

                  const { journey, copyDocumentAcknowledged, voidOriginal, ipAddress, excludeLandings } = request.payload as any;
                  let newDocumentNumber: string;

                  switch(journey) {
                    case catchCerts:
                      newDocumentNumber = await CatchCertService.cloneCatchCertificate(documentNumber, userPrincipal, excludeLandings, contactId, requestByAdmin, voidOriginal);
                      break;
                    case processingStatement:
                      newDocumentNumber = await ProcessingStatmentService.cloneProcessingStatement(documentNumber, userPrincipal, contactId, requestByAdmin, voidOriginal);
                      break;
                    case storageNote:
                      newDocumentNumber = await StorageDocumentService.cloneStorageDocument(documentNumber, userPrincipal, contactId, requestByAdmin, voidOriginal);
                      break;
                    default:
                      throw 'JOURNEY-UNKNOWN'
                  }

                  logger.debug(`[COPY-CERTIFICATE][${documentNumber}][COPIED][${newDocumentNumber}]`);

                  logger.debug(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}]`);

                  reportDraftCreated(newDocumentNumber)
                    .catch(e =>
                      logger.error(`[COPY-CERTIFICATE][${documentNumber}][REPORTING][${newDocumentNumber}][ERROR][${e.stack || e}]`)
                    );

                  logger.debug(`[COPY-CERTIFICATE][${documentNumber}][SUCCESS]`);

                  if (voidOriginal) {
                    logger.debug(`[COPY-VOID-CERTIFICATE][${documentNumber}][START]`);

                    let voided = false;

                    switch(journey) {
                      case catchCerts:
                        voided = await CatchCertService.voidCatchCertificate(documentNumber, userPrincipal, contactId);
                        break;
                      case processingStatement:
                        voided = await ProcessingStatmentService.voidProcessingStatement(documentNumber, userPrincipal, contactId);
                        break;
                      case storageNote:
                        voided = await StorageDocumentService.voidStorageDocument(documentNumber, userPrincipal, contactId);
                        break;
                      default:
                        throw 'JOURNEY-UNKNOWN'
                    }

                    logger.debug(`[COPY-VOID-CERTIFICATE][${documentNumber}][VOIDED]`);

                    logger.debug(`[COPY-VOID-CERTIFICATE][${documentNumber}][REPORTING]`);
                    const monitoringInfo = `void/${JOURNEY[journey]}/dn:${documentNumber}`;
                    const app = request.app as HapiRequestApplicationStateExtended;
                    const sessionId = `${app.claims.auth_time}:${app.claims.contactId}`;
                    const transaction = `${PROTECTIVE_MONITORING_VOID_TRANSACTION}-${DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)}`;

                    const message = voided ? `User voided a ${JOURNEY[journey]}` : `An attempt was made to void a ${JOURNEY[journey]} not created by the current user`;
                    const priorityCode = voided ? PROTECTIVE_MONITORING_PRIORITY_NORMAL : PROTECTIVE_MONITORING_PRIORITY_UNUSUAL;

                    await postEventData(userPrincipal, message, monitoringInfo, ipAddress, priorityCode, sessionId, transaction)
                      .catch(error => logger.error(`[COPY-VOID-CERTIFICATE][${documentNumber}][EVENT-HUB][ERROR][${error.stack || error}]`));

                    logger.debug(`[COPY-VOID-CERTIFICATE][${documentNumber}][SUCCESS]`);
                  }

                  return h.response({ documentNumber, newDocumentNumber, voidOriginal, copyDocumentAcknowledged  });
                },
                [DocumentStatuses.Complete]
              ).catch(error => {
                logger.error(`[COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            description: 'Confirm selected document to be copied',
            tags: ['api', 'confirm-document-copy'],
            validate: {
              options: {
                abortEarly: false
              },
              payload: Joi.object({
                voidOriginal: Joi.boolean().required(),
                journey: Joi.string().required(),
                ipAddress: Joi.string().optional(),
                excludeLandings: Joi.boolean().optional(),
                copyDocumentAcknowledged: Joi.boolean().required().invalid(false)
              }),
              failAction: (req, h, error) => {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/check-copy-certificate',
          options: {
            security: true,
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(
                request,
                h,
                async (userPrincipal, documentNumber, contactId) => {
                  logger.debug(`[CHECK-COPY-CERTIFICATE][${documentNumber}][START]`);
                  const service = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);
                  let canCopy = false;

                  switch (service) {
                    case ServiceNames.CC:
                      canCopy = await CatchCertService.checkDocument(documentNumber, userPrincipal, contactId, "catchCertificate");
                      break;
                    case ServiceNames.PS:
                      canCopy = !!await ProcessingStatmentService.checkDocument(documentNumber, userPrincipal, contactId);
                      break;
                    case ServiceNames.SD:
                      canCopy = !!await StorageDocumentService.checkDocument(documentNumber, userPrincipal, contactId);
                      break;
                    default:
                      throw 'INVALID-SERVICE-NAME';
                  }

                  logger.debug(`[CHECK-COPY-CERTIFICATE][${documentNumber}][SUCCESS][${canCopy}]`);

                  return h.response({ canCopy });
                },
                [DocumentStatuses.Complete]
              ).catch(error => {
                logger.error(`[CHECK-COPY-CERTIFICATE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            description: 'Check whether document can be copied',
            tags: ['api', 'check-copy-certificate'],
          }
        }
      ]);
      resolve(null);
    });
  }
}
