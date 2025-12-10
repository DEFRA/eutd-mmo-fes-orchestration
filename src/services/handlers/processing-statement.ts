import applicationConfig from "../../applicationConfig";
import {
  MAX_PERSON_RESPONSIBLE_LENGTH,
  MAX_PLANT_NAME_LENGTH,
  MIN_PERSON_RESPONSIBLE_LENGTH,
} from "../../services/constants";
import { validateCompletedDocument, validateSpecies } from "../../validators/documentValidator";
import { validateCountriesName } from "../../validators/countries.validator";
import { validateSpeciesName, validateSpeciesWithSuggestions } from "../../validators/fish.validator";
import { ICountry } from "../../persistence/schema/common";
import { validateCommodityCode } from "../../validators/pssdCommodityCode.validator";
import { SpeciesSuggestionError } from "../../validators/validationErrors";
import {
  cleanDate,
  isPositiveNumberWithTwoDecimals, numberAsString, today,
  validateDate,
  validateWhitespace,
  validateExportHealthCertificateFormat,
  validateCCNumberFormat,
  validateUKCCNumberFormat,
  isInvalidLength,
  validatePersonResponsibleForConsignmentFormat,
  validateMaximumFutureDate,
  validateNonUKCCNumberCharLimit,
  validateProductDescriptions,
  isPsPlantNameValid
} from "../orchestration.service";
import { isEmpty } from "lodash";

export const initialState = {
  processingStatement: {
    catches: [{}],
    consignmentDescription: ''
  }
};

