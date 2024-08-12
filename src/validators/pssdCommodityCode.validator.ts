import { validatePSSDCommodityCode } from './httpHelper';
import { BusinessError } from './validationErrors';

export const validateCommodityCode = async (commodityCode: string, url: string, error: string = 'commodityCode') : Promise<BusinessError> => {
  return await validatePSSDCommodityCode(commodityCode, url, error);
}