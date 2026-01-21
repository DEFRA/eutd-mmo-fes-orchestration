import * as Hapi from '@hapi/hapi';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { ProgressStatus } from '../persistence/schema/common';
import { catchCerts, storageNote, processingStatement } from '../services/documentNumber.service';
import { CatchCertificateProgress } from "../persistence/schema/frontEndModels/catchCertificate";
import { ProcessingStatementProgress } from "../persistence/schema/frontEndModels/processingStatement";
import { StorageDocumentProgress } from "../persistence/schema/frontEndModels/storageDocument";
import ProgressService from '../services/progress.service';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import logger from '../logger';
import { DocumentStatuses } from '../persistence/schema/catchCert';

export default class ProgressRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise<void>(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/progress/{journey}',
          options: {
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(
                request,
                h,
                async (userPrincipal, documentNumber, contactId) => {
                  const journey = request.params.journey;

                  switch (journey) {
                    case catchCerts:
                      return await ProgressService.get(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );
                    case processingStatement:
                      return await ProgressService.getProcessingStatementProgress(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );
                    case storageNote:
                      return await ProgressService.getStorageDocumentProgress(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );
                    default:
                      return null;
                  }
                }
              ).catch((e) => {
                logger.error(`[GET-PROGRESS][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get progress of pages for the frontend',
            tags: ['api']
          }
        },
        {
          method: 'GET',
          path: '/v1/progress/complete/{journey}',
          options: {
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(
                request,
                h,
                async (userPrincipal, documentNumber, contactId) => {
                  const journey = request.params.journey;

                  switch (journey) {
                    case catchCerts: {
                      const { completedSections, requiredSections, progress } = await ProgressService.get(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );

                      return completeProgressHandler(progress, completedSections, requiredSections, h);
                    }
                    case processingStatement: {
                      const { completedSections, requiredSections, progress } = await ProgressService.getProcessingStatementProgress(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );

                      // FI0-10647: Validate products have catches details, not just description
                      const psData = await ProcessingStatementService.getDraft(userPrincipal, documentNumber, contactId);
                      const products = psData?.exportData?.products || [];
                      const catches = psData?.exportData?.catches || [];
                      
                      const hasDescriptionOnlyProduct = products.some((product: any) => {
                        if (!product || typeof product !== 'object') return false;
                        
                        // Check if product has at least a description
                        const hasDescription = product.description || product.productDescription;
                        
                        // Check if product has catches by looking for catches with matching productId
                        const productCatches = catches.filter((c: any) => c.productId === product.id);
                        const hasCatches = productCatches.length > 0;
                        
                        // Product is invalid if it has description but no catches
                        return hasDescription && !hasCatches;
                      });

                      // Check if all sections are complete (excluding product validation)
                      if (completedSections === requiredSections && !hasDescriptionOnlyProduct) {
                        return h.response().code(200);
                      }

                      // Collect all validation errors including product validation
                      const errors = Object.keys(progress).reduce((acc, key) => {
                        if (progress[key] !== ProgressStatus.COMPLETED && progress[key] !== ProgressStatus.OPTIONAL && progress[key] !== '') {
                          return {
                            ...acc,
                            [key]: `error.${key}.incomplete`
                          }
                        }
                        return acc;
                      }, {});

                      // Add product validation error if products lack catches
                      if (hasDescriptionOnlyProduct) {
                        errors['processedProductDetails'] = 'error.processedProductDetails.incomplete';
                      }

                      // If there are any errors, return them
                      if (Object.keys(errors).length > 0) {
                        return h.response(errors).code(400);
                      }

                      return h.response().code(200);
                    }
                    case storageNote: {
                      const { completedSections, requiredSections, progress } = await ProgressService.getStorageDocumentProgress(
                        userPrincipal,
                        documentNumber,
                        contactId
                      );

                      return completeProgressHandler(progress, completedSections, requiredSections, h);
                    }
                    default:
                      return h.response({ progress: 'error.progress.invalid' }).code(400);
                  }
                },
                [DocumentStatuses.Draft, DocumentStatuses.Locked]
              ).catch((e) => {
                logger.error(`[GET-COMPLETE-PROGRESS][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Check progress complete before progressing to summary page for the frontend',
            tags: ['api']
          }
        },
      ]);
      resolve(null);
    });
  }
}

const completeProgressHandler = (
  progress: CatchCertificateProgress | ProcessingStatementProgress | StorageDocumentProgress,
  completedSections: number,
  requiredSections: number,
  h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
  ) => {
  if (completedSections === requiredSections) {
    return h.response().code(200);
  }

  const errors = Object.keys(progress).reduce((acc, key) => {
    if (progress[key] !== ProgressStatus.COMPLETED && progress[key] !== ProgressStatus.OPTIONAL && progress[key] !== '') {
      return {
        ...acc,
        [key]: `error.${key}.incomplete`
      }
    }

    return acc;
  }, {});

  return h.response(errors).code(400);
};