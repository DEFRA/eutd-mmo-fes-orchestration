import { isEmpty } from 'lodash';
import { Species } from '../validators/interfaces/species.interface';

export const calculateRank = (option: Species, queryStr: string) => {
  const commonRank = option.commonRank || 0;
  let rank;
  if (option.faoCode?.toLowerCase().includes(queryStr)) rank = 1;
  else if (option.faoName?.toLowerCase().includes(queryStr)) rank = 10 + commonRank;
  else if (option.scientificName?.toLowerCase().includes(queryStr)) rank = 20 + commonRank;
  else if ((option.commonNames || []).join("").toLowerCase().includes(queryStr)) rank = 20 + commonRank;
  option.rank = rank || 100;
  return option;
}

export const querySpecies = (query: string, options: Species[]) => {
  if (isEmpty(query)) {
    return [];
  }

  const optionName = (option: Species) => `${option.faoName} (${option.faoCode})`;

  const queryStr = query.trim().toLowerCase();

  // Prefer exact matches first so FAO code inputs like "COD" don't fan out
  // into large fuzzy result sets that hide the intended suggestion path.
  const exactMatches = options
    .filter((option: Species) => {
      const faoCode = option.faoCode?.trim().toLowerCase() ?? "";
      const faoName = option.faoName?.trim().toLowerCase() ?? "";
      const fullLabel = optionName(option).trim().toLowerCase();

      return queryStr === faoCode || queryStr === faoName || queryStr === fullLabel;
    })
    .map((option: Species) => optionName(option));

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return options
    .filter((option: Species) => optionName(option).toLowerCase().includes(queryStr))
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