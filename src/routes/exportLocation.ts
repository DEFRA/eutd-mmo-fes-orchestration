import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import { createEmojiAwarePatternValidator, validateNoEmoji } from '../validators/emojiValidator';
import Controller from '../controllers/exportLocation.controller';
import logger from '../logger';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { validateCountriesName } from '../validators/countries.validator';
import errorExtractor, { buildRedirectUrlWithErrorStringInQueryParam } from '../helpers/errorExtractor';
import acceptsHtml from '../helpers/acceptsHtml';
import ApplicationConfig from '../applicationConfig';
import { defineAuthStrategies } from '../helpers/auth';

export default class ExportLocationRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: "POST",
          path: '/v1/export-location',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addExportLocation(request, h, false, userPrincipal, documentNumber, contactId)
                  .catch(error => {
                    logger.error(`[POST-EXPORT-LOCATION][ERROR][${error.stack || error}]`);
                    return h.response().code(500);
                  })
              })
            },
            validate: {
              options: { abortEarly: false },
              failAction: function (req, h, error) {
                const errorDetailsObj = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url);
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: async function (value, options) {
                // Get document number from request headers to determine service type
                const documentNumber = (options.context.headers['documentnumber'] as string)?.toUpperCase();
                const isCatchCertificate = documentNumber?.substring(9, 11) === 'CC';

                // For Catch Certificates, exportedFrom is required
                // For Processing Statements and Storage Documents, it's optional
                const schema = Joi.object()
                  .keys({
                    exportedFrom: isCatchCertificate 
                      ? Joi.string().valid('United Kingdom', 'Guernsey', 'Isle Of Man', 'Jersey').required().messages({
                          'any.required': 'error.exportedFrom.any.required',
                          'string.empty': 'error.exportedFrom.any.required',
                          'any.only': 'error.exportedFrom.any.only'
                        })
                      : Joi.string().valid('United Kingdom', 'Guernsey', 'Isle Of Man', 'Jersey').optional().allow('').messages({
                          'any.only': 'error.exportedFrom.any.only'
                        }),
                    exportDestination: Joi.string().required().custom(validateNoEmoji).messages({
                      'any.required': 'error.exportDestination.any.required',
                      'string.empty': 'error.exportDestination.any.required'
                    }),
                    pointOfDestination: Joi.string().required().max(100).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-'\s/]+$/)).messages({
                      'any.required': 'error.pointOfDestination.any.required',
                      'string.empty': 'error.pointOfDestination.any.required',
                      'string.max': 'error.pointOfDestination.string.max',
                      'string.pattern.base': 'error.pointOfDestination.string.pattern.base'
                    })
                  });

                if (!schema) {
                  const e = new Error('I am not sure what\'s going on') as any;
                  return e;
                }
                const errors = schema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const anyError = await validateCountriesName((value as any).exportedTo, refUrl);

                if (errors.error && anyError.isError) {
                  const combined = errors.error;
                  combined.details = [...combined.details, ...(anyError.error?.details ?? [])];
                  throw combined;
                } else if (errors.error) {
                  throw errors.error;
                } else if (anyError.isError) {
                  throw anyError.error;
                }

                return value;
              }
            }
          }
        },
        {
          method: "POST",
          path: '/v1/export-location/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return Controller.addExportLocationAndSaveAsDraft(request, h, true, userPrincipal, documentNumber, contactId)
                  .catch(error => {
                    logger.error(`[POST-EXPORT-LOCATION-SAVE-AS-DRAFT][${error.stack || error}]`);
                    return h.response().code(500);
                  })
              })
            },
            validate: {
              options: { abortEarly: false },
              failAction: function (req, h, error) {
                const errorDetailsObj = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url);
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: Joi.object({
                pointOfDestination: Joi.string().trim().allow('').allow(null).optional().max(100).custom(createEmojiAwarePatternValidator(/^[a-zA-Z0-9\-' /]+$/))
              })
            }
          }
        },
        {
          method: "GET",
          path: '/v1/export-location',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.getExportLocation(userPrincipal, documentNumber, contactId)
                  .catch(error => {
                    logger.error(`[GET-EXPORT-LOCATION][ERROR][${error.stack || error}]`);
                    return h.response().code(500);
                  })
              })
            },
          }
        },
      ]);

      resolve(null);
    });
  }
}
