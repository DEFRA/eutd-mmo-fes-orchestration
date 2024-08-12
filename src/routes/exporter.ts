import * as Hapi from "@hapi/hapi";
import acceptsHtml from "../helpers/acceptsHtml";
import * as Joi from 'joi';
import Controller from "../controllers/exporter.controller";
import errorExtractor from "../helpers/errorExtractor";
import {withDocumentLegitimatelyOwned} from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { defineAuthStrategies } from "../helpers/auth";

export default class ExporterRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'GET',
          path: '/v1/exporter/{journey}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                return await Controller.getExporterDetails(request, userPrincipal, documentNumber, contactId);
              }).catch(e => {
                logger.error(`[GET-EXPORTER-DETAILS][ERROR][${e.stack || e}`);
                return h.response().code(500);
              });
            },
            description: 'Get the exporter details',
            tags: ['api', 'exporter'],
          }
        },
        {
          method: 'POST',
          path: '/v1/exporter/{journey}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addExporterDetails(request,h,false,userPrincipal,documentNumber, contactId);
              }).catch(e => {
                logger.error(`[SAVE-EXPORTER-DETAILS][ERROR][${e.stack || e}`);
                return h.response().code(500);
              });
            },
            description: 'Save exporter details',
            tags: ['api', 'exporter'],
            validate: {
              options: { abortEarly: false },
              failAction: async function (req, h, error) {
                return await withDocumentLegitimatelyOwned(req,h,async (userPrincipal,documentNumber, contactId) => {
                  return await Controller.processSaveExporterDetailsErrors(req,h,error,userPrincipal,documentNumber, contactId);
                }).catch(e => {
                  logger.error(`[SAVE-EXPORTER-DETAILS][FAIL-ACTION][ERROR][${e.stack || e}`);
                  return h.response().code(500).takeover();
                });
              },
              payload: async (value, options) => {
                let schema;
                // options.context === req
                if (options.context.params.journey === 'catchCertificate') {
                  schema = Joi.object({
                    exporterFullName: Joi.string().trim().required(),
                    exporterCompanyName: Joi.string().trim().label("Company name").required(),
                    postcode: Joi.string().trim().label("Postcode").required()
                  });
                } else {
                  schema = Joi.object({
                    exporterCompanyName: Joi.string().trim().label("Company name").required(),
                    postcode: Joi.string().trim().label("Postcode").required()
                  });
                }

                const errors = schema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }

                return value;
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/exporter/{journey}/saveAsDraftLink',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Save exporter details and save as draft URI to track progress',
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addExporterDetailsAndDraftLink(request,h,userPrincipal,documentNumber, contactId);
              }).catch(e => {
                logger.error(`[ADD-EXPORTER-DETAILS-DRAFT-LINK][ERROR][${e.stack || e}`);
                return h.response().code(500);
              });
            },
            tags: ['api', 'save as draft'],
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
              payload: (value, options) => {
                let schema;
                if (options.context.params.journey === 'catchCertificate') {
                  schema = {
                    exporterFullName: Joi.string().trim().required(),
                    exporterCompanyName: Joi.string().trim().label("Company name").required(),
                    addressOne: Joi.string().trim().label("Building and street").required(),
                    townCity: Joi.string().trim().label("Town or city").required()
                  };
                } else {
                  schema = {
                    exporterCompanyName: Joi.string().trim().label("Company name").required(),
                    addressOne: Joi.string().trim().label("Building and street").required(),
                    townCity: Joi.string().trim().label("Town or city").required()
                  };
                }

                const errors = schema.validate(value);

                if (errors.error) {
                  throw errors.error;
                }

                return value as any;
              }
            },
          }
        }
      ]);
      resolve(null);
    });
  }
}