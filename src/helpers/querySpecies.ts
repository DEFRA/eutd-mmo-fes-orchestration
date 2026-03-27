import { isEmpty } from 'lodash';
import { Species } from '../validators/interfaces/species.interface';

export const calculateRank = (option: Species, queryStr: string) => {
  const commonRank = option.commonRank || 0;
  let rank;
  if (option.faoCode?.toLowerCase().indexOf(queryStr) !== -1) rank = 1;
  else if (option.faoName?.toLowerCase().indexOf(queryStr) !== -1) rank = 10 + commonRank;
  else if (option.scientificName?.toLowerCase().indexOf(queryStr) !== -1) rank = 20 + commonRank;
  else if ((option.commonNames || []).join("").toLowerCase().indexOf(queryStr) !== -1) rank = 20 + commonRank;
  option.rank = rank || 100;
  return option;
}

export const querySpecies = (query: string, options: Species[]) => {
  if (isEmpty(query)) {
    return [];
  }

  const optionName = (option: Species) => `${option.faoName} (${option.faoCode})`;

  const queryStr = query.toLowerCase();
  return options
    .filter((option: Species) => optionName(option).toLowerCase().indexOf(queryStr) !== -1)
    .map((option: Species) => calculateRank(option, queryStr))
    .sort((a: Species, b: Species) => {
      const rankA = a.rank ?? 0;
      const rankB = b.rank ?? 0;
      const faoCodeA = a.faoCode ?? "";
      const faoCodeB = b.faoCode ?? "";

      if (rankA < rankB) {
        return -1;
      }

      if (rankA > rankB) {
        return 1;
      }

      if (faoCodeA < faoCodeB) {
        return -1;
      }

      if (faoCodeA > faoCodeB) {
        return 1;
      }

      return 0;
    })
    .map((option: Species) => optionName(option));
};