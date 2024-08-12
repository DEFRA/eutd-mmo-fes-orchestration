import * as Hapi from '@hapi/hapi';
import { IProduct } from '../persistence/schema/userAttributes';
import {
  saveFavouritesProduct,
  readFavouritesProducts,
  deleteFavouritesProduct,
  canAddFavourite
} from "../persistence/services/favourites";
import logger from '../logger';
import { getMaxFavouritesError } from '../routes/favourites';
import applicationConfig from '../applicationConfig';
import {validateSpeciesWithReferenceData} from "../validators/fish.validator";
import ApplicationConfig from '../applicationConfig';
import { HapiRequestApplicationStateExtended } from '../types';


export default class FavouritesController {

  public static async addFavourites(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const userPrincipal = (req.app as HapiRequestApplicationStateExtended).claims.sub;
    const payload = req.payload as any;

    logger.info(`[ADDING-FAVOURITES][PAYLOAD][validate whether species is valid ][${JSON.stringify(payload)}]`);
    const refUrl = ApplicationConfig.getReferenceServiceUrl();
    const anyError = await validateSpeciesWithReferenceData(payload, refUrl);
    if (anyError.isError) {
      return h.response(['error.species.any.invalid']).code(400)
    }

    if (await canAddFavourite(userPrincipal)) {
      const result = await saveFavouritesProduct(userPrincipal, payload);

      return (result === null)
        ? h.response(['error.favourite.duplicate']).code(400)
        : result;
    }
    else {
      return h.response(getMaxFavouritesError(applicationConfig._maximumFavouritesPerUser)).code(400);
    }
  }

  public static async getFavourites(req: Hapi.Request, _h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>): Promise<IProduct[]> {
    const userPrincipal: string = (req.app as HapiRequestApplicationStateExtended).claims.sub;
    return await readFavouritesProducts(userPrincipal) || [];
  }

  public static async deleteFavouritesProduct(req: Hapi.Request, _h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    return await deleteFavouritesProduct((req.app as HapiRequestApplicationStateExtended).claims.sub, req.params.productId);
  }

  public static async removeInvalidFavouriteProduct(userPrincipal: string, productId: string): Promise<void> {
    logger.info(`[ADDING-SPECIES][REMOVE-INVALID-FAVOURITE][${productId}]`);
    await deleteFavouritesProduct(userPrincipal, productId)
      .catch(err => logger.error(`[ADDING-SPECIES][REMOVE-INVALID-FAVOURITE][ERROR][${err}]`))
  }
}
