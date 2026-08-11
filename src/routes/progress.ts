import * as Hapi from '@hapi/hapi';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { ProgressStatus } from '../persistence/schema/common';
import { CATCH_CERTIFICATE_KEY, PROCESSING_STATEMENT_KEY, STORAGE_NOTES_KEY } from '../session_store/constants';
import { CatchCertificateProgress } from "../persistence/schema/frontEndModels/catchCertificate";
import { ProcessingStatementProgress } from "../persistence/schema/frontEndModels/processingStatement";
import { StorageDocumentProgress } from "../persistence/schema/frontEndModels/storageDocument";
import ProgressService from '../services/progress.service';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import logger from '../logger';
import { DocumentStatuses } from '../persistence/schema/catchCert';

export default class ProgressRoutes {

  private async getProgressForJourney(
    userPrincipal: string,
    documentNumber: string,
    contactId: string,
    journey: string
  ): Promise<any> {
    switch (journey) {
      case CATCH_CERTIFICATE_KEY:
        return ProgressService.get(userPrincipal, documentNumber, contactId);
      case PROCESSING_STATEMENT_KEY:
        return ProgressService.getProcessingStatementProgress(userPrincipal, documentNumber, contactId);
      case STORAGE_NOTES_KEY:
        return ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);
      default:
        return null;
    }
  }

  private hasProductWithoutCatches(products: any[], catches: any[]): boolean {
    // FI0-10647: Validate products have catches details, not just description
    return products.some((product: any) => {
      if (!product || typeof product !== 'object') return false;
      const hasDescription = product.description || product.productDescription;
      const productCatches = catches.filter((c: any) => c.productId === product.id);
      return hasDescription && productCatches.length === 0;
    });
  }

  private collectProgressErrors(progress: ProcessingStatementProgress): Record<string, string> {
    return Object.keys(progress).reduce((acc, key) => {
      if (progress[key] !== ProgressStatus.COMPLETED && progress[key] !== ProgressStatus.OPTIONAL && progress[key] !== '') {
        return { ...acc, [key]: `error.${key}.incomplete` };
      }
      return acc;
    }, {} as Record<string, string>);
  }

  private async handlePsCompleteProgress(
    userPrincipal: string,
    documentNumber: string,
    contactId: string,
    completedSections: number,
    requiredSections: number,
    progress: ProcessingStatementProgress,
    h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
  ): Promise<any> {
    const psData = await ProcessingStatementService.getDraft(userPrincipal, documentNumber, contactId);
    const products = psData?.exportData?.products || [];
    const catches = psData?.exportData?.catches || [];
    const hasDescriptionOnlyProduct = this.hasProductWithoutCatches(products, catches);

    if (completedSections === requiredSections && !hasDescriptionOnlyProduct) {
      return h.response().code(200);
    }

    const errors = this.collectProgressErrors(progress);

    if (hasDescriptionOnlyProduct) {
      errors['processedProductDetails'] = 'error.processedProductDetails.incomplete';
    }

    if (Object.keys(errors).length > 0) {
      return h.response(errors).code(400);
    }

    return h.response().code(200);
  }

  private async getCompleteProgressForJourney(
    userPrincipal: string,
    documentNumber: string,
    contactId: string,
    journey: string,
    h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>
  ): Promise<any> {
    switch (journey) {
      case CATCH_CERTIFICATE_KEY: {
        const { completedSections, requiredSections, progress } = await ProgressService.get(userPrincipal, documentNumber, contactId);
        return completeProgressHandler(progress, completedSections, requiredSections, h);
      }
      case PROCESSING_STATEMENT_KEY: {
        const { completedSections, requiredSections, progress } = await ProgressService.getProcessingStatementProgress(userPrincipal, documentNumber, contactId);
        return this.handlePsCompleteProgress(userPrincipal, documentNumber, contactId, completedSections, requiredSections, progress as ProcessingStatementProgress, h);
      }
      case STORAGE_NOTES_KEY: {
        const { completedSections, requiredSections, progress } = await ProgressService.getStorageDocumentProgress(userPrincipal, documentNumber, contactId);
        return completeProgressHandler(progress, completedSections, requiredSections, h);
      }
      default:
        return h.response({ progress: 'error.progress.invalid' }).code(400);
    }
  }

  private buildProgressRoute(): Hapi.ServerRoute {
    return {
      method: 'GET',
      path: '/v1/progress/{journey}',
      options: {
        security: true,
        cors: true,
        handler: async (request, h) => {
          return withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
            return this.getProgressForJourney(userPrincipal, documentNumber, contactId, request.params.journey as string);
          }).catch((e) => {
            logger.error(`[GET-PROGRESS][ERROR][${e.stack || e}]`);
            return h.response().code(500);
          });
        },
        description: 'Get progress of pages for the frontend',
        tags: ['api']
      }
    };
  }

  private buildCompleteProgressRoute(): Hapi.ServerRoute {
    return {
      method: 'GET',
      path: '/v1/progress/complete/{journey}',
      options: {
        security: true,
        cors: true,
        handler: async (request, h) => {
          return withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
            return this.getCompleteProgressForJourney(userPrincipal, documentNumber, contactId, request.params.journey as string, h);
          }, [DocumentStatuses.Draft, DocumentStatuses.Locked])
          .catch((e) => {
            logger.error(`[GET-COMPLETE-PROGRESS][ERROR][${e.stack || e}]`);
            return h.response().code(500);
          });
        },
        description: 'Check progress complete before progressing to summary page for the frontend',
        tags: ['api']
      }
    };
  }

  public async register(server: Hapi.Server): Promise<void> {
    server.route([
      this.buildProgressRoute(),
      this.buildCompleteProgressRoute()
    ]);
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