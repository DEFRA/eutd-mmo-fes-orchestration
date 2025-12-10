import * as Joi from 'joi';
import { validateCountriesName } from '../validators/countries.validator';
import ApplicationConfig from '../applicationConfig';

export const decimalPlacesValidator = (value: number, helpers: any) => {

  if (countDecimals(value) > 2) {
    return helpers.error('number.decimal-places')
  }

  return value;
}

const countDecimals = (value: number): number => {
  if (Math.floor(value) === value) {
    return 0;
  }

  return value.toString().split('.')[1].length || 0;
}

const isZoneEmpty = (zone: any): boolean => {
  return !zone?.officialCountryName || (typeof zone.officialCountryName === 'string' && !zone.officialCountryName.trim());
};

const createEmptyZoneError = (index: number): Joi.ValidationError => {
  return new Joi.ValidationError(`error.eez.${index}.any.required`, [
    {
      message: `error.eez.${index}.any.required`,
      path: ['eez', index],
      type: 'any.required',
      context: { label: `exclusiveEconomicZones[${index}].officialCountryName`, key: 'officialCountryName' }
    }
  ], null);
};

const handleEmptyZone = (isHighSeasNo: boolean, index: number, validationErrors: any[], indicesToRemove: number[]): void => {
  if (isHighSeasNo) {
    validationErrors.push(createEmptyZoneError(index));
  } else {
    indicesToRemove.push(index);
  }
};

const handleNonEmptyZone = async (zone: any, refUrl: string, index: number, validationErrors: any[]): Promise<void> => {
  const anyError = await validateCountriesName(zone, refUrl, `eez.${index}`);
  if (anyError.isError) {
    validationErrors.push(anyError.error);
  }
};

const removeEmptyRecords = (zones: any[], indicesToRemove: number[]): void => {
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    zones.splice(indicesToRemove[i], 1);
  }
};

export const validateExclusiveEconomicZones = async (value: any): Promise<any[]> => {
  const validationErrors: any[] = [];

  if (!value.exclusiveEconomicZones || value.exclusiveEconomicZones.length === 0) {
    return validationErrors;
  }

  const refUrl = ApplicationConfig.getReferenceServiceUrl();
  const isHighSeasNo = value.highSeasArea === 'No';
  const isHighSeasYes = value.highSeasArea === 'Yes';
  const indicesToRemove: number[] = [];

  for (let i = 0; i < value.exclusiveEconomicZones.length; i++) {
    const zone = value.exclusiveEconomicZones[i];
    const isEmpty = isZoneEmpty(zone);

    if (isEmpty) {
      handleEmptyZone(isHighSeasNo, i, validationErrors, indicesToRemove);
    } else {
      await handleNonEmptyZone(zone, refUrl, i, validationErrors);
    }
  }

  if (isHighSeasYes && indicesToRemove.length > 0) {
    removeEmptyRecords(value.exclusiveEconomicZones, indicesToRemove);
  }

  return validationErrors;
}
