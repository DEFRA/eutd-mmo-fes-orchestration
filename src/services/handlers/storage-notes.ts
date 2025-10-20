import {
  isApprovalNumberValid,
  isInvalidLength,
  isNotExceed12Digit,
  isPositiveNumberWithTwoDecimals,
  validateCCNumberFormat,
  validateDate,
  validateDateBefore,
  validateUKDocumentNumberFormat,
  validateWhitespace,
} from "../orchestration.service";

import ApplicationConfig from '../../applicationConfig';
import { validateCompletedDocument, validateSpecies } from "../../validators/documentValidator";
import { validateSpeciesName, validateSpeciesWithSuggestions } from "../../validators/fish.validator";
import { MAX_DOCUMENT_NUMBER_LENGTH, MAX_PRODUCT_DESCRIPTION } from "../constants";
import { validateCommodityCode } from "../../validators/pssdCommodityCode.validator";
import { BusinessError, SpeciesSuggestionError } from "../../validators/validationErrors";
import { isEmpty } from "lodash";

export const initialState = {
  storageNotes: {
    catches: [{}],
    storageFacilities: [{}]
  }
};

export default {
  "/create-storage-document/:documentNumber/add-product-to-this-consignment": async ({ data, _nextUrl, _currentUrl, errors, documentNumber, userPrincipal, contactId }) => {
    const index = 0;
    const product = data.catches[index];
    const { errors: productErrors } = await validateProduct(product, index, errors, data.isNonJs);
    const { errors: entryErrors } = await validateEntry(product, index, productErrors, documentNumber, userPrincipal, contactId)

    return getOrderedErrorListForProductConsignmentPage(entryErrors, index)
  },

  "/create-storage-document/:documentNumber/add-product-to-this-consignment/:index": async ({ data, _nextUrl, _currentUrl, errors, params, documentNumber, userPrincipal, contactId }) => {
    const index = +params.index;
    const product = data.catches[index];
    const { errors: productErrors } = await validateProduct(product, index, errors, data.isNonJs);
    const { errors: entryErrors } = await validateEntry(product, index, productErrors, documentNumber, userPrincipal, contactId)

    return getOrderedErrorListForProductConsignmentPage(entryErrors, index)
  },

  "/create-storage-document/:documentNumber/departure-product-summary": async ({ data, errors }) => {
    for (const [index, ctch] of data.catches.entries()) {
      checkEitherNetWeightProductDepartureOrNetWeightFisheryProductDepartureIsPresent(ctch, index, errors);
      checkNetWeightProductDepartureIsZeroPositive(ctch, index, errors);
      checkNetWeightFisheryProductDepartureIsZeroPositive(ctch, index, errors);

      if (isEmpty(errors)) {
        ctch.productWeight = ctch.netWeightProductDeparture ? ctch.netWeightProductDeparture : ctch.netWeightFisheryProductDeparture
      }
    }

    return { errors, next: `/create-storage-document/:documentNumber/progress` }
  },

  "/create-storage-document/:documentNumber/you-have-added-a-product": async ({ data, _nextUrl, currentUrl, errors }) => {
    for (const [index, ctch] of data.catches.entries()) {
      await validateProduct(ctch, index, errors);
    }

    const addAnotherProduct = data.addAnotherProduct;
    if (!addAnotherProduct || addAnotherProduct === "" || addAnotherProduct === "notset") {
      errors.addAnotherProduct = 'Select yes if you need to add another product';
      return { errors, next: currentUrl };
    }

    if (addAnotherProduct.toLowerCase() === 'yes') {
      return { errors, next: `/create-storage-document/:documentNumber/add-product-to-this-consignment/${data.catches.length}` };
    }
    return { errors, next: `/create-storage-document/:documentNumber/add-storage-facility-details` }
  },

  "/create-storage-document/:documentNumber/add-storage-facility-details": ({ data, _nextUrl, _currentUrl, errors, _params }) => {
    const departureDate = data.arrivalTransport?.departureDate;
    return validateStorageFacility(data, departureDate, errors)
  },

  "/create-storage-document/:documentNumber/add-storage-facility-approval": ({ data, _nextUrl, _currentUrl, errors, _params }) => {
    return validateStorageApproval(data, errors)
  },
};

function checkEitherNetWeightProductDepartureOrNetWeightFisheryProductDepartureIsPresent(ctch: any, index: number, errors: any) {
  if (!ctch.netWeightProductDeparture && !ctch.netWeightFisheryProductDeparture) {
    errors[`catches-${index}-netWeightProductDeparture`] = 'sdNetWeightOrFisheryWeightProductDeparture';
  }
}

