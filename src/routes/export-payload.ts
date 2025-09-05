import * as Hapi from '@hapi/hapi';
import Controller from '../controllers/export-payload.controller';
import errorExtractor, { buildRedirectUrlWithErrorStringInQueryParam } from "../helpers/errorExtractor";
import acceptsHtml from "../helpers/acceptsHtml";
import * as Joi from 'joi';
import * as moment from 'moment';
import { validateSpeciesName } from "../validators/fish.validator";
import ApplicationConfig from "../applicationConfig";

import saveAsDraftSchema from '../schemas/catchcerts/saveAsDraftSchema';
import landingsTypeChangeSchema from '../schemas/catchcerts/landingsTypeChangeSchema';
import directLandingsSchema from "../schemas/catchcerts/directLandingsSchema";
import { DocumentStatuses, LandingsEntryOptions } from "../persistence/schema/catchCert";
import { withDocumentLegitimatelyOwned } from "../helpers/withDocumentLegitimatelyOwned";
import { decimalPlacesValidator } from '../helpers/customValidators';
import DocumentNumberService from '../services/documentNumber.service';
import ServiceNames from '../validators/interfaces/service.name.enum';
import logger from "../logger";
import { SYSTEM_ERROR } from '../services/constants';
import { defineAuthStrategies } from '../helpers/auth';
import { getFAOAreaList } from '../helpers/utils/utils';

const extendedJoi = Joi.extend(require('@joi/date'));

