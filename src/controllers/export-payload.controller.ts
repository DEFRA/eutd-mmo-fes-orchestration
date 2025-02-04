import * as Hapi from '@hapi/hapi';
import logger from '../logger';
import acceptsHtml from '../helpers/acceptsHtml';
import { cloneDeep } from 'lodash';
import { getVessel } from "../services/reference-data.service";
import SaveAsDraftService from '../services/saveAsDraft.service';
import DocumentNumberService from '../services/documentNumber.service';
import VesselValidator from '../services/vesselValidator.service';
import * as LandingValidator from '../validators/ccLandingValidator';
import * as ProductValidator from '../validators/ccProductValidator';
import * as ProtectiveMonitoringService from '../services/protective-monitoring.service';
import {
  PROTECTIVE_MONITORING_PRIORITY_NORMAL,
  PROTECTIVE_MONITORING_COMPLETED_TRANSACTION
} from '../services/constants';
import { CATCH_CERTIFICATE_KEY, DRAFT_HEADERS_KEY } from '../session_store/constants';
import errorExtractor from '../helpers/errorExtractor';
import ExportPayloadService from '../services/export-payload.service';
import * as PayloadSchema from '../persistence/schema/frontEndModels/payload';
import { fishingVessel } from '../persistence/schema/frontEndModels/transport';
import { IExportCertificateResults } from '../persistence/schema/exportCertificateResults';
import applicationConfig from '../applicationConfig';
import { DocumentStatuses, LandingsEntryOptions } from '../persistence/schema/catchCert';
import { getRandomNumber } from '../helpers/utils/utils';
import SummaryErrorsService from '../services/summaryErrors.service';
import TransportService from '../services/transport.service';
import * as CatchCertService from '../persistence/services/catchCert';
import ExportLocationService from '../services/exportLocation.service';
import { NotifyService } from '../services/notify.service';
import { HapiRequestApplicationStateExtended } from '../types';
import { ProductsLanded, LandingStatus, ProductLanded } from '../persistence/schema/frontEndModels/payload';

export default class ExportPayloadController {

  public static async validate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = { ...(req.payload as object) };
    const exportPayload: PayloadSchema.ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    let errors = {};
    ExportPayloadController.checkPayloadItems(exportPayload, errors);

    if (Object.keys(errors).length === 0) {
      try {
        await VesselValidator.checkVesselWithDate(exportPayload.items);
      } catch (e) {
        errors['vessel_license'] = 'Please contact support.';
      }
    }

    const fromEntries = (arr) =>
      Object.assign({}, ...Array.from(arr, ([k, v]) => ({ [k]: v })));

    if (Object.keys(errors).length === 0) {
      const validations = await ProductValidator.validateProducts(
        exportPayload.items
      );
      errors = fromEntries(
        validations
          .filter((v) => v.result === false && v.validator === "seasonalFish")
          .map((v) => [
            `vessel_${v.id}_${v.landingId}`,
            `${v.species.label} was subject to fishing restrictions on your specified Landing date. Please refer to GOV.UK for further guidance.`,
          ])
      );
    }

    if (Object.keys(errors).length > 0) {
      exportPayload.errors = errors;
    } else {
      exportPayload.errors = undefined;
    }