function checkNetWeightProductDepartureIsZeroPositive(ctch: any, index: number, errors: any) {
  if (ctch.netWeightProductDeparture && (+ctch.netWeightProductDeparture) <= 0) {
    errors[`catches-${index}-netWeightProductDeparture`] = 'sdNetWeightProductDepartureErrorMax2DecimalLargerThan0';
  } else if (ctch.netWeightProductDeparture && !isPositiveNumberWithTwoDecimals(ctch.netWeightProductDeparture)) {
    errors[`catches-${index}-netWeightProductDeparture`] = 'sdNetWeightProductDeparturePositiveMax2Decimal';
  } else if (ctch.netWeightProductDeparture && !isNotExceed12Digit(ctch.netWeightProductDeparture)) {
    errors[`catches-${index}-netWeightProductDeparture`] = 'sdNetWeightProductDepartureExceed12Digit';
  }
}

function checkNetWeightFisheryProductDepartureIsZeroPositive(ctch: any, index: number, errors: any) {
  if (ctch.netWeightFisheryProductDeparture && (+ctch.netWeightFisheryProductDeparture) <= 0) {
    errors[`catches-${index}-netWeightFisheryProductDeparture`] = 'sdNetWeightFisheryProductDepartureErrorMax2DecimalLargerThan0';
  } else if (ctch.netWeightFisheryProductDeparture && !isPositiveNumberWithTwoDecimals(ctch.netWeightFisheryProductDeparture)) {
    errors[`catches-${index}-netWeightFisheryProductDeparture`] = 'sdNetWeightFisheryProductDeparturePositiveMax2Decimal';
  } else if (ctch.netWeightFisheryProductDeparture && !isNotExceed12Digit(ctch.netWeightFisheryProductDeparture)) {
    errors[`catches-${index}-netWeightFisheryProductDeparture`] = 'sdNetWeightFisheryProductDepartureExceed12Digit';
  }
}

function checkFacilityArrivalDateError(exportData: any, departureDate: string, errors) {
  if (!validateDate(exportData.facilityArrivalDate)) {
    errors[`storageFacilities-facilityArrivalDate`] = "sdArrivalDateValidationError";
  } else if (validateDateBefore(exportData.facilityArrivalDate, departureDate)) {
    errors[`storageFacilities-facilityArrivalDate`] = "sdArrivalDateBeforeDepatureDateValidationError";
  }
}

function validateStorageFacility(exportData: any, departureDate: string, errors, isStorageFacilitiesPage: boolean = false) {
  checkFacilityArrivalDateError(exportData, departureDate, errors);

  if (!exportData.facilityName || validateWhitespace(exportData.facilityName)) {
    errors[`storageFacilities-facilityName`] = `sdAddStorageFacilityDetailsErrorEnterTheFacilityName`;
  }

  if (!exportData.facilityAddressOne && !exportData.facilityTownCity && !exportData.facilityPostcode) {
    errors[`storageFacilities-facilityAddressOne`] = getFacilityAddressOneError(isStorageFacilitiesPage)
  } else {
    if (!exportData.facilityAddressOne || validateWhitespace(exportData.facilityAddressOne)) {
      errors[`storageFacilities-facilityAddressOne`] = `sdAddStorageFacilityDetailsErrorEnterTheBuilding`;
    }
    if (!exportData.facilityTownCity || validateWhitespace(exportData.facilityTownCity)) {
      errors[`storageFacilities-facilityTownCity`] = `sdAddStorageFacilityDetailsErrorEnterTheTown`;
    }
    if (!exportData.facilityPostcode || validateWhitespace(exportData.facilityPostcode)) {
      errors[`storageFacilities-facilityPostcode`] = `sdAddStorageFacilityDetailsErrorEnterThePostcode`;
    }
  }

  return { errors };
}

function validateStorageApproval(exportData: any, errors) {
  if (exportData.facilityApprovalNumber && isInvalidLength(exportData.facilityApprovalNumber, 0, 50)) {
    errors[`storageFacilities-facilityApproval`] = 'sdAddStorageFacilityApprovalCharacterError';
  }

  if (exportData.facilityApprovalNumber && !isApprovalNumberValid(exportData.facilityApprovalNumber)) {
    errors[`storageFacilities-facilityApproval`] = 'sdAddStorageFacilityApprovalInvalidError';
  }

  return { errors }
}

function getFacilityAddressOneError(isStorageFacilitiesPage: boolean) {
  return isStorageFacilitiesPage ? 'sdAddStorageFacilityDetailsErrorEditTheStorageFacility'
    : 'sdAddStorageFacilityDetailsErrorEnterTheAddress';
}

