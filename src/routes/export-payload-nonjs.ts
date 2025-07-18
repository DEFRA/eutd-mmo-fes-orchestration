import * as Hapi from '@hapi/hapi';
import Controller from '../controllers/export-payload.controller';
import * as Joi from 'joi';
import {withDocumentLegitimatelyOwned} from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';
import { decimalPlacesValidator } from '../helpers/customValidators';
import ApplicationConfig from "../applicationConfig";
import * as moment from 'moment';

const extendedJoi = Joi.extend(require('@hapi/joi-date'));
const allowDaysInTheFuture = moment().add(ApplicationConfig._landingLimitDaysInTheFuture, 'days').toDate();

export default class ExportPayloadNonjsRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/nonjs/export-certificates/export-payload/product/{productId}/landing/add-another',
          options: {
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addAnotherExportPayloadProductLandingNonjs(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[ADD-LANDING-NONJS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add a new empty payload product landing',
            tags: ['api', 'export payload', 'landing']
          }
        },
        {
          method: 'POST',
          path: '/v1/nonjs/export-certificates/export-payload/product/{productId}/landing/add',
          options: {
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.upsertExportPayloadProductLandingNonjs(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[UPSERT-LANDING-NONJS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Add export payload product landing',
            tags: ['api', 'export payload', 'landing', 'add'],
            validate: {
              options: { abortEarly: false },
              failAction: async function (req, h, error) {
                return await withDocumentLegitimatelyOwned(req,h,async (userPrincipal,documentNumber, contactId) => {
                  return await Controller.upsertExportPayloadInvalidNonJs(req,h,error,userPrincipal,documentNumber, contactId);
                }).catch(err => {
                  logger.error(`[UPSERT-INVALID-LANDING-NONJS][ERROR][${err.stack || err}`);
                  return h.response().code(500).takeover();
                });
              },
              payload: Joi.object({
                'vessel.label': Joi.string().trim().label("Vessel").required(),
                dateLanded: extendedJoi.date().format(['YYYY-MM-DD']).max(allowDaysInTheFuture).utc().required(),
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
              })
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/nonjs/export-certificates/export-payload/product/{productId}/landing/edit',
          options: {
            security: true,
            cors: true,
            handler: async(request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId)=>{
                return await Controller.editExportPayloadProductLandingNonjs(request,h,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                logger.error(`[EDIT-LANDING-NONJS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Edit payload product landing',
            tags: ['api', 'export payload', 'landing', 'edit']
          }
        },
        {
          method: 'POST',
          path: '/v1/nonjs/export-certificates/export-payload/product/{productId}/landing/remove',
          options: {
            security: true,
            cors: true,
            handler: async(request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async(userPrincipal,documentNumber, contactId)=>{
                return await Controller.removeExportPayloadProductLanding(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[REMOVE-LANDING-NONJS][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Remove export payload product landing',
            tags: ['api', 'export payload', 'landing', 'remove']
          }
        }
      ]);

      resolve(null);
    });
  }
}