    const result = await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);

    return ExportPayloadController.handleValidateResponse(req, h, savingAsDraft, payload, result);
  }

  static readonly checkPayloadItems = (exportPayload, errors) => {
    return exportPayload.items.forEach((item) => {
      if (!item.landings || item.landings.length === 0) {
        errors['product_' + item.product.id] = {
          key: (exportPayload.items.length > 1) ? 'error.products.landing.missing' : 'error.product.landing.missing',
          params: {
            species: item.product.species.label,
            state: item.product.state.label,
            presentation: item.product.presentation.label,
            commodityCode: item.product.commodityCode
          }
        }
      } else {

        item.landings = item.landings.filter((landing) => {
          // Filter out empty landings that havent been submitted
          return !(!landing.error && !landing.model.vessel && !landing.model.dateLanded && !landing.model.exportWeight);
        });

        item.landings.forEach((landing) => {
          if ("invalid" === landing.error) {
            errors["vessel_" + item.product.id + "_" + landing.model.id] =
              item.product.species.label +
              ", " +
              item.product.state.label +
              ", " +
              item.product.presentation.label +
              " has an invalid landing";
          } else {
            landing.addMode = undefined;
            landing.editMode = undefined;
          }
        });
      }
    });
  }

  static readonly handleValidateResponse = (
    req: Hapi.Request,
    h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>,
    savingAsDraft: boolean,
    payload: any,
    result: ProductsLanded
  ) => {
    if (acceptsHtml(req.headers)) {
      if (!result.errors || result.errors.length === 0) {
        if (savingAsDraft) {
          return h.redirect(payload.dashboardUri);
        } else {
          return h.redirect(payload.nextUri);
        }
      } else {
        return h.redirect(payload.currentUri);
      }
    } else if (!result.errors || result.errors.length === 0) {
      return result;
    } else {
      return h.response(result).code(400);
    }
  }

  public static async preCheckCertificate(userPrincipal: string, documentNumber: string, exportPayload: PayloadSchema.ProductsLanded, contactId: string):
    Promise<{ response: any, url: string, code: number } | null> {

    const documentStatus: string = await ExportPayloadService.getCertificateStatus(userPrincipal, documentNumber, contactId);
    const isDocumentLocked: boolean = documentStatus == DocumentStatuses.Locked;
    logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][LOCKED][${isDocumentLocked}]`);

    if (isDocumentLocked) {
      return {
        response: { status: 'catch certificate is LOCKED' },
        url: `create-catch-certificate/${documentNumber}/check-your-information`,
        code: 200
      }
    }

    const vesselsNotFoundList = VesselValidator.vesselsNotFound(exportPayload.items);
    logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][VESSEL(S)-NOT-FOUND][${vesselsNotFoundList.length}]`);

    const invalidLandingDateList = VesselValidator.invalidLandingDates(exportPayload.items);
    logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][INVALID-LANDING-DATES][${invalidLandingDateList.length}]`);

    const errors = vesselsNotFoundList.concat(invalidLandingDateList);
    if (errors.length > 0) {
      const existingErrors: (PayloadSchema.ValidationFailure | PayloadSchema.SystemFailure)[] = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId);
      const mergedErrors = existingErrors ? [...errors, ...existingErrors] : errors;

      return {
        response: mergedErrors,
        url: `create-catch-certificate/${documentNumber}/check-your-information`,
        code: 400
      }
    }

    const vesselsAreValid = await VesselValidator.vesselsAreValid(exportPayload.items);
    logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][CHECKED-VESSELS][VALID: ${vesselsAreValid}]`);

    const seasonalFishAreValid = await ProductValidator.productsAreValid(exportPayload.items);
    logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][VALIDATED-SEASONAL-FISH][VALID: ${seasonalFishAreValid}]`);

    if (!vesselsAreValid || !seasonalFishAreValid) {
      return {
        response: { status: 'invalid catch certificate' },
        url: `create-catch-certificate/${documentNumber}/add-landings`,
        code: 200
      }
    }

    return null;
  }

  public static async createExportCertificate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    try {
      logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][START]`);
      await CatchCertService.invalidateDraftCache(userPrincipal, documentNumber, contactId);

      const exportPayload: PayloadSchema.ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
      logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][GOT-EXPORT-PAYLOAD]`);

      const preCheckErrors = await this.preCheckCertificate(userPrincipal, documentNumber, exportPayload, contactId);

      if (preCheckErrors) {
        if (acceptsHtml(req.headers)) {
          return h.redirect(preCheckErrors.url);
        }

        return h.response(preCheckErrors.response).code(preCheckErrors.code);
      }

      const app = req.app as HapiRequestApplicationStateExtended;
      const numberOfLandings = PayloadSchema.getNumberOfUniqueLandings(exportPayload);
      const userEmail = app.claims.email;
      const clientIp = (req.payload as any).data;
      const sessionId = `${app.claims.auth_time}:${app.claims.contactId}`;
      const offlineValidation = applicationConfig.isOfflineValidation(numberOfLandings);

      if (offlineValidation) {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][VALIDATING-OFFLINE][NUMBER-OF-LANDINGS: ${numberOfLandings}]`);

        await ExportPayloadService.updateCertificateStatus(userPrincipal, documentNumber, contactId, DocumentStatuses.Pending);

        ExportPayloadController.submitExportCertificate(userPrincipal, userEmail, documentNumber, clientIp, sessionId, contactId, offlineValidation)
          .catch(e => logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][ERROR][${e}]`));

        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][END]`);

        return (acceptsHtml(req.headers))
          ? h.redirect(`${(req.payload as any).submittedUri}`)
          : { offlineValidation: true }
      }
      else {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][VALIDATING-ONLINE][NUMBER-OF-LANDINGS: ${numberOfLandings}]`);

        const results = await ExportPayloadController.submitExportCertificate(userPrincipal, userEmail, documentNumber, clientIp, sessionId, contactId, offlineValidation);

        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][END]`);

        if (acceptsHtml(req.headers))
          return h.redirect(`${(req.payload as any).completeUri}?documentNumber=${documentNumber}&uri=${results.uri}`);

        if (ExportPayloadService.isSubmissionFailure(results)) {
          const errorList = PayloadSchema.toFrontEndValidationFailure(results);
          await SummaryErrorsService.saveErrors(documentNumber, errorList);
          return h.response(errorList).code(400);
        } else {
          return { offlineValidation: false, documentNumber: documentNumber, uri: results.uri }
        }
      }
    }
    catch (e) {
      logger.error(`[INVALID-CATCH-CERTIFICATE][DOCUMENT-NUMBER][${documentNumber}][${e.stack || e}]`);
      throw e;
    }
  }

  public static async submitExportCertificate(userPrincipal: string, userEmail: string, documentNumber: string, clientIp: string, sessionId: string, contactId: string, offline: boolean): Promise<IExportCertificateResults> {
    await SummaryErrorsService.clearErrors(documentNumber);
    await SummaryErrorsService.clearSystemError(userPrincipal, documentNumber, contactId);

    try {

      const results = await ExportPayloadService.createExportCertificate(userPrincipal, documentNumber, userEmail, contactId);

      if (ExportPayloadService.isSubmissionFailure(results)) {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][CERTIFICATE-NOT-CREATED]`);
        void CatchCertService.invalidateDraftCache(userPrincipal, `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);

        if (offline) {
          logger.info(`[CREATE-EXPORT-CERTIFICATE][SENDING-FAILURE-EMAIL][${documentNumber}]`);
          void NotifyService.sendFailureEmailNotifyMessage(userEmail, documentNumber)
            .catch(error => logger.error(`[CREATE-EXPORT-CERTIFICATE][SENDING-FAILURE-EMAIL][ERROR][${error}]`));
        }
      }
      else {
        logger.debug(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][CERTIFICATE-CREATED]`);

        const monitoringInfo = `completed/catch certificate/dn:${documentNumber}`;
        const message = 'User successfully created a catch certificate';
        const priority = PROTECTIVE_MONITORING_PRIORITY_NORMAL;
        const transaction = `${PROTECTIVE_MONITORING_COMPLETED_TRANSACTION}-${DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)}`;

        ProtectiveMonitoringService.postEventData(
          userPrincipal,
          message,
          monitoringInfo,
          clientIp,
          priority,
          sessionId,
          transaction
        ).catch((e) => {
          logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][SUBMIT-CC-MONITORING-EVENT][ERROR][${e.stack || e}]`);
        });

        if (offline) {
          logger.info(`[CREATE-EXPORT-CERTIFICATE][SENDING-SUCCESS-EMAIL][${documentNumber}]`);
          void NotifyService.sendSuccessEmailNotifyMessage(userEmail, results)
            .catch(error => logger.error(`[CREATE-EXPORT-CERTIFICATE][SENDING-SUCCESS-EMAIL][ERROR][${error}]`));
        }
      }

      void CatchCertService.invalidateDraftCache(userPrincipal, documentNumber, contactId);

      void SaveAsDraftService
        .deleteDraftLink(userPrincipal, documentNumber, 'catchCertificate', contactId)
        .catch((e) => {
          logger.error(`[CREATE-EXPORT-CERTIFICATE][${documentNumber}][CONTROLLER][DELETE-DRAFT][ERROR][${e.stack || e}]`);
        });

      return results;
    } catch (e) {
      if (offline) {
        logger.info(`[CREATE-EXPORT-CERTIFICATE][SENDING-ERROR-EMAIL][${documentNumber}]`);
        void NotifyService.sendTechnicalErrorEmailNotifyMessage(userEmail, documentNumber)
          .catch(error => logger.error(`[CREATE-EXPORT-CERTIFICATE][SENDING-ERROR-EMAIL][ERROR][${error}]`));
      }
      throw new Error(e.message);
    }
  }

  public static async getExportPayload(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info(`[GET-EXPORT-PAYLOAD][DOCUMENT-NUMBER][${documentNumber}]`);
    return ExportPayloadService.get(userPrincipal, documentNumber, contactId);

    // non js route - the export payload will have an empty array of items since the
    // redux actions to add / remove products will not have occurred
  }

  public static async getDirectLandingExportPayload(userPrincipal: string, documentNumber: string, contactId: string): Promise<PayloadSchema.DirectLanding> {
    logger.info(`[GET-DIRECT-LANDING-EXPORT-PAYLOAD][DOCUMENT-NUMBER][${documentNumber}]`);
    return ExportPayloadService.getDirectLanding(userPrincipal, documentNumber, contactId);
  }

  public static async editExportPayloadProductLanding(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const exportPayload = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    const product = exportPayload.items.find(item => item.product.id === req.params.productId);
    let result = exportPayload;

    if (product?.landings) {
      const landing = product.landings.find(_landing => _landing.model.id === req.params.landingId);

      if (landing) {
        ExportPayloadController.editExportPayloadCheckLanding(landing, product, req.params.landingId);
        result = await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);
      } else {
        // add another landing
        const anotherLanding = {
          addMode: true,
          editMode: false,
          model: {
            id: req.params.landingId
          }
        };
        product.landings.push(anotherLanding);
        result = exportPayload;
      }
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect((req.url as any).path);
    } else {
      return result;
    }
  }

  static readonly editExportPayloadCheckLanding = (landing: LandingStatus, product: ProductLanded, landingId: string) => {
    if (landing.addMode || (landing.editMode && !landing.modelCopy)) {
      // cancel on a brand new form - remove the landing
      product.landings = ExportPayloadController.removePayloadProductLanding(product.landings, landingId);
    } else {
      // flip edit mode
      landing.editMode = !landing.editMode;
      if (landing.editMode) {
        // going into edit mode - take copy of original so we can reset if needed
        landing.modelCopy = cloneDeep(landing.model);
      } else {
        // cancelling edit mode - restore original values and remove any validation errors
        landing.error = undefined;
        landing.errors = undefined;
        landing.model = cloneDeep(landing.modelCopy);
        landing.modelCopy = undefined;
      }
    }
  }

  public static async editExportPayloadProductLandingNonjs(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    const exportPayload: any = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    const product = exportPayload.items.find(item => item.product.id === req.params.productId);

    if (product?.landings) {

      let landing = product.landings.find(_landing => _landing.model.id === (req.payload as any).id);

      if (landing) {
        ExportPayloadController.editExportPayloadCheckLanding(landing, product, (req.payload as any).id);
      } else {
        // add another landing
        landing = {
          addMode: true,
          editMode: false,
          model: {
            id: (req.payload as any).id
          }
        };
        product.landings.push(landing);
      }

      await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);
    }

    return h.redirect((req.payload as any).currentUri);
  }

  public static async removeExportPayloadProductLanding(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    const exportPayload: PayloadSchema.ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    const product = exportPayload.items.find(item => item.product.id === req.params.productId);

    let result;
    if (product?.landings) {

      let landingId = req.params.landingId;
      if (!landingId) {
        landingId = (req.payload as any).remove; // non js
      }

      const landings = ExportPayloadController.removePayloadProductLanding(product.landings, landingId);
      if (landings.length < product.landings.length) {
        product.landings = landings;
        result = await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);
        await SummaryErrorsService.clearErrors(documentNumber);
      } else {
        result = exportPayload;
      }
    } else {
      result = exportPayload;
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect((req.payload as any).currentUri);
    } else {
      return result;
    }
  }

  public static async addAnotherExportPayloadProductLandingNonjs(req: Hapi.Request, h, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = { ...(req.payload as any) };
    const newLanding = {
      addMode: true,
      editMode: false,
      model: {
        id: `${documentNumber}-${getRandomNumber()}`,
        vessel: payload.vessel,
        dateLanded: payload.dateLanded,
        exportWeight: payload.exportWeight
      }
    };

    await ExportPayloadService.upsertLanding(req.params.productId, newLanding, userPrincipal, documentNumber, contactId);
    return h.redirect(payload.currentUri);
  }

  public static async upsertExportPayloadProductDirectLanding(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {

    const payload: {
      id?: string,
      vessel: PayloadSchema.Vessel,
      dateLanded: string,
      faoArea: string,
      weights: PayloadSchema.Weight[],
      currentUri?: string
    } = { ...(req.payload as any) };

    logger.info(`[UPSERT-EXPORT-PAYLOAD][DIRECT-LANDING][DOCUMENT-NUMBER][${documentNumber}]`);

    const items: PayloadSchema.ProductLanded[] = await Promise.all(payload.weights.map(async (weight: PayloadSchema.Weight) => {
      const productItem = await ExportPayloadService.getItemByProductId(userPrincipal, weight.speciesId, documentNumber, contactId);
      const newLanding: PayloadSchema.LandingStatus = {
        addMode: false,
        editMode: false,
        error: '',
        errors: {},
        model: {
          id: `${documentNumber}-${getRandomNumber()}`,
          vessel: payload.vessel,
          dateLanded: payload.dateLanded,
          exportWeight: weight.exportWeight,
          faoArea: payload.faoArea
        }
      };

      const items = LandingValidator.createExportPayloadForValidation(productItem, newLanding.model);

      await LandingValidator.validateLanding(items)
        .catch(e => {
          newLanding.error = 'invalid';
          newLanding.errors = {
            dateLanded: e.message
          }
        });

      return {
        product: productItem,
        landings: [newLanding]
      }
    }));

    const hasErrors = items.some((item: PayloadSchema.ProductLanded) => {
      if (item.landings && item.landings.length > 0)
        return item.landings.some((landing: PayloadSchema.LandingStatus) => landing.error === 'invalid')
    });

    const exportPayload: PayloadSchema.ProductsLanded = {
      items: items,
      error: hasErrors ? 'invalid' : '',
      errors: items.reduce((acc: any, item: PayloadSchema.ProductLanded) => {
        if (item.landings && item.landings.length > 0) {
          let landingsErrors: any = {};
          item.landings.forEach((landing: PayloadSchema.LandingStatus) => {
            landingsErrors = Object.assign(landingsErrors, landing.errors)
          });
          return { ...acc, ...landingsErrors }
        }
        return acc;
      }, {})
    };

    const result: PayloadSchema.ProductsLanded = await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);

    await SummaryErrorsService.clearErrors(documentNumber);

    if (hasErrors) {
      return h.response(result).code(400);
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect(payload.currentUri);
    } else {
      return result;
    }
  }

  public static async upsertExportPayloadProductLanding(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, productId: string, contactId: string) {
    const payload: {
      id?: string,
      vessel: any,
      dateLanded: string,
      exportWeight: number,
      faoArea: string,
      currentUri?: string
    } = { ...(req.payload as any) };

    logger.info(`[UPSERT-EXPORT-PAYLOAD][PRODUCT-LANDING][DOCUMENT-NUMBER][${documentNumber}]`);
    const newLanding = {
      addMode: false,
      editMode: false,
      error: '',
      errors: {},
      model: {
        id: payload.id || `${documentNumber}-${getRandomNumber()}`,
        vessel: payload.vessel,
        dateLanded: payload.dateLanded,
        exportWeight: payload.exportWeight,
        faoArea: payload.faoArea
      }
    };

    const productItem = await ExportPayloadService.getItemByProductId(userPrincipal, productId, documentNumber, contactId);

    const items = LandingValidator.createExportPayloadForValidation(productItem, newLanding.model);

    try {
      await LandingValidator.validateLanding(items);
    }
    catch (e) {
      const exportPayload = {
        items,
        error: 'invalid',
        errors: {
          dateLanded: e.message,
        },
      };

      return h.response(exportPayload).code(400);
    }

    const result = await ExportPayloadService.upsertLanding(productId, newLanding, userPrincipal, documentNumber, contactId);

    await SummaryErrorsService.clearErrors(documentNumber);

    if (newLanding.error) {
      return h.response(result).code(400);
    }
    else if (acceptsHtml(req.headers)) {
      return h.redirect(payload.currentUri);
    } else {
      return result;
    }
  }

  public static async getExportPayloadInvalidRequest(req, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error, userPrincipal, documentNumber, contactId: string) {
    let result;

    if (req.payload) {
      result = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
      result.error = 'invalid';
      result.errors = errorExtractor(error);
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect(req.payload.currentUri).takeover();
    } else {
      return h.response(result).code(400).takeover();
    }
  }

  public static async upsertExportPayloadInvalidRequest(req, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error, userPrincipal, documentNumber, contactId: string) {
    const newLanding = { model: undefined, editMode: true, error: 'invalid', errors: errorExtractor(error) };
    let result;
    if (req.payload) {
      newLanding.model = {
        id: req.payload.id,
        vessel: req.payload.vessel,
        faoArea: req.payload.faoArea,
        dateLanded: req.payload.dateLanded,
        exportWeight: req.payload.exportWeight
      };
      result = await ExportPayloadService.upsertLanding(req.params.productId, newLanding, userPrincipal, documentNumber, contactId);
    }
    if (acceptsHtml(req.headers)) {
      return h.redirect(req.payload.currentUri).takeover();
    } else {
      return h.response(result).code(400).takeover();
    }
  }

  public static async upsertExportPayloadProductLandingNonjs(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = { ...(req.payload as any) };

    const vessel = await ExportPayloadController.augmentVesselDetails(payload['vessel.label']);

    const newLanding = {
      addMode: false,
      editMode: false,
      error: '',
      errors: {},
      model: {
        id: payload.id || `${documentNumber}-${getRandomNumber()}`,
        vessel,
        dateLanded: payload.dateLanded,
        exportWeight: payload.exportWeight,
        faoArea: payload.faoArea
      }
    };

    const productItem = await ExportPayloadService.getItemByProductId(userPrincipal, req.params.productId, documentNumber, contactId);

    try {
      const exportPayload = LandingValidator.createExportPayloadForValidation(productItem, newLanding.model);

      await LandingValidator.validateLanding(exportPayload);
    }
    catch (e) {
      newLanding.error = 'invalid';
      newLanding.errors = {
        'dateLanded': e.message
      };
    }

    await ExportPayloadService.upsertLanding(req.params.productId, newLanding, userPrincipal, documentNumber, contactId);
    return h.redirect(payload.currentUri);
  }

  public static async upsertExportPayloadInvalidNonJs(req, h, error, userPrincipal, documentNumber, contactId: string) {
    const newLanding = { model: undefined, editMode: true, error: 'invalid', errors: errorExtractor(error) };
    if (req.payload) {
      newLanding.model = {
        id: req.payload.id || `${documentNumber}-${getRandomNumber()}`,
        vessel: {
          label: req.payload['vessel.label']
        },
        dateLanded: req.payload.dateLanded,
        exportWeight: req.payload.exportWeight
      };
      await ExportPayloadService.upsertLanding(req.params.productId, newLanding, userPrincipal, documentNumber, contactId);
    }
    return h.redirect(req.payload.currentUri).takeover();
  }

  public static async addExportPayloadProduct(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = { ...(req.payload as any) };

    const exportPayload: any = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    if (!exportPayload.items) {
      exportPayload.items = [];
    }
    let result;
    if (payload.commodityCode && payload.commodityCode.length > 1) {
      const newPayload = ExportPayloadController.addPayloadProduct(exportPayload, payload);
      if (newPayload.items.length > exportPayload.items.length) {
        newPayload.errors = undefined;
        result = await ExportPayloadService.save(newPayload, userPrincipal, documentNumber, contactId);
      }
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect(payload.nextUri);
    } else if (result) {
      return result;
    } else {
      return exportPayload;
    }
  }

  public static addPayloadProduct(exportPayload: any, product: any) {
    const newPayload = {
      ...exportPayload,
      items: []
    };

    if (exportPayload.items) {
      newPayload.items = [...exportPayload.items];
    }

    let found = false;
    if (newPayload.items && newPayload.items.length > 0) {
      found = newPayload.items.find(item => item.product.id === product.id);
    }
    if (!found) {
      newPayload.items.push({ product });
    }
    return newPayload;
  }

  public static async removeExportPayloadProduct(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const exportPayload: any = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    const newPayload = ExportPayloadController.removePayloadProduct(exportPayload, req.params.productId);

    let result;
    if (newPayload.items.length < exportPayload.items.length) {
      newPayload.errors = undefined;
      result = await ExportPayloadService.save(newPayload, userPrincipal, documentNumber, contactId);
      await SummaryErrorsService.clearErrors(documentNumber);
    } else {
      result = exportPayload;
    }

    if (acceptsHtml(req.headers)) {
      return h.redirect((req.url as any).path);
    } else {
      return result;
    }
  }

  public static removePayloadProduct(exportPayload: any, id: any) {
    const newItems = exportPayload.items.filter(item => item.product.id !== id);
    return {
      ...exportPayload,
      items: newItems
    }
  }

  static removePayloadProductLanding(landings: any, landingId: any) {
    return landings.filter(landing => landing.model.id !== landingId);
  }

  static readonly numberOfUniqueLandings = (exportPayload: PayloadSchema.ProductsLanded) => {
    const landings: {
      pln: string,
      dateLanded: string
    }[] = [];

    if (exportPayload?.items) {
      exportPayload.items.forEach((item: PayloadSchema.ProductLanded) => {
        if (item.landings && item.landings.length > 0) {
          item.landings.forEach((landing: PayloadSchema.LandingStatus) => {
            landings.push({
              pln: landing.model.vessel === undefined ? 'N/A' : landing.model.vessel.pln,
              dateLanded: landing.model.dateLanded
            })
          });
        }
      })
    }

    return landings.reduce((acc, cur) => {
      if (acc.find(_ => _.pln === cur.pln &&
        _.dateLanded === cur.dateLanded)) {
        return acc;
      }

      return [...acc, cur]
    }, []).length;
  };

  public static async augmentVesselDetails(label) {
    let name = label;
    let pln = label;

    const startIdx = label.indexOf('(');
    if (startIdx >= 0) {
      name = label.substring(0, startIdx).trim();
      pln = label.substring(startIdx + 1, label.indexOf(')')).trim();
    }

    const vessel = await getVessel(pln, name);
    if (vessel) {
      vessel['label'] = vessel.vesselName + ' (' + vessel.pln + ')';
      return vessel;
    } else {
      return {
        label
      }
    }
  }

  public static async validateExportPayloadAndSaveAsDraft(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal, documentNumber, contactId: string) {
    return ExportPayloadController.validate(req, h, true, userPrincipal, documentNumber, contactId);
  }

  public static async getLandingsType(userPrincipal: string, documentNumber: string, contactId: string): Promise<{ landingsEntryOption: string, generatedByContent: boolean }> {

    const landingsEntryOption: LandingsEntryOptions = await CatchCertService.getLandingsEntryOption(userPrincipal, documentNumber, contactId);

    if (landingsEntryOption) {
      return { landingsEntryOption, generatedByContent: false };
    }
    else {
      const exportPayload = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
      const numberOfUniqueLandings = ExportPayloadController.numberOfUniqueLandings(exportPayload);
      let isDirectLanding = false;

      if (numberOfUniqueLandings === 1) {
        const transportDetails = await TransportService.getTransportDetails(userPrincipal, CATCH_CERTIFICATE_KEY, documentNumber, contactId);

        isDirectLanding = numberOfUniqueLandings === 1 && transportDetails.vehicle && transportDetails.vehicle === fishingVessel;
      }

      if (isDirectLanding) {
        return { landingsEntryOption: LandingsEntryOptions.DirectLanding, generatedByContent: true };
      }
      else if (numberOfUniqueLandings > 0) {
        return { landingsEntryOption: LandingsEntryOptions.ManualEntry, generatedByContent: true };
      }
      else {
        return { landingsEntryOption: null, generatedByContent: false };
      }
    }

  }

  public static async addLandingsEntryOption(userPrincipal: string, documentNumber: string, landingsEntryOption: LandingsEntryOptions, contactId: string): Promise<void> {
    await CatchCertService.upsertLandingsEntryOption(userPrincipal, documentNumber, landingsEntryOption, contactId);
    if (landingsEntryOption === fishingVessel) {
      const transport = await TransportService.getTransportData(userPrincipal, 'catchCertificate', documentNumber, contactId);
      await CatchCertService.upsertTransportDetails(userPrincipal, { ...transport, vehicle: fishingVessel }, documentNumber, contactId);
    }
  }

  public static async confirmLandingsType(userPrincipal: string, documentNumber: string, landingsEntryOption: LandingsEntryOptions, contactId: string): Promise<void> {
    const exportPayload: PayloadSchema.ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId) || { items: [] };

    const hasProductItems = Array.isArray(exportPayload.items) && exportPayload.items.length > 0;

    if (hasProductItems) {
      exportPayload.items.forEach((item: PayloadSchema.ProductLanded) => {
        item.landings = undefined;
        logger.info(`[CONFIRM-LANDINGS-TYPE][REMOVING-LANDINGS-FOR][${item.product.id}][SUCCESS]`);
      });

      await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);
    }

    const exportLocation = await CatchCertService.getExportLocation(userPrincipal, documentNumber, contactId);

    await TransportService.removeTransport(userPrincipal, documentNumber, contactId);

    if (hasProductItems && exportLocation?.exportedFrom) {
      await ExportLocationService.addExportLocation(userPrincipal, exportLocation, documentNumber, contactId);
    }

    await this.addLandingsEntryOption(userPrincipal, documentNumber, landingsEntryOption, contactId);
  }
}
