import { flatten } from 'lodash';
import * as moment from 'moment';
import { ProductLanded } from '../persistence/schema/frontEndModels/payload';

import { SeasonalFishPeriod, getSeasonalFish } from '../services/reference-data.service'

type ProductItem = {
  id: string;
  landingId: string;
  pln: string;
  startDate: string;
  dateLanded: string;
  species: {
    code: string;
    label: string;
  };
  weight: number;
}

export const unwind = (products): ProductItem[] =>
  flatten(
    products.map(product => product.landings.map(landing => ({
      id: product.product.id,
      landingId: landing.model.id,
      pln: landing.model.vessel.pln,
      startDate: landing.model.startDate,
      dateLanded: landing.model.dateLanded,
      species: {
        code: product.product.species.code,
        label: product.product.species.label
      },
      weight: landing.model.exportWeight
    }))))

const seasonalFishValidator = (blackPeriods: SeasonalFishPeriod[]) =>
  (item: ProductItem) => {
    const fields = ['startDate', 'dateLanded'];
    const result = [];

    fields.forEach(field => {
      const isSeasonalCatch = blackPeriods.some((p) => p.fao === item.species.code &&
        moment(p.validFrom).isSameOrBefore(item[field]) &&
        moment(item[field]).isSameOrBefore(p.validTo));

      if (item[field] && isSeasonalCatch) {
        result.push(field);
      }
    })

    return result;
  }

export const validateProducts = async (products) => {
  const validators = [{
    name: 'seasonalFish',
    validator: seasonalFishValidator(await getSeasonalFish())
  }]

  return flatten(unwind(products).map(
    item => validators.map(
      validator => ({
        ...item,
        validator: validator.name,
        result: validator.validator(item)
      }))))
}

export const productsAreValid = async (products: ProductLanded[]) =>
  await validateProducts(products)
    .then((res) => {
      const fields = ['startDate', 'dateLanded'];
      const validations = [];
      fields.forEach(f => {
        if (res.some(validation => (validation.result.some((r) => r === f ) && validation.validator === 'seasonalFish'))) {
          validations.push(f);
        }
      })
      return validations;
    });