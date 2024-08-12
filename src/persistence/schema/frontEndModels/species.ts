import * as BackendModels from '../../schema/catchCert';
import { IProduct } from '../userAttributes';

export interface Product {
  id: string;
  user_id: string;
  species?: string;
  speciesAdmin?: string;
  speciesCode?: string;
  scientificName?: string;
  state?: string;
  stateLabel?: string;
  stateAdmin?: string;
  presentation?: string;
  presentationLabel?: string;
  presentationAdmin?: string;
  commodity_code?: string;
  commodity_code_description?: string;
  commodity_code_admin?: string;
  factor?: number;
  caughtBy?: BackendModels.Catch[]
  addedToFavourites?: boolean;
}

export const toBackEndProduct = (species: Product): BackendModels.Product => {
  const result = {
    species: species.species,
    speciesId: species.id,
    speciesCode: species.speciesCode,
    scientificName: species.scientificName,
    commodityCode: species.commodity_code,
    commodityCodeDescription: species.commodity_code_description,
    factor: species.factor,
    state: (species.state) ? {
      code: species.state,
      name: species.stateLabel
    } : undefined,
    presentation: (species.presentation) ? {
      code: species.presentation,
      name: species.presentationLabel
    } : undefined,
    caughtBy: species.caughtBy || undefined
  };

  Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});

  return result;
};

export const toIProduct = (product: Product): IProduct => product ? {
  species: product.species,
  speciesCode: product.speciesCode,
  scientificName: product.scientificName,
  state: product.state,
  stateLabel: product.stateLabel,
  presentation: product.presentation,
  presentationLabel: product.presentationLabel,
  commodity_code: product.commodity_code,
  commodity_code_description: product.commodity_code_description,
} : null;

export const toProduct = (payload: any, userPrincipal: string): Product => ({
  species: payload.species,
  id: payload.id,
  state: payload.state,
  stateLabel: payload.stateLabel,
  commodity_code: payload.commodity_code,
  commodity_code_description: payload.commodity_code_description,
  presentation: payload.presentation,
  presentationLabel: payload.presentationLabel,
  speciesCode: payload.speciesCode,
  scientificName: payload.scientificName,
  user_id: userPrincipal
});