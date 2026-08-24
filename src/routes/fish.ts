import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import Controller from '../controllers/fish.controller';
import FavouritesController from '../controllers/favourites.controller';
import acceptsHtml from '../helpers/acceptsHtml';
import { validateSpeciesWithReferenceData, validateSpeciesName } from '../validators/fish.validator';
import errorExtractor, { buildRedirectUrlWithErrorStringInQueryParam } from '../helpers/errorExtractor';
import { mergeSchemaAndValidationErrors, BusinessError } from '../validators/validationErrors';
import ApplicationConfig from '../applicationConfig';
import { withDocumentLegitimatelyOwned } from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { canAddFavourite } from '../persistence/services/favourites';
import { getMaxFavouritesError } from './favourites';
import { defineAuthStrategies } from '../helpers/auth';
import { HapiRequestApplicationStateExtended } from '../types';
import { Product } from '../persistence/schema/frontEndModels/species';
import { validateNoEmoji } from '../validators/emojiValidator';

export default class FishRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/fish/add',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                if ((request.payload as any).addToFavourites === true) {
                  const allowAddFavourite = await canAddFavourite(userPrincipal);

                  if (!allowAddFavourite) {
                    return h.response(getMaxFavouritesError(ApplicationConfig._maximumFavouritesPerUser)).code(400);
                  }
                }

                return await Controller.addFish(request,h,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                  logger.error(`[ADDING-SPECIES][ERROR][${error.stack || error}]`);
                  return h.response().code(500).takeover();
                }
              )
            },
            description: 'Add species for the manual entry -- those will be used as a base to create the catches',
            tags: ['api', 'fish', 'manual'],
            validate: {
              failAction: async function (req, h, error) {
                let errorDetailsObj = errorExtractor(error);

                if ((req.payload as any).isFavourite && Object.hasOwn(errorDetailsObj, 'species') && errorDetailsObj['species'] === 'error.species.any.invalid') {
                  await FavouritesController.removeInvalidFavouriteProduct((req.app as HapiRequestApplicationStateExtended).claims.sub, (req.payload as any).id);

                  errorDetailsObj = {
                    product: 'error.favourite.any.invalid'
                  }
                } else if ((req.payload as any).isFavourite) {
                  errorDetailsObj = {
                    product: 'error.favourite.any.required'
                  }
                }

                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url);
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: async function(value: any) {
                if (value.cancel &&
                  value.redirect &&
                  !value.btn_submit) {
                  // the user has hit cancel
                  return value;
                }
                if (value.add_new &&
                  value.redirect &&
                  // !val.commodity_code &&
                  !value.species &&
                  !value.state) {
                  // the user has hit add new
                  return value;
                }

                const schema = Joi.object()
                  .keys({
                    id: Joi.string().optional(),
                    btn_submit: Joi.string().allow(''),
                    redirect: Joi.string().required(),
                    species: Joi.string().required().custom(validateNoEmoji),
                    state: Joi.string().required().disallow(''),
                    presentation: Joi.string().required().disallow(''),
                    commodity_code: Joi.required().disallow(''),
                    commodity_code_description: Joi.string().allow('').custom(validateNoEmoji),
                    addToFavourites : Joi.boolean().optional(),
                  });

                if (!schema) {
                  const e = new Error('I am not sure what\'s going on') as any;
                  return e;
                }
                const joiResult = schema.validate(value, { abortEarly: false, allowUnknown: true });
                const speciesPassedJoi = !joiResult.error?.details.some((d: any) => d.path[0] === 'species');
                // composite check requires valid state/presentation/commodity_code; use name-only check when they haven't passed yet
                const otherFieldsPassedJoi = !joiResult.error?.details.some((d: any) => d.path[0] !== 'species');
                const refUrl = ApplicationConfig.getReferenceServiceUrl();

                let speciesRefError: BusinessError;
                if (!speciesPassedJoi) {
                  speciesRefError = { isError: false, error: null };
                } else if (!otherFieldsPassedJoi) {
                  speciesRefError = await validateSpeciesName(value.species, value.scientificName ?? '', refUrl);
                } else {
                  speciesRefError = await validateSpeciesWithReferenceData(value, refUrl);
                }

                const combined = mergeSchemaAndValidationErrors(
                  joiResult.error ?? null,
                  speciesRefError.isError ? [speciesRefError.error] : []
                );
                if (combined) {
                  // species first so it leads the error response object
                  const speciesIdx = combined.details.findIndex((d: any) => d.path[0] === 'species');
                  if (speciesIdx > 0) combined.details.unshift(combined.details.splice(speciesIdx, 1)[0]);
                  throw combined;
                }
                return value;
              }

            }
          }
        },
        {
          method: 'PUT',
          path: '/v1/fish/add/{productId}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                if ((request.payload as any).addToFavourites === true) {
                  const allowAddFavourite = await canAddFavourite(userPrincipal);

                  if (!allowAddFavourite) {
                    return h.response(getMaxFavouritesError(ApplicationConfig._maximumFavouritesPerUser)).code(400);
                  }
                }

                return await Controller.editFish(request,h,userPrincipal,documentNumber, contactId)
              }).catch(error => {
                  logger.error(`[UPDATING-SPECIES][ERROR][${error.stack || error}`);
                  return h.response().code(500).takeover();
                }
              )
            },
            description: 'Edit species for the manual entry',
            tags: ['api', 'fish', 'manual'],
            validate: {
              failAction: function(req, h, error) {
                const errorDetailsObj = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).redirect);
                  return h.redirect(url);
                }
                return h.response(errorDetailsObj).code(400).takeover();
              },
              payload: async function(value, _options) {

                const schema = Joi.object()
                  .keys({
                    id: Joi.string().required(),
                    redirect: Joi.string().required(),
                    species: Joi.string().required().custom(validateNoEmoji),
                    state: Joi.string().required().disallow(''),
                    presentation: Joi.string().required().disallow(''),
                    commodity_code: Joi.required().disallow(''),
                    commodity_code_description: Joi.string().allow('').custom(validateNoEmoji)
                  });

                if (!schema) {
                  const e = new Error('I am not sure what\'s going on') as any;
                  return e;
                }
                const joiResult = schema.validate(value, { abortEarly: false, allowUnknown: true });
                const speciesPassedJoi = !joiResult.error?.details.some((d: any) => d.path[0] === 'species');
                // composite check requires valid state/presentation/commodity_code; use name-only check when they haven't passed yet
                const otherFieldsPassedJoi = !joiResult.error?.details.some((d: any) => d.path[0] !== 'species');
                const refUrl = ApplicationConfig.getReferenceServiceUrl();

                let speciesRefError: BusinessError;
                if (!speciesPassedJoi) {
                  speciesRefError = { isError: false, error: null };
                } else if (!otherFieldsPassedJoi) {
                  speciesRefError = await validateSpeciesName((value as any).species, (value as any).scientificName ?? '', refUrl);
                } else {
                  speciesRefError = await validateSpeciesWithReferenceData(value as Product, refUrl);
                }

                const combined = mergeSchemaAndValidationErrors(
                  joiResult.error ?? null,
                  speciesRefError.isError ? [speciesRefError.error] : []
                );
                if (combined) {
                  // species first so it leads the error response object
                  const speciesIdx = combined.details.findIndex((d: any) => d.path[0] === 'species');
                  if (speciesIdx > 0) combined.details.unshift(combined.details.splice(speciesIdx, 1)[0]);
                  throw combined;
                }
                return value;
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/fish/added',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.addedFish(request,h,userPrincipal,documentNumber, contactId)
              }).catch(error =>  {
                logger.error(`[GET-SPECIES][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Get the species that you were entering manually',
            tags: ['api', 'fish', 'manual']
          }
        },
        {
          method: 'POST',
          path: '/v1/fish/added',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request,h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal,documentNumber, contactId) => {
                return await Controller.validate(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[GET-SPECIES][ERROR][${error.stack || error}`);
                return h.response().code(500);
              });
            },
            description: 'Validate fish added',
            tags: ['api', 'fish added', 'validate']
          }
        },
      ]);
      resolve(null);
    });
  }
}