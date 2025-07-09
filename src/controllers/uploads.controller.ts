import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { isEmpty } from 'lodash';
import * as Hapi from '@hapi/hapi';
import { IUploadedLanding, UploadedLandingMeta } from "../persistence/schema/uploads";
import { buildRedirectUrlWithErrorStringInQueryParam } from '../helpers/errorExtractor';
import { getRandomNumber, looksLikeADate } from '../helpers/utils/utils';
import { LandingStatus, ProductLanded, ProductsLanded, Product, toProduct } from "../persistence/schema/frontEndModels/payload";
import ExportPayloadService from "../services/export-payload.service";
import UploadsService from "../services/uploads.service";
import acceptsHtml from "../helpers/acceptsHtml";
import * as csv from 'csvtojson'
import ApplicationConfig from '../applicationConfig'
import { readFavouritesProducts } from '../persistence/services/favourites';
import { IProduct } from '../persistence/schema/userAttributes';
import axios from 'axios';
import FavouritesController from './favourites.controller';

export default class UploadsController {

  public static async parseLandingsFile(data: string, userPrincipal: string, contactId: string, cache?: boolean): Promise<IUploadedLanding[]> {
    if (!data?.trim()) {
      throw new Error('error.upload.min-landings');
    }

    let rows = await csv({noheader: true, output: 'line'}).fromString(data);

    rows = rows.filter(item => !isEmpty(item.replace(/^[, ]+$/g, '')));
    rows = rows.map(item => item.toUpperCase());

    if (rows.length > ApplicationConfig._maxLimitLandings) {
      throw new Error('error.upload.max-landings')
    }

    const landings = await this.parseRows(rows);
    const validatedLandings: IUploadedLanding[] = await this.validateLandings(userPrincipal, landings);

    if (cache)
      await UploadsService.cacheUploadedRows(userPrincipal, contactId, validatedLandings);

    return validatedLandings;
  }

  public static async parseRows(rows: string[]): Promise<IUploadedLanding[]> {
    let rowNumber = 1;



    const landings: IUploadedLanding[] = await Promise.all(rows.map(async (originalRow) => {
      const cells = originalRow.split(',');

      const allKeys = Object.keys(UploadedLandingMeta);
      const optionalKeys = allKeys.filter((k: string) => UploadedLandingMeta[k].optional);
      const landingDateIndex = allKeys.indexOf('landingDate');

      let headers = allKeys;
      // make assumptions based on field count
      if (cells.length === (allKeys.length - optionalKeys.length)) {
        // mandatory fields only
        headers = allKeys.filter(k => !optionalKeys.includes(k))
      } else if (cells.length === allKeys.length-1 && looksLikeADate(cells[landingDateIndex]))
        // assume start date is there if landing date still looks a date
        headers = allKeys.filter(k => k !== 'gearCode');
      else if (cells.length === allKeys.length-1) {
        // otherwise assume no start date is present
        headers = allKeys.filter(k => k !== 'startDate');
      }

      const params = {
        noheader: true,
        headers,
        checkColumn: true
      };

      const json: IUploadedLanding[] = await csv(params).fromString(originalRow);

      const landing: IUploadedLanding = {
        ...json[0],
        rowNumber,
        originalRow,
        errors: []
      };

      rowNumber++;

      return landing;
    }));

    return landings;
  }

  public static async validateLandings(userPrincipal: string, landings: IUploadedLanding[]): Promise<IUploadedLanding[]> {
    const products: IProduct[] = await readFavouritesProducts(userPrincipal) || [];
    const landingLimitDaysInFuture: number = ApplicationConfig._landingLimitDaysInTheFuture;

    const baseUrl = ApplicationConfig.getReferenceServiceUrl();
    const url = `${baseUrl}/v1/upload/landings/validate`;
    const payload = {landings, products, landingLimitDaysInFuture}

    const res = await axios.post(url, payload);
    const validatedLandings: IUploadedLanding[] = res.data;

    validatedLandings.forEach(landing => {
      if (landing.errors.includes('error.product.any.invalid')) {
        FavouritesController.removeInvalidFavouriteProduct(userPrincipal, landing.productId);
      }
    });

    return validatedLandings;
  }