function getOrderedErrorListForProductConsignmentPage(errors, index) {
  const orderedErrors = {};
  [
    `catches-${index}-certificateType`,
    `catches-${index}-certificateNumber`,
    `catches-${index}-weightOnCC`,
    `catches-${index}-supportingDocuments-0`,
    `catches-${index}-supportingDocuments-1`,
    `catches-${index}-supportingDocuments-2`,
    `catches-${index}-supportingDocuments-3`,
    `catches-${index}-supportingDocuments-4`,
    `catches-${index}-product`,
    `catches-${index}-commodityCode`,
    `catches-${index}-productDescription`,
    `catches-${index}-netWeightProductArrival`,
    `catches-${index}-netWeightFisheryProductArrival`,
  ].forEach((val) => {
    if (errors[val] !== undefined) {
      orderedErrors[val] = errors[val];
      delete errors[val];
    }
  });
  return { errors: { ...orderedErrors, ...errors } };
}

export async function isSpeciesNameValid(productName, scientificName) {
  const refUrl = ApplicationConfig.getReferenceServiceUrl();
  const anyError = await validateSpeciesName(productName, scientificName, refUrl);
  if (anyError.isError) {
    return false;
  }
  return true;
}

export function validateDocumentType(ctch: any, index: number, errors: any) {
  if (ctch.certificateType === undefined) {
    errors[`document-${index}-certificateType`] = 'sdAddCatchTypeErrorSelectCertificateType';
  } else if (!['uk', 'non_uk'].includes(ctch.certificateType)) {
    errors[`document-${index}-certificateType`] = 'sdAddCatchTypeErrorCertificateTypeInvalid';
  }

  return { errors };
}

async function validateNonJsSpeciesName(product: any, errors: any) {
  const refUrl = ApplicationConfig.getReferenceServiceUrl();
  const speciesMatchError = await validateSpeciesWithSuggestions(product.product, refUrl);
  if (speciesMatchError.isError) {
    if (speciesMatchError.error.message === "Incorect FAO code or Species name") {
      errors[`catches-species-incorrect`] = 'sdAddCatchDetailsErrorIncorrectFaoOrSpecies';
    } else if (speciesMatchError.error.message === "Results match fewer than 5") {
      const speciesError = speciesMatchError as SpeciesSuggestionError
      errors[`catches-species-suggest`] = {
        translation: 'sdAddCatchDetailsErrorSpeciesSuggestion',
        possibleMatches: speciesError.resultList
      };
    }
    product.product = undefined;
    product.scientificName = undefined;
  }
  return errors;
}

const isProductDefined = (product: any) => product.product && !validateWhitespace(product.product);

export async function validateProduct(product: any, index: number, errors, isNonJs = false) {

  if (!isProductDefined(product)) {
    errors[`catches-${index}-product`] = 'sdAddProductToConsignmentProductNameErrorNull'
  }

  if (isNonJs && isProductDefined(product)) {
    errors = await validateNonJsSpeciesName(product, errors);
  } else if (!await isSpeciesNameValid(product.product, product.scientificName)) {
    errors[`catches-${index}-product`] = 'sdAddProductToConsignmentSpeciesNameErrorInValid';

    product.product = undefined;
    product.scientificName = undefined;
  }

  if (!product.commodityCode || validateWhitespace(product.commodityCode)) {
    errors[`catches-${index}-commodityCode`] = 'sdAddProductToConsignmentCommodityCodeErrorNull';
  }

  const error: BusinessError = await validateCommodityCode(product.commodityCode, ApplicationConfig.getReferenceServiceUrl());
  if (error.isError) {
    errors[`catches-${index}-commodityCode`] = 'sdAddProductToConsignmentCommodityCodeErrorNull';
  }

  return { errors };
}

export async function validateEntry(product: any, index: number, errors, documentNumber: string = "", userPrincipal: string = "", contactId: string = "") {
  if (!product.certificateType) {
    errors[`catches-${index}-certificateType`] = 'sdAddCatchTypeErrorSelectCertificateType';
  } else if (!['uk', 'non_uk'].includes(product.certificateType)) {
    errors[`catches-${index}-certificateType`] = 'sdAddCatchTypeErrorCertificateTypeInvalid';
  }

  if (!product.certificateNumber || validateWhitespace(product.certificateNumber)) {
    errors[`catches-${index}-certificateNumber`] = 'sdAddProductToConsignmentCertificateNumberErrorNull';
  } else if (product.certificateNumber.length > MAX_DOCUMENT_NUMBER_LENGTH) {
    errors[`catches-${index}-certificateNumber`] = `sdAddProductToConsignmentWeightOnCCErrorMustNotExceed-${MAX_DOCUMENT_NUMBER_LENGTH}`;
  } else if (!validateCCNumberFormat(product.certificateNumber)) {
    errors[`catches-${index}-certificateNumber`] = `sdAddProductToConsignmentCertificateNumberErrorInvalidFormat`;
  } else if (product.certificateType === 'uk' && !validateUKDocumentNumberFormat(product.certificateNumber)) {
    errors[`catches-${index}-certificateNumber`] = 'sdAddUKEntryDocumentErrorUKDocumentNumberFormatInvalid';
  } else if (product.certificateType === 'uk' && !await validateCompletedDocument(product.certificateNumber, userPrincipal, contactId, documentNumber)) {
    errors[`catches-${index}-certificateNumber`] = 'sdAddUKEntryDocumentDoesNotExistError';
  } else if (product.certificateType === 'uk' && isProductDefined(product) && !await validateSpecies(product.certificateNumber, product.product, product.speciesCode, userPrincipal, contactId, documentNumber)) {
    errors[`catches-${index}-certificateNumber`] = 'sdAddUKEntryDocumentSpeciesDoesNotExistError';
  }

  checkSupportingDocuments(product, errors, index);
  checkProductDescription(product, errors, index);
  checkWeightOnCCErrors(product, errors, index);
  checkNetWeightArrival(product, errors, index);
  checkNetFisheryWeightArrival(product, errors, index);

  return { errors };
}