export default {

  "/create-processing-statement/:documentNumber/add-consignment-details": async ({ data, errors }) => {
    if (!validateProductDescriptions(data.products, data.consignmentDescription)) {
      errors.consignmentDescription = "psConsignmentEnterConsignmentDescription";
    }
    return { errors };
  },

  "/create-processing-statement/:documentNumber/add-consignment-details/:productIndex": async ({ data, errors, params }) => {
    const index = params.productIndex;
    const product = data.products[index];
    return await validateProductDescription(product, errors);
  },

  "/create-processing-statement/:documentNumber/add-catch-type": async ({ data, errors }) => {
    const index = 0;
    const ctch = data.catches[index];
    const speciesValidation = await validateSpeciesWithinCatchDetails(ctch, index, data.isNonJs, errors);
    return validateCatchType(ctch, index, speciesValidation.errors);
  },

  "/create-processing-statement/:documentNumber/add-catch-type/:catchIndex": async ({ data, errors, params }) => {
    const index = params.catchIndex;
    const ctch = data.catches[index];
    const speciesValidation = await validateSpeciesWithinCatchDetails(ctch, index, data.isNonJs, errors);
    return validateCatchType(ctch, index, speciesValidation.errors);
  },

  "/create-processing-statement/:documentNumber/add-catch-details/:productId": async ({ data, errors, params }) => {
    const index = 0;
    const productId = params.productId;

    if (!data.catches?.[index]) {
      errors[`catches-${index}-species`] = 'psCatchCertificateDescription';
      return { errors };
    } else if (data.catches.filter((c) => c.productId === productId).length <= 0) {
       errors[`catches-${index}-species`] = 'psCatchCertificateDescription';
    }

    return { errors }
  },

  "/create-processing-statement/:documentNumber/add-catch-details/:productId/:catchIndex": async ({ data, errors, params, documentNumber, userPrincipal, contactId }) => {
    const index = params.catchIndex;
    const ctch = data.catches[index];
    const { errors: catchTypeErrors } = validateCatchType(ctch, index, errors);
    const catchDetails = await validateCatchDetails(ctch, index, catchTypeErrors, documentNumber, userPrincipal, contactId);
    return validateCatchWeights(ctch, index, catchDetails.errors);
  },

  "/create-processing-statement/:documentNumber/add-catch-weights": async ({ data, errors }) => {
    const index = 0;
    const ctch = data.catches[index];
    return validateCatchWeights(ctch, index, errors);
  },

  "/create-processing-statement/:documentNumber/add-catch-weights/:catchIndex": ({ data, errors, params }) => {
    const index = params.catchIndex;
    const ctch = data.catches[index];
    return validateCatchWeights(ctch, index, errors);
  },

  "/create-processing-statement/:documentNumber/add-health-certificate": async ({ data, errors }) => {
    if (!data.healthCertificateNumber || validateWhitespace(data.healthCertificateNumber)) {
      errors.healthCertificateNumber = "psAddHealthCertificateErrorNullHealthCertificateNumber";
    }
    if (!validateExportHealthCertificateFormat(data.healthCertificateNumber)) {
      errors.healthCertificateNumber = "psAddHealthCertificateErrorFormatHealthCertificateNumber";
    }

    if (!data.healthCertificateDate || data.healthCertificateDate === "") {
      errors.healthCertificateDate = "psAddHealthCertificateErrorHealthCertificateDate";
    } else if (!validateDate(data.healthCertificateDate)) {
      errors.healthCertificateDate = "psAddHealthCertificateErrorRealDateHealthCertificateDate";
    } else if (!validateMaximumFutureDate(data.healthCertificateDate)) {
      errors.healthCertificateDate = "psAddHealthCertificateErrorMaxDaysHealthCertificateDate";
      data.healthCertificateDate = cleanDate(data.healthCertificateDate);
    } else {
      data.healthCertificateDate = cleanDate(data.healthCertificateDate);
    }
    return { errors };
  },

  "/create-processing-statement/:documentNumber/catch-added": async ({ data, currentUrl, errors }) => {
    const addAnotherCatch = data.addAnotherCatch;
    if (!addAnotherCatch || addAnotherCatch === "" || addAnotherCatch === "notset") {
      errors.addAnotherCatch = 'psCatchAddedErrorAddAnotherCatch';
      return { errors, next: currentUrl };
    }

    if (addAnotherCatch.toLowerCase() === "yes") {
      return { errors, next: `/create-processing-statement/add-catch-details/${data.catches.length}` };
    }
    return { errors, next: `/create-processing-statement/add-processing-plant-details` };
  },

  "/create-processing-statement/:documentNumber/add-processing-plant-details": ({ data, errors }) => {
    addProcessingPlantAddressErrors(data, errors);

    if (!data.personResponsibleForConsignment || validateWhitespace(data.personResponsibleForConsignment)) errors['personResponsibleForConsignment'] = "psAddProcessingPDErrorPersonResponsibleForConsignment";
    else if (data.personResponsibleForConsignment && isInvalidLength(data.personResponsibleForConsignment, MIN_PERSON_RESPONSIBLE_LENGTH, MAX_PERSON_RESPONSIBLE_LENGTH)) {
      errors['personResponsibleForConsignment'] = "psAddProcessingPDErrorPersonResponsibleForConsignmentLength";
    }
    else if (data.personResponsibleForConsignment && !validatePersonResponsibleForConsignmentFormat(data.personResponsibleForConsignment)) {
      errors['personResponsibleForConsignment'] = "psAddProcessingPDErrorResponsibleValidation";
    }

    if (!data.plantApprovalNumber || validateWhitespace(data.plantApprovalNumber)) errors['plantApprovalNumber'] = "psAddProcessingPDErrorPlantApprovalNumber";
    return { errors };
  },

  "/create-processing-statement/:documentNumber/add-processing-plant-address": ({ data, errors }) => {

    if (!data.plantAddressOne && !data.plantAddressTwo && !data.plantTownCity && !data.plantPostcode) errors['plantAddressOne'] = "psAddProcessingPlantAddressErrorAddress";
    else {
      if (!data.plantAddressOne || validateWhitespace(data.plantAddressOne)) errors['plantAddressOne'] = "Enter the building and street (address line 1 of 2)";
      if (!data.plantTownCity || validateWhitespace(data.plantTownCity)) errors['plantTownCity'] = "Enter the town or city";
      if (!data.plantPostcode || validateWhitespace(data.plantPostcode)) errors['plantPostcode'] = "Enter the postcode";
    }

    data.dateOfAcceptance = today();
    return { errors };
  },
}

function addProcessingPlantAddressErrors(data, errors) {
  if (!data.plantName || validateWhitespace(data.plantName)) {
    errors['plantName'] = "psAddProcessingPlantAddressErrorNullPlantName";
  } else if (data.plantName.length > MAX_PLANT_NAME_LENGTH) {
    errors['plantName'] = "psAddProcessingPlantAddressErrorMaxLimitPlantName";
  } else if (!isPsPlantNameValid(data.plantName)) {
    errors['plantName'] = "psAddProcessingPlantAddressErrorFormatPlantName";
  }
}

