import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import Controller from '../controllers/fish.controller';
import FavouritesController from '../controllers/favourites.controller';
import acceptsHtml from '../helpers/acceptsHtml';
import { validateSpeciesWithReferenceData } from '../validators/fish.validator';
import errorExtractor, { buildRedirectUrlWithErrorStringInQueryParam } from '../helpers/errorExtractor';
import ApplicationConfig from '../applicationConfig';
import { withDocumentLegitimatelyOwned } from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { canAddFavourite } from '../persistence/services/favourites';
import { getMaxFavouritesError } from './favourites';
import { defineAuthStrategies } from '../helpers/auth';
import { HapiRequestApplicationStateExtended } from '../types';
import { Product } from '../persistence/schema/frontEndModels/species';

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
                logger.error(`[ADDING-SPECIES][FAILED-ACTION][/v1/fish/add]`);
                let errorDetailsObj = errorExtractor(error);

                if ((req.payload as any).isFavourite && Object.prototype.hasOwnProperty.call(errorDetailsObj, 'species') && errorDetailsObj['species'] === 'error.species.any.invalid') {
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
                  // TODO: Once commodity code flow is decided we can enable this back on
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
                    species: Joi.string().required(),
                    state: Joi.string().required().disallow(''),
                    presentation: Joi.string().required().disallow(''),
                    commodity_code: Joi.required().disallow(''),
                    commodity_code_description: Joi.string().allow(''),
                    addToFavourites : Joi.boolean().optional(),
                  });

                if (!schema) {
                  const e = new Error('I am not sure what\'s going on') as any;
                  return e;
                }
                const errors = schema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }

                // validate whether species is valid only when adding species
                logger.info(`[ADDING-SPECIES][PAYLOAD][validate whether species is valid only when adding species][${JSON.stringify(value)}]`);
                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const anyError = await validateSpeciesWithReferenceData(value, refUrl);
                if (anyError.isError) {
                  throw anyError.error;
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
                    species: Joi.string().required(),
                    state: Joi.string().required().disallow(''),
                    presentation: Joi.string().required().disallow(''),
                    commodity_code: Joi.required().disallow(''),
                    commodity_code_description: Joi.string().allow('')
                  });

                if (!schema) {
                  const e = new Error('I am not sure what\'s going on') as any;
                  return e;
                }
                const errors = schema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }

                // validate whether species is valid only when adding species
                const refUrl = ApplicationConfig.getReferenceServiceUrl();
                const anyError = await validateSpeciesWithReferenceData(value as Product, refUrl);
                if (anyError.isError) {
                  throw anyError.error;
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