  public static async saveLandingRows(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string, rows: IUploadedLanding[]): Promise<Hapi.ResponseObject> {
    const landings = await this.validateLandings(userPrincipal, rows);

    const isValidLanding = (landing: IUploadedLanding): boolean => landing.errors && landing.errors.length === 0 || !landing.errors;
    const hasValidLanding = (_: IUploadedLanding[]): boolean => _.some(isValidLanding);
    const failSaveLandingRows = (errorDetailsObj: { file: string } | { file: { key: string , params: { limit: number }}}): Hapi.ResponseObject => {
      if (acceptsHtml(req.headers)) {
        const url = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, (req.payload as any).currentUri);
        return h.redirect(url);
      }
      return h.response(errorDetailsObj).code(400);
    }

    if (!hasValidLanding(landings)) {
      return failSaveLandingRows({ file: 'error.file.any.required' });
    }

    const validLandings: IUploadedLanding[] = landings.filter(isValidLanding);
    const exportPayload: ProductsLanded = await ExportPayloadService.get(userPrincipal, documentNumber, contactId) || { items: []};
    const totalCurrentLandings: LandingStatus[] = exportPayload.items.reduce((acc: LandingStatus[], curr: ProductLanded) => {
      if (curr.landings && curr.landings.length > 0) {
        return [...acc, ...curr.landings]
      }

      return acc;
    }, []);

    const totalLandings = totalCurrentLandings.length + validLandings.length;
    if (totalLandings > ApplicationConfig._maxLimitLandings) {
      return failSaveLandingRows({
        file: {
          key: 'error.upload.max-landings',
          params: {
            limit: ApplicationConfig._maxLimitLandings
          }
        }
      });
    }

    const findLanding = (currentLanding: IUploadedLanding, items: ProductLanded[]): ProductLanded =>
      items.find((item: ProductLanded) =>
        currentLanding.product.species === item.product.species.label &&
        currentLanding.product.speciesCode === item.product.species.code &&
        currentLanding.product.state === item.product.state.code &&
        currentLanding.product.presentation === item.product.presentation.code &&
        currentLanding.product.commodity_code === item.product.commodityCode);

    for (const validLanding of validLandings) {
      const item: ProductLanded = findLanding(validLanding, exportPayload.items);
      const newLanding: LandingStatus = {
        model: {
          id: `${documentNumber}-${getRandomNumber()}`,
          vessel: validLanding.vessel,
          startDate: validLanding.startDate ? moment(validLanding.startDate, 'DD/MM/YYYY').format('YYYY-MM-DD') : undefined,
          dateLanded: moment(validLanding.landingDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          exportWeight: validLanding.exportWeight,
          faoArea: validLanding.faoArea,
          gearCategory: validLanding.gearCategory,
          gearType: validLanding.gearCode && `${validLanding.gearName} (${validLanding.gearCode})`
        }
      };

      UploadsController.addLanding(item, newLanding, documentNumber, validLanding, exportPayload);
    }

    await ExportPayloadService.save(exportPayload, userPrincipal, documentNumber, contactId);

    return h.response(landings).code(200);
  }

  static readonly addLanding = (
    item: ProductLanded,
    newLanding: LandingStatus,
    documentNumber: string,
    validLanding: IUploadedLanding,
    exportPayload: ProductsLanded
  ) => {
    if (item && Array.isArray(item.landings)) {
      item.landings.push(newLanding);
    } else if (item) {
      item.landings = [newLanding];
    } else {
      const productId = `${documentNumber}-${uuidv4()}`;
      const product: Product = toProduct({ ...validLanding, id: productId });
      item = {
        product,
        landings: [newLanding]
      };

      exportPayload.items.push(item);
    }
  }

  public static async getCacheUploadedRows(userPrincipal: string, contactId: string): Promise<IUploadedLanding[]> {
    return await UploadsService.getCacheUploadedRows(userPrincipal, contactId);
  }

  public static async invalidateCacheUploadedRows(userPrincipal: string, contactId: string): Promise<void> {
    return await UploadsService.invalidateCacheUploadedRows(userPrincipal, contactId);
  }
}