export function validateCatchType(ctch: any, index: number, errors: any) {
  if (ctch.catchCertificateType === undefined) {
    errors[`catches-${index}-catchCertificateType`] = 'psAddCatchTypeErrorSelectCatchCertificateType';
  } else if (!['uk', 'non_uk'].includes(ctch.catchCertificateType)) {
    errors[`catches-${index}-catchCertificateType`] = 'psAddCatchTypeErrorCatchCertificateTypeInvalid';
  }

  return { errors };
}

export async function validateSpeciesWithinCatchDetails(ctch: any, index: number, isNonJs: boolean, errors: any) {
  const refUrl = applicationConfig.getReferenceServiceUrl();

  if (isNonJs && isEmpty(ctch.species)) {
    errors = addCommonCatchDetailsError(errors);
    setCatchFieldsUndefined(ctch);
    return { errors };
  } else if (isNonJs) {
    // Try to see if what the user typed partially matches any secies
    const speciesMatchError = await validateSpeciesWithSuggestions(ctch.species, refUrl);
    if (speciesMatchError.isError) {
      if (speciesMatchError.error.message === "Incorect FAO code or Species name") {
        errors[`catches-species-incorrect`] = 'psAddCatchDetailsErrorIncorrectFaoOrSpecies';
      } else if (speciesMatchError.error.message === "Results match fewer than 5") {
        const speciesError = speciesMatchError as SpeciesSuggestionError
        errors[`catches-species-suggest`] = {
          translation: 'psAddCatchDetailsErrorSpeciesSuggestion',
          possibleMatches: speciesError.resultList
        };
      }
      setCatchFieldsUndefined(ctch);
    }
  } else {
    const anyError = await validateSpeciesName(ctch.species, ctch.scientificName, refUrl);
    if (anyError.isError) {
      errors = addCommonCatchDetailsError(errors);
      setCatchFieldsUndefined(ctch);
    }
  }

  return { errors };
}

function addCommonCatchDetailsError(errors: any) {
  errors[`catches-species`] = 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName';
  return errors;
}

function setCatchFieldsUndefined(ctch: any) {
  ctch.species = undefined;
  ctch.scientificName = undefined;
}

export async function validateCatchDetails(ctch: any, index: number, errors: any, documentNumber: string, userPrincipal: string, contactId: string) {
  validateSpeciesInput(ctch, index, errors);
  await validateIssuingCountryForNonUKCatch(ctch, index, errors);
  await validateCatchCertificateNumber(ctch, index, errors, documentNumber, userPrincipal, contactId);

  return { errors };
}

function validateSpeciesInput(ctch: any, index: number, errors: any) {
  if (!ctch.species || validateWhitespace(ctch.species)) {
    errors[`catches-${index}-species`] = 'psAddCatchDetailsErrorEnterTheFAOCodeOrSpeciesName';
  }
}

async function validateIssuingCountryForNonUKCatch(ctch: any, index: number, errors: any) {
  if (ctch.catchCertificateType !== 'non_uk') {
    return;
  }
  const country: ICountry = typeof ctch.issuingCountry === 'string'
    ? { officialCountryName: ctch.issuingCountry, isoCodeAlpha2: undefined, isoCodeAlpha3: undefined, isoNumericCode: undefined }
    : ctch.issuingCountry;
  const countryValidation = await validateCountriesName(country, applicationConfig.getReferenceServiceUrl(), 'issuingCountry');
  if (countryValidation.isError) {
    errors[`catches-${index}-issuingCountry`] = 'psAddCatchDetailsErrorEnterIssuingCountry';
  }
}

async function validateCatchCertificateNumber(ctch: any, index: number, errors: any, documentNumber: string, userPrincipal: string, contactId: string) {
  if (!ctch.catchCertificateNumber || validateWhitespace(ctch.catchCertificateNumber)) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorEnterTheCatchCertificateNumber';
    return;
  }

  if (!validateCCNumberFormat(ctch.catchCertificateNumber)) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorCCNumberMustOnlyContain';
    return;
  }

  if (ctch.catchCertificateType === 'uk') {
    await validateUKCatchCertificateNumber(ctch, index, errors, documentNumber, userPrincipal, contactId);
  } else if (ctch.catchCertificateType === 'non_uk') {
    validateNonUKCatchCertificateNumber(ctch, index, errors);
  }
}

