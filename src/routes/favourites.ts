import * as Hapi from "@hapi/hapi";
import * as Joi from "joi";

import errorExtractor from '../helpers/errorExtractor';
import FavouritesController from '../controllers/favourites.controller';
import logger from '../logger';
import ApplicationConfig from "../applicationConfig";
import {validateSpeciesWithReferenceData} from "../validators/fish.validator";
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
                  commodity_code_description: Joi.string().trim().allow(''),
              });

              const errors = schema.validate(value, {
                abortEarly: false,
                allowUnknown: true
              });

              if (errors.error) {
                throw errors.error;
              }

              // validate  species when favourites
              logger.info(`[ADDING-FAVOURITES][PAYLOAD][validate species][${JSON.stringify(value)}]`);
              const refUrl = ApplicationConfig.getReferenceServiceUrl();
              const anyError =  await validateSpeciesWithReferenceData(value as Product, refUrl);
              if (anyError.isError) {
                throw anyError.error;
              }
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