export default class ExportPayloadRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/export-certificates/landing/validate',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.upsertExportPayloadProductLanding(request,h,userPrincipal,documentNumber,(request.payload as any).product, contactId);
              }).catch(error => {
                logger.error(`[VALIDATING-LANDINGS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Validate export payload',
            tags: ['api', 'export payload', 'validate'],
            validate: {
              options: { abortEarly: false },
              failAction: async function (req, h, error) {
                return await withDocumentLegitimatelyOwned(req,h,async(userPrincipal, documentNumber, contactId) => {
                  return await Controller.getExportPayloadInvalidRequest(req, h, error, userPrincipal, documentNumber, contactId);
                }).catch(err => {
                  logger.error(`[UPSERTING-FAILED-LANDING][ERROR][${err.stack || err}`);
                  return h.response().code(500).takeover();
                });
              },
              payload: Joi.object({
                product: Joi.string().trim().required(),
                vessel: Joi.object().keys({
                  vesselName: Joi.string().trim().label("Vessel").required()
                }),
                dateLanded: extendedJoi.date().max(Joi.ref('maxDate', { adjust : () => moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days').toDate()})).utc().required(),
                startDate: extendedJoi.date().custom((value: string, helpers: any) => {
                  const startDate = moment(helpers.original, ["YYYY-M-D", "YYYY-MM-DD"], true);
                  const dateLanded = moment(helpers.state.ancestors[0].dateLanded);

                  if (!startDate.isValid()) {
                    return helpers.error('date.base');
                  }

                  if (dateLanded.isBefore(startDate, 'day')) {
                    return helpers.error('date.max');
                  }

                  return value;
                }, 'Start Date Validator').optional(),
                exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required(),
                gearCategory: Joi.custom((value: string, helpers: any) => {
                  const gearCategory = helpers.original;
                  const gearType = helpers.state.ancestors[0].gearType;

                  if (!gearCategory && gearType) {
                    return helpers.error('string.empty');
                  }
                  
                  return value;
                }, 'Gear Category Validator').optional(),
                gearType: Joi.custom((value: string, helpers: any) => {
                  const gearType = helpers.original;
                  const gearCategory = helpers.state.ancestors[0].gearCategory;

                  if (gearCategory && !gearType) {
                    return helpers.error('string.empty');
                  }

                  return value;
                }, 'Gear Type Validator').optional(),
                highSeasArea: Joi.string().optional(),
                exclusiveEconomicZones: Joi.array().items(Joi.object()).optional(),
                faoArea: Joi.string().trim().label("Catch area").valid(...getFAOAreaList()).required(),
                rfmo: Joi.string().optional(),
              })
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/direct-landing/validate',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.upsertExportPayloadProductDirectLanding(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[VALIDATING-DIRECT-LANDINGS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Validate export payload for direct landings',
            tags: ['api', 'export payload direct landings', 'validate'],
            validate: {
              options: { abortEarly: false },
              failAction: async function (req, h, error) {
                return await withDocumentLegitimatelyOwned(req,h,async(userPrincipal, documentNumber, contactId) => {
                  return await Controller.getExportPayloadInvalidRequest(req, h, error, userPrincipal, documentNumber, contactId);
                }).catch(err => {
                  logger.error(`[UPSERTING-FAILED-DIRECT-LANDING][ERROR][${err.stack || err}`);
                  return h.response().code(500).takeover();
                });
              },
              payload: directLandingsSchema
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/export-payload/validate',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.validate(request,h,false,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[VALIDATING-LANDINGS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Validate export payload',
            tags: ['api', 'export payload', 'validate']
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/create',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h)  => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.createExportCertificate(request,h,userPrincipal,documentNumber, contactId);
              }, [DocumentStatuses.Draft, DocumentStatuses.Locked]).catch(error => {
                logger.error(`[CREATING-CC][ERROR][${error.stack || error}`);
                return h.response([{error: SYSTEM_ERROR}]).code(500);
              })
            },
            description: 'submit catches',
            tags: ['api', 'catches']
          }
        },
        {
          method: 'PUT',
          path: '/v1/export-certificates/export-payload/product/{productId}/landing/{landingId}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async(request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId) => {
                return await Controller.editExportPayloadProductLanding(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[UPDATING-LANDING][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Edit export payload product landing',
            tags: ['api', 'export payload', 'product']
          }
        },
        {
          method: 'DELETE',
          path: '/v1/export-certificates/export-payload/product/{productId}/landing/{landingId}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.removeExportPayloadProductLanding(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[DELETING-LANDING][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Remove export payload product landing',
            tags: ['api', 'export payload', 'product']
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/export-payload/product/{productId}/landing',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.upsertExportPayloadProductLanding(request,h,userPrincipal,documentNumber,request.params.productId, contactId);
              }).catch(error => {
                logger.error(`[UPSERTING-LANDING][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add export payload product landing',
            tags: ['api', 'export payload', 'landing'],
            validate: {
              options: { abortEarly: false },
              failAction: async function (req, h, error) {
                return await withDocumentLegitimatelyOwned(req,h,async(userPrincipal, documentNumber, contactId) => {
                  return await Controller.upsertExportPayloadInvalidRequest(req, h, error, userPrincipal, documentNumber, contactId);
                }).catch(err => {
                  logger.error(`[UPSERTING-FAILED-LANDING][ERROR][${err.stack || err}`);
                  return h.response().code(500).takeover();
                });
              },
              payload: Joi.object({
                vessel: Joi.object().keys({
                  vesselName: Joi.string().trim().label("Vessel").required()
                }),
                dateLanded: extendedJoi.date().max(Joi.ref('maxDate', { adjust : ()=>moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days').toDate()})).utc().required(),
                startDate: extendedJoi.date().custom((value: string, helpers: any) => {
                  const startDate = moment(helpers.original, ["YYYY-M-D", "YYYY-MM-DD"], true);
                  const dateLanded = moment(helpers.state.ancestors[0].dateLanded);

                  if (!startDate.isValid()) {
                    return helpers.error('date.base');
                  }

                  if (dateLanded.isBefore(startDate, 'day')) {
                    return helpers.error('date.max');
                  }

                  return value;
                }, 'Start Date Validator').optional(),
                exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required(),
                gearCategory: Joi.custom((value: string, helpers: any) => {
                  const gearCategory = helpers.original;
                  const gearType = helpers.state.ancestors[0].gearType;

                  if (!gearCategory && gearType) {
                    return helpers.error('string.empty');
                  }
                  
                  return value;
                }, 'Gear Category Validator').optional(),
                gearType: Joi.custom((value: string, helpers: any) => {
                  const gearType = helpers.original;
                  const gearCategory = helpers.state.ancestors[0].gearCategory;

                  if (gearCategory && !gearType) {
                    return helpers.error('string.empty');
                  }

                  return value;
                }, 'Start Date Validator').optional(),
                faoArea: Joi.string().trim().label("Catch area").required(),
                highSeasArea: Joi.string().optional(),
                exclusiveEconomicZones: Joi.array().items(Joi.object()).optional(),
                rfmo: Joi.string().optional()
              })
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/export-payload/product',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async(request,h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addExportPayloadProduct(request, h, userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[ADDING-PRODUCT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add export payload product',
            tags: ['api', 'export payload', 'product'],
            validate: {
              failAction: function (req, h, error) {
                const errorDetailsObj = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url).takeover();
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: async function (value: any) {
                const { species, scientificName } = value;
                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const anyError = await validateSpeciesName(species.label, scientificName , refUrl);
                if (anyError.isError) {
                  throw anyError.error;
                }
              }
            }
          }
        },
        {
          method: 'DELETE',
          path: '/v1/export-certificates/export-payload/product/{productId}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId)=>{
                return await Controller.removeExportPayloadProduct(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[DELETING-PRODUCT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              })
            },
            description: 'Remove export payload product',
            tags: ['api', 'export payload', 'product']
          }
        },
        {
          method: 'GET',
          path: '/v1/export-certificates/export-payload',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.getExportPayload(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[GETTING-LANDINGS][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            description: 'Get the export payload',
            tags: ['api', 'export payload']
          }
        },
        {
          method: 'GET',
          path: '/v1/export-certificates/export-payload/direct-landings',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.getDirectLandingExportPayload(userPrincipal, documentNumber, contactId);
              }).catch(error => {
                logger.error(`[GETTING-DIRECT-LANDINGS][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            description: 'Get the export payload direct landings',
            tags: ['api', 'export payload', 'direct landings']
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/export-payload/validate/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Validate landings and save current URI to track progress',
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.validateExportPayloadAndSaveAsDraft(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[SAVING-LANDINGS-AS-DRAFT][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            tags: ['api', 'landings', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                    return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: saveAsDraftSchema
            },
          }
        },
        {
          method: 'GET',
          path: '/v1/export-certificates/landings-type',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                const service = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);
                if (service === ServiceNames.CC) {
                  return await Controller.getLandingsType(userPrincipal,documentNumber, contactId);
                }
                return h.response(['error.landingsEntryOption.any.invalid']).code(400);
              }).catch(error =>  {
                logger.error(`[LANDINGS-TYPE][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Get if it is direct landing or not',
            tags: ['api', 'export-certificates', 'landings-type']
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/landings-type',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
                const landingsEntryOption: LandingsEntryOptions = validateLandingsEntryOption((req.payload as any).landingsEntryOption);
                if (landingsEntryOption) {
                  await Controller.addLandingsEntryOption(userPrincipal, documentNumber, landingsEntryOption, contactId);
                } else {
                  return h.response(['error.landingsEntryOption.any.invalid']).code(400);
                }

                return h.response({ landingsEntryOption, generatedByContent: false }).code(200);
              }).catch(error => {
                logger.error(`[ADDING-LANDINGS-ENTRY-OPTION][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            description: 'add the landings entry option',
            tags: ['api', 'entry', 'validate'],
            validate: {
              options: {abortEarly: false},
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: Joi.object({
                landingsEntryOption: Joi.string().required()
              })
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/export-certificates/confirm-change-landings-type',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                const payload = request.payload as any;
                const landingsEntryOption: LandingsEntryOptions = validateLandingsEntryOption(payload.landingsEntryOption);
                if (landingsEntryOption && payload.landingsEntryConfirmation === 'Yes') {
                  await Controller.confirmLandingsType(userPrincipal, documentNumber, landingsEntryOption, contactId);
                } else if (landingsEntryOption === undefined) {
                  return h.response(['error.landingsEntryOption.any.invalid']).code(400);
                }

                if (acceptsHtml(request.headers)) {
                  return h.redirect(payload.currentUri);
                } else {
                  return h.response({ landingsEntryOption, generatedByContent: false }).code(200);
                }
              }).catch(error => {
                logger.error(`[CHANGING-LANDINGS-TYPE][ERROR][${error.stack || error}`);
                return h.response().code(500);
              })
            },
            description: 'Confirm landings type change',
            tags: ['api', 'confirm-change-landings-type'],
            validate: {
              options: {abortEarly: false},
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: landingsTypeChangeSchema
            }
          }
        }
      ]);

      resolve(null);
    });
  }
}

const validateLandingsEntryOption = (landingsEntryOption: string): LandingsEntryOptions  => {
  switch (landingsEntryOption) {
    case 'directLanding':
      return LandingsEntryOptions.DirectLanding;
    case 'manualEntry':
      return LandingsEntryOptions.ManualEntry;
    case 'uploadEntry':
      return LandingsEntryOptions.UploadEntry;
    default:
      return undefined;
  }
}