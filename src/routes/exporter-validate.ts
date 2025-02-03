import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import logger from '../logger';
import Controller from "../controllers/exporter.controller";
import { validateCountriesName } from '../validators/countries.validator';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from "../helpers/errorExtractor";

import ApplicationConfig from '../applicationConfig';
import { ICountry } from '../persistence/schema/common';
import { COUNTRY } from '../services/constants';
import { defineAuthStrategies } from '../helpers/auth';
export default class ExporterValidateRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'POST',
          path: '/v1/exporter-validate',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Validate the Exporters address details',
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
             return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal,documentNumber, contactId) => {
              const addressOne = (address: any): string | undefined => {
                const addressLineOne: string[] = [];

                if (address && address.buildingNumber) {
                  addressLineOne.push(address.buildingNumber);
                }

                if (address && address.subBuildingName) {
                  addressLineOne.push(address.subBuildingName);
                }

                if (address && address.buildingName) {
                  addressLineOne.push(address.buildingName);
                }

                if (address && address.streetName) {
                  addressLineOne.push(address.streetName);
                }

                return (addressLineOne.length > 0)
                  ? addressLineOne
                    .filter((_: string) => _ !== 'null')
                    .join(', ')
                  : '';
              }
              const addressFirstPart = addressOne(req.payload)

              if (addressFirstPart === '') { return h.response(['error.addressFirstPart.any.required']).code(400) }

              await Controller.addExporterDetails(req, h, false, userPrincipal, documentNumber, contactId);

              return { ...(req.payload as any), addressOne: addressFirstPart };
              }).catch(error => {
                logger.error(`[EXPORTER-VALIDATE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            tags: ['api', 'exporters details'],
            validate: {
              options: {
                abortEarly: false
              },
              payload: async function(value: any) {
                const schema = Joi.object()
                  .keys({
                    subBuildingName: Joi.string().regex(/^[A-Za-z0-9'/\-.,() &!]+$/).allow(''),
                    buildingNumber: Joi.string().regex(/^[a-zA-Z0-9\-, ]+$/).allow(''),
                    buildingName: Joi.string().regex(/^[A-Za-z0-9'/\-., &!]+$/).allow(''),
                    streetName: Joi.string().regex(/^[A-Za-z0-9'/\-.,() &!]+$/).allow(''),
                    townCity: Joi.string().trim().regex(/^[A-Za-z0-9'/\-., &!]+$/).required(),
                    county: Joi.string().regex(/^[A-Za-z0-9'/\-., &!]+$/).allow(''),
                    postcode: Joi.string().regex(/^[a-zA-Z0-9\-, ]+$/).required().min(5).max(8),
                    country: Joi.string().required()
                  })

                const errors = schema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }

                if (COUNTRY.includes(value.country.toUpperCase())) {
                  return value;
                }

                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const country: ICountry = {
                  officialCountryName: value.country,
                  isoCodeAlpha2: value.isoCodeAlpha2,
                  isoCodeAlpha3: value.isoCodeAlpha3,
                  isoNumericCode: value.isoNumericCode
                }

                const anyError = await validateCountriesName(country, refUrl, 'country');
                if (anyError.isError) {
                  logger.error(`[EXPORTER-VALIDATE][ERROR][INVALID-COUNTRY][${value.country}]`);
                  throw anyError.error;
                }

                return value;
              },
              failAction: function (req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              }
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}