import * as Hapi from '@hapi/hapi';
import { has } from 'lodash';
import { Product, toIProduct, toProduct } from '../persistence/schema/frontEndModels/species';
import { ProductsLanded, ProductLanded } from '../persistence/schema/frontEndModels/payload';
import Services from '../services/fish.service';
import ExportPayloadService from '../services/export-payload.service';
import logger from '../logger';
import { redirectTo } from '../helpers/redirectTo';
import acceptsHtml from "../helpers/acceptsHtml";
import ExportPayloadController from "./export-payload.controller";
import { getStateByCode, getPresentationByCode } from "../services/reference-data.service";
import { buildRedirectUrlWithErrorStringInQueryParam } from '../helpers/errorExtractor';
import { saveFavouritesProduct } from "../persistence/services/favourites";
import { HapiRequestApplicationStateExtended } from '../types';
import SummaryErrorsService from '../services/summaryErrors.service';

export default class FishController {
  public static async addFish(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal, documentNumber, contactId: string) {

    const payload: Product = toProduct(req.payload, userPrincipal);
    const redirectUri: string = redirectTo(req);
    const p: any = req.payload;

    if (has(p, 'cancel')) {
      logger.info(`[FISH-CONTROLLER][REMOVING-FISH][${JSON.stringify({ userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub })}]`);

      await Services.removeFish({
        cancel: p.cancel,
        redirect: p.redirect,
        user_id: userPrincipal,
      }, documentNumber, contactId);

      await SummaryErrorsService.clearErrors(documentNumber);
      await FishController.addFishNonJsCancel(req, userPrincipal, documentNumber, contactId, p);     

      if (redirectUri !== null) {
        return h.redirect(redirectUri);
      }

      return {
        cancel: p.cancel,
        commodity_code: payload.commodity_code,
        commodity_code_description: payload.commodity_code_description
      };
    } else {
      const duplicate = await Services.isDuplicate(payload, documentNumber, contactId);

      if (duplicate) {
        const errorDetailsObj = ['ccProductFavouritesPageErrorDuplicate'];
        if (acceptsHtml(req.headers)) {
          const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, redirectUri);
          return h.redirect(url);
        }
        return h.response(errorDetailsObj).code(400);
      } else {
        logger.info(`[FISH-CONTROLLER][ADDING-FISH][${JSON.stringify({ userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub })}]`);

        await FishController.addFishGetLabel(payload);

        const data: Product = await Services.addFish(payload, documentNumber, contactId, (req.payload as any).isFavourite);

        await FishController.addFishAddToFavourites(data, req, userPrincipal, payload);

        await FishController.addFishNonJsAdd(req, userPrincipal, documentNumber, contactId, payload, data)

        logger.debug(`[FISH-CONTROLLER][ADD-FISH][${documentNumber}][REDIRECT][IS-REDIRECTING: ${redirectUri !== null}]`);

        if (redirectUri !== null) {
          return h.redirect(redirectUri);
        }

        return data;
      }
    }
  }

  static readonly addFishGetLabel = async (payload: Product) => {
    if (!payload.presentationLabel || !payload.stateLabel) {
      const enhanceData: any = await FishController.augmentProductDetails(payload);
      payload.presentationLabel = enhanceData.presentation.label;
      payload.stateLabel = enhanceData.state.label
    }
  }

  static readonly addFishAddToFavourites = async (data: Product, req: Hapi.Request, userPrincipal: string, payload: Product) => {
    if (data && (req.payload as any).addToFavourites) {
      const favouritesList = await saveFavouritesProduct(userPrincipal, toIProduct(payload));
      data.addedToFavourites = Array.isArray(favouritesList)  && favouritesList.length > 0 ;
    }
  }

  static readonly addFishNonJsCancel = async (req: Hapi.Request, userPrincipal, documentNumber: string, contactId: string, p: any) => {
    if (acceptsHtml(req.headers)) {
      // non js - we have to keep the landings json right because the redux events wont have worked
      const exportPayload: ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
      if (exportPayload?.items) {
        const newPayload = ExportPayloadController.removePayloadProduct(exportPayload, p.cancel);
        if (newPayload.items.length < exportPayload.items.length) {
          newPayload.errors = undefined;
          await ExportPayloadService.save(newPayload, userPrincipal, documentNumber, contactId);
        }
      }
    }
  }

  static readonly addFishNonJsAdd = async (req: Hapi.Request, userPrincipal, documentNumber: string, contactId: string, payload: Product, data: Product) => {
    if (acceptsHtml(req.headers)) {
      // non js - we have to keep the landings json right because the redux events wont have worked
      let exportPayload: ProductsLanded;
      if (payload.commodity_code && payload.commodity_code.length > 1) {

        exportPayload = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
        if (!exportPayload) {
          exportPayload = { items: [] };
        }

        const prd = await FishController.augmentProductDetails(data);
        const newPayload = ExportPayloadController.addPayloadProduct(exportPayload, prd);

        if (newPayload.items.length > exportPayload.items.length) {
          newPayload.errors = undefined;
          await ExportPayloadService.save(newPayload, userPrincipal, documentNumber, contactId);
        }
      }
    }
  }

  public static async editFish(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload: Product = toProduct(req.payload, userPrincipal);

    const redirectUri: string = redirectTo(req);

    const isDuplicate = await Services.isDuplicate(payload, documentNumber, contactId);
    if (isDuplicate) {
      const errorMessageObject = ['ccProductFavouritesPageErrorDuplicate'];
      if (acceptsHtml(req.headers)) {
        const url = buildRedirectUrlWithErrorStringInQueryParam(errorMessageObject, redirectUri);
        return h.redirect(url);
      }
      return h.response(errorMessageObject).code(400);
    } else {

      const products: Product[] = await Services.editFish(
        payload,
        documentNumber,
        contactId
      );
      logger.debug(
        `[FISH-CONTROLLER][UPDATE-FISH][${documentNumber}][REDIRECT][IS-REDIRECTING: ${
          redirectUri !== null
        }]`
      );

      await SummaryErrorsService.clearErrors(documentNumber);

      const data: {
        products: Product[],
        favourite?: Product
      } = { products };

      if (products && (req.payload as any).addToFavourites) {
        const favouritesList = await saveFavouritesProduct(userPrincipal, toIProduct(payload));
        data.favourite = {
          addedToFavourites: Array.isArray(favouritesList) && favouritesList.length > 0,
          ...payload
        };
      }

      if (redirectUri !== null) {
        return h.redirect(redirectUri);
      }

    return data;
    }
  }

  public static async addedFish(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string): Promise<{ species: Product[], partiallyFilledProductRemoved: boolean | void }> {
    let species: Product[] = await Services.addedFish(userPrincipal, documentNumber, contactId) || [];
    const exportPayload: ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId);
    const refreshRequired: boolean = await FishController.syncSpeciesAndLandings(userPrincipal, species, exportPayload, documentNumber, contactId);
    const partiallyFilledProductRemoved: boolean | void = await FishController.removeInCompleteSpecies(userPrincipal, documentNumber, species, contactId);
    if (refreshRequired || partiallyFilledProductRemoved) {
      species = await Services.addedFish(userPrincipal, documentNumber, contactId);
    }
    return {
      species,
      partiallyFilledProductRemoved
    }
  }

  public static async syncSpeciesAndLandings(userId: string, species: Product[], exportPayload: ProductsLanded, documentNumber: string, contactId: string): Promise<boolean> {
    let refreshRequired = false;
    const unmatchedSpecies = species.filter((s: Product) => {
      const include = (s.commodity_code && s.commodity_code.length > 1);
      let matched: ProductLanded;
      if (include) {
        matched = exportPayload ? exportPayload.items.find(item => item.product.id === s.id) : undefined;
      }
      return include && !matched;
    });

    if (unmatchedSpecies.length > 0) {
      refreshRequired = true;
      await FishController.removeFish(userId, unmatchedSpecies, documentNumber, contactId, unmatchedSpecies.length);
    }

    if (exportPayload?.items) {
      const unmatchedExportPayloadItems = exportPayload.items.filter((item: any) => {
        const found = species.find((s: any) => {
          return s.id === item.product.id;
        });
        // filter out any elements that were found
        return !found;
      });

      if (unmatchedExportPayloadItems.length > 0) {
        refreshRequired = true;
        const ln = unmatchedExportPayloadItems.length;
        for (let idx = 0; idx < ln; idx++) {
          await Services.addFish({
            user_id: userId,
            id: unmatchedExportPayloadItems[idx].product.id,
            state: unmatchedExportPayloadItems[idx].product.state.code,
            stateLabel: unmatchedExportPayloadItems[idx].product.state.label,
            stateAdmin: unmatchedExportPayloadItems[idx].product.state.admin,
            presentation: unmatchedExportPayloadItems[idx].product.presentation.code,
            presentationLabel: unmatchedExportPayloadItems[idx].product.presentation.label,
            presentationAdmin: unmatchedExportPayloadItems[idx].product.presentation.admin,
            species: unmatchedExportPayloadItems[idx].product.species.label,
            speciesAdmin: unmatchedExportPayloadItems[idx].product.species.admin,
            speciesCode: unmatchedExportPayloadItems[idx].product.species.code,
            commodity_code: unmatchedExportPayloadItems[idx].product.commodityCode,
            commodity_code_admin: unmatchedExportPayloadItems[idx].product.commodityCodeAdmin
          }, documentNumber, contactId);
        }
      }
    }
    return refreshRequired;
  }

  static readonly removeFish = async (userId: string, unmatchedSpecies: Product[], documentNumber: string, contactId: string, unmatchedSpeciesLength: number) => {
    for (let idx = 0; idx < unmatchedSpeciesLength; idx++) {
      await Services.removeFish({
        user_id: userId,
        cancel: unmatchedSpecies[idx].id
      }, documentNumber, contactId);
    }
  }

  public static async removeInCompleteSpecies(userId: string, documentNumber: string, species: Product[], contactId: string): Promise<boolean | void> {

    const hasCompleteSpeciesInformation: (product: Product) => boolean = (product: Product) => [
      'species',
      'speciesCode',
      'state',
      'stateLabel',
      'presentation',
      'presentationLabel',
      'commodity_code',
    ].every(prop => Object.prototype.hasOwnProperty.call(product, prop));

    const partiallyFilled: Product[] = species.filter((product: Product) => !hasCompleteSpeciesInformation(product));

    if (partiallyFilled.length > 0) {
      return await Promise.all(partiallyFilled.map(async (product: Product) => {
        logger.info(`[REMOVE-INCOMPLETE-SPECIES][${documentNumber}][SPECIES-ID][${product.id}]`);
        return await Services.removeFish({
          user_id: userId,
          cancel: product.id
        }, documentNumber, contactId);
      }))
        .then(() => {
          return true
        })
        .catch((err: Error) => {
          logger.error(`[REMOVE-INCOMPLETE-SPECIES][${documentNumber}][ERROR][${err.stack || err}]`)
        });
    }
  }

  public static async augmentProductDetails(data) {
    const prd = {
      id: data.id,
      commodityCode: data.commodity_code,
      commodityCodeDescription: data.commodity_code_description,
      presentation: {
        code: data.presentation,
        label: data.presentationLabel
      },
      scientificName: data.scientificName,
      state: {
        code: data.state,
        label: data.stateLabel
      },
      species: {
        code: data.speciesCode,
        label: data.species
      }
    };

    if (prd.species.label && !prd.species.code) {
      let faoCode = prd.species.label;
      const startIdx = faoCode.lastIndexOf('(');
      if (startIdx && faoCode.indexOf(')', startIdx)) {
        faoCode = prd.species.label.substring(startIdx + 1, faoCode.indexOf(')', startIdx)).trim();
        prd.species.code = faoCode;
      }
    }

    if (prd.state.code && !prd.state.label) {
      const state = await getStateByCode(prd.state.code);
      if (state) {
        prd.state.label = state.label;
      }
    }

    if (prd.presentation.code && !prd.presentation.label) {
      const presentation = await getPresentationByCode(prd.presentation.code);
      if (presentation) {
        prd.presentation.label = presentation.label;
      }
    }

    return prd;
  }

  public static async validate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    const hasFish = await Services.hasFish(userPrincipal, documentNumber, contactId);
    if (!hasFish) {
      const errorDetailsObj = ['ccWhatExportingFromAtleastOneProductError'];
      if (acceptsHtml(req.headers)) {
        const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, redirectTo(req));
        return h.redirect(url);
      }
      return h.response(errorDetailsObj).code(400);
    }

    return h.response().code(200);
  }
}