function checkWeightOnCCErrors(product: any, errors: any, index: number) {
  if (!product.weightOnCC) {
    errors[`catches-${index}-weightOnCC`] = 'sdAddProductToConsignmentWeightOnCCErrorNull';
  } else if ((+product.weightOnCC) <= 0) {
    errors[`catches-${index}-weightOnCC`] = 'sdAddProductToConsignmentWeightOnCCErrorMax2DecimalLargerThan0';
  } else if (!isPositiveNumberWithTwoDecimals(product.weightOnCC)) {
    errors[`catches-${index}-weightOnCC`] = 'sdAddProductToConsignmentWeightOnCCErrorPositiveMax2Decimal';
  }
}

function checkSupportingDocuments(product: any, errors: any, index: number) {
  for (const i in product.supportingDocuments) {
    if (!validateCCNumberFormat(product.supportingDocuments[i])) {
      errors[`catches-${index}-supportingDocuments-${i}`] = 'sdAddProductToConsignmentSupportingDocumentErrorInvalidFormat';
    } else if (product.supportingDocuments[i].length > MAX_DOCUMENT_NUMBER_LENGTH) {
      errors[`catches-${index}-supportingDocuments-${i}`] = `sdAddProductToConsignmentSupportingDocumentErrorMustNotExceed-${MAX_DOCUMENT_NUMBER_LENGTH}`;
    }
  }
}

function checkProductDescription(product: any, errors: any, index: number) {
  if (product.productDescription?.length > MAX_PRODUCT_DESCRIPTION) {
    errors[`catches-${index}-productDescription`] = `sdAddProductToConsignmentProductDescriptionErrorMustNotExceed-${MAX_PRODUCT_DESCRIPTION}`;
  } else if (!validateCCNumberFormat(product.productDescription)) {
    errors[`catches-${index}-productDescription`] = 'sdAddProductToConsignmentProductDescriptionErrorInvalidFormat';
  }
}

function checkNetWeightArrival(product: any, errors: any, index: number) {
  if (product.netWeightProductArrival && (+product.netWeightProductArrival) <= 0) {
    errors[`catches-${index}-netWeightProductArrival`] = 'sdNetWeightProductArrivalErrorMax2DecimalLargerThan0';
  } else if (product.netWeightProductArrival && !isPositiveNumberWithTwoDecimals(product.netWeightProductArrival)) {
    errors[`catches-${index}-netWeightProductArrival`] = 'sdNetWeightProductArrivalPositiveMax2Decimal';
  } else if (product.netWeightProductArrival && !isNotExceed12Digit(product.netWeightProductArrival)) {
    errors[`catches-${index}-netWeightProductArrival`] = 'sdNetWeightProductArrivalExceed12Digit';
  }
}

function checkNetFisheryWeightArrival(product: any, errors: any, index: number) {
  if (product.netWeightFisheryProductArrival && (+product.netWeightFisheryProductArrival) <= 0) {
    errors[`catches-${index}-netWeightFisheryProductArrival`] = 'sdNetWeightProductFisheryArrivalErrorMax2DecimalLargerThan0';
  } else if (product.netWeightFisheryProductArrival && !isPositiveNumberWithTwoDecimals(product.netWeightFisheryProductArrival)) {
    errors[`catches-${index}-netWeightFisheryProductArrival`] = 'sdNetWeightProductFisheryArrivalPositiveMax2Decimal';
  } else if (product.netWeightFisheryProductArrival && !isNotExceed12Digit(product.netWeightFisheryProductArrival)) {
    errors[`catches-${index}-netWeightFisheryProductArrival`] = 'sdNetWeightProductFisheryArrivalExceed12Digit';
  }
}