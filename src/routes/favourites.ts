import * as Hapi from "@hapi/hapi";
import * as Joi from "joi";

import errorExtractor from '../helpers/errorExtractor';
import { validateNoEmoji } from '../validators/emojiValidator';
import FavouritesController from '../controllers/favourites.controller';
import logger from '../logger';
import ApplicationConfig from "../applicationConfig";
import { validateSpeciesWithReferenceData, validateSpeciesName } from '../validators/fish.validator';
import { mergeSchemaAndValidationErrors, BusinessError } from '../validators/validationErrors';
import { Product } from "../persistence/schema/frontEndModels/species";

export default class FavouritesRoutes {
  public register(server: Hapi.Server): any {
    server.route([
      {
        method: 'POST',
        path: '/v1/favourites',
        options: {
          security: true,
          cors: true,
          handler: async function (_req, h) {
            try {
              return await FavouritesController.addFavourites(_req, h);
            } catch (e) {
              logger.error(`[UPDATING-SPECIES][ERROR][${e.stack || e}`);
              return h.response().code(500).takeover();
            }
          },
          description: 'Add a favourite',
          tags: ['api', 'favourites'],
          validate: {
            options: { abortEarly: false },
            failAction: function (_req, h, error) {
              return h.response(errorExtractor(error)).code(400).takeover();
            },
            payload: async function(value, _options){
              const schema = Joi.object().keys({
                  species: Joi.string().trim().required(),
                  speciesCode: Joi.string().trim().allow(''),
                  scientificName: Joi.string().trim().allow(''),
                  state: Joi.string().trim().required(),
                  stateLabel: Joi.string().trim().allow(''),
                  presentation: Joi.string().trim().required(),
                  presentationLabel: Joi.string().trim().allow(''),
                  commodity_code: Joi.string().trim().required(),
                  commodity_code_description: Joi.string().trim().allow('').custom(validateNoEmoji),
              });

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
          },
        },
      },
      {
        method: 'GET',
        path: '/v1/favourites',
        options: {
          security: true,
          cors: true,
          handler: async (request,h) => {
            return await FavouritesController.getFavourites(request, h)
              .catch(error => {
              logger.error(`[FAVOURITES-PRODUCTS][ERROR][${error.stack || error}]`);
              return h.response().code(500).takeover();
            });
          },
          description: 'Get the species that you were entering manually',
          tags: ['api', 'favourites', 'manual']
        }
      },
      {
        method: 'DELETE',
        path: '/v1/favourites/{productId}',
        options: {
          security: true,
          cors: true,
          handler: async function (req, h) {
            try {
              return await FavouritesController.deleteFavouritesProduct(req, h);
            } catch (e) {
              logger.error(`[UPDATING-SPECIES][ERROR][${e.stack || e}`);
              return h.response().code(500).takeover();
            }
          },
          description: 'Delete a favourite product',
          tags: ['api', 'favourites', 'products'],
        },
      },
    ]);
  }
}

export const getMaxFavouritesError = (limit: number) => (
  {
    'error.favourite.max': {
      key: 'error.favourite.max',
      params: { limit }
    }
  }
);