async function validateUKCatchCertificateNumber(ctch: any, index: number, errors: any, documentNumber: string, userPrincipal: string, contactId: string) {
  if (!validateUKCCNumberFormat(ctch.catchCertificateNumber)) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorUKCCNumberFormatInvalid';
    return;
  }

  const isDocumentValid = await validateCompletedDocument(ctch.catchCertificateNumber, userPrincipal, contactId, documentNumber);
  if (!isDocumentValid) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorUKCCNumberNotExist';
    return;
  }

  const isSpeciesValid = await validateSpecies(ctch.catchCertificateNumber, ctch.species, ctch.speciesCode, userPrincipal, contactId, documentNumber);
  if (!isSpeciesValid) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorUKCCSpeciesMissing';
  }
}

function validateNonUKCatchCertificateNumber(ctch: any, index: number, errors: any) {
  if (!validateNonUKCCNumberCharLimit(ctch.catchCertificateNumber)) {
    errors[`catches-${index}-catchCertificateNumber`] = 'psAddCatchDetailsErrorNonUKCCNumberCharLimit';
  }
}

export function validateCatchWeights(ctch: any, index: number, errors: any) {
  validateCatchWeightsTotalWeightErrors(ctch, index, errors);

  if (!ctch.exportWeightBeforeProcessing) {
    errors[`catches-${index}-exportWeightBeforeProcessing`] = 'psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing';
  } else if (ctch.exportWeightBeforeProcessing <= 0) {
    errors[`catches-${index}-exportWeightBeforeProcessing`] = 'psAddCatchWeightsErrorExportWeightGreaterThanNullBeforeProcessing';
  } else if (!isPositiveNumberWithTwoDecimals(ctch.exportWeightBeforeProcessing)) {
    errors[`catches-${index}-exportWeightBeforeProcessing`] = 'psAddCatchWeightsErrorEnterExportWeightMaximum2DecimalBeforeProcessing';
  } else if (ctch.exportWeightBeforeProcessing > parseFloat(ctch.totalWeightLanded)) {
    errors[`catches-${index}-exportWeightBeforeProcessing`] = 'psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessingMoreThanTotalWeight'
  } else {
    (ctch.exportWeightBeforeProcessing = numberAsString(ctch.exportWeightBeforeProcessing));
  }

  if (!ctch.exportWeightAfterProcessing) {
    errors[`catches-${index}-exportWeightAfterProcessing`] = 'psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing';
  } else if (ctch.exportWeightAfterProcessing <= 0) {
    errors[`catches-${index}-exportWeightAfterProcessing`] = 'psAddCatchWeightsErrorExportWeightGreaterThanNullAfterProcessing';
  } else if (!isPositiveNumberWithTwoDecimals(ctch.exportWeightAfterProcessing)) {
    errors[`catches-${index}-exportWeightAfterProcessing`] = 'psAddCatchWeightsErrorEnterExportWeightMaximum2DecimalAfterProcessing';
  } else {
    (ctch.exportWeightAfterProcessing = numberAsString(ctch.exportWeightAfterProcessing));
  }
  return { errors };
}

function validateCatchWeightsTotalWeightErrors(ctch, index, errors) {
  if (!ctch.totalWeightLanded && ctch.catchCertificateType !== "uk") {
    errors[`catches-${index}-totalWeightLanded`] = 'psAddCatchWeightsErrorEnterTotalWeightLandedInKG';
  } else if (ctch.totalWeightLanded <= 0 && ctch.catchCertificateType !== "uk") {
    errors[`catches-${index}-totalWeightLanded`] = 'psAddCatchWeightsErrorTotalWeightGreaterThanNull';
  } else if (!isPositiveNumberWithTwoDecimals(ctch.totalWeightLanded) && ctch.catchCertificateType !== "uk") {
    errors[`catches-${index}-totalWeightLanded`] = 'psAddCatchWeightsErrorEnterTotalWeightMaximum2Decimal';
  } else {
    (ctch.totalWeightLanded = numberAsString(ctch.totalWeightLanded));
  }
}

export async function validateProductDescription(product: any, errors: any) {
  if (!product.description || validateWhitespace(product.description)) {
    errors['consignmentDescription'] = 'psAddProductDescriptionError'
  } else if (isInvalidLength(product.description, 0, 50)) {
    errors['consignmentDescription'] = 'psAddProductDescriptionCharacterError'
  }

  if (!product.commodityCode || validateWhitespace(product.commodityCode) || (await validateCommodityCode(product.commodityCode, applicationConfig.getReferenceServiceUrl())).isError === true) {
    errors['commodityCode'] = 'psAddProductCommodityCodeError'
  }

  return { errors };
}
