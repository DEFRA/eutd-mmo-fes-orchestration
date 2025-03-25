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
                startDate: extendedJoi.date().custom((value, helpers) => {
                  const startDate = helpers.original;
                  const dateLanded = helpers.state.ancestors[0].dateLanded;

                  if (!moment(startDate).utc().isValid()) {
                    return helpers.error('date.base');
                  }

                  if (moment(dateLanded).utc().isBefore(moment(startDate).utc(), 'day')) {
                    return helpers.error('date.max');
                  }

                  return value;
                }, 'Date validation').optional(),
                exportWeight: Joi.number().greater(0).custom(decimalPlacesValidator, 'Decimal places validator').label("Export weight").required()
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
