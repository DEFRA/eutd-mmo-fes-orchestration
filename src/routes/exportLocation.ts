import * as Hapi from '@hapi/hapi';
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
              failAction: function(req, h, error) {
                const errorDetailsObj = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url);
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: async function(value, _options) {
                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const anyError = await validateCountriesName((value as any).exportedTo, refUrl);
                if (anyError.isError) {
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
