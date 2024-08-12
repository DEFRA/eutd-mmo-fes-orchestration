import { IStoreable } from '../../session_store/storeable';

export interface MySpecies extends IStoreable {
  presentation: string,
  presentationLabel: string,
  species: string,
  id: string,
  user_id: string,
  state: string | void,
  stateLabel: string | void,
  commodity_code: string | void,
  commodity_code_description: string | void,
  speciesCode: string,
  scientificName: string
}

export interface Species {
  id?: string;
  species?: string;
  speciesCode?: string;
  scientificName?: string;
  state?: string;
  stateLabel?: string;
  presentation?: string;
  presentationLabel?: string;
  commodity_code?: string;
  commodity_code_description?: string;
  addedToFavourites?: boolean;
  redirect: string;
  faoCode?: string;
  faoName?: string;
  commonRank?: number;
  commonNames?: string[];
  rank?: number;
}