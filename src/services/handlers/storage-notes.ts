  import {
  cleanDate,
  isPlaceProductEntersUkValid,
  isPositiveNumberWithTwoDecimals,
  isTransportUnloadedFromFormatValid,
  validateCCNumberFormat,
  validateDate,
  validateTodayOrInThePast,
  validateUKDocumentNumberFormat,
  validateWhitespace,
} from "../orchestration.service";

import ApplicationConfig from '../../applicationConfig';
import { validateCompletedDocument, validateSpecies } from "../../validators/documentValidator";
import { validateSpeciesName, validateSpeciesWithSuggestions } from "../../validators/fish.validator";
import { MAX_DOCUMENT_NUMBER_LENGTH, MAX_TRANSPORT_UNLOADED_FROM_LENGTH, MAX_PORT_NAME_LENGTH} from "../constants";
import { validateCommodityCode } from "../../validators/pssdCommodityCode.validator";
import { BusinessError, SpeciesSuggestionError } from "../../validators/validationErrors";

export const initialState = {
  storageNotes: {
    catches: [{}],
    storageFacilities: [{}]
  }
};

export default {
  "/create-storage-document/:documentNumber/add-product-to-this-consignment": async ({ data, _nextUrl, _currentUrl, errors }) => {
    const index = 0;
    const product = data.catches[index];
    return await validateProduct(product, index, errors, data.isNonJs);
  },

  "/create-storage-document/:documentNumber/add-product-to-this-consignment/:index": async ({ data, _nextUrl, _currentUrl, errors, params }) => {
    const index = +params.index;
    const product = data.catches[index];
    return await validateProduct(product, index, errors, data.isNonJs);
  },

  "/create-storage-document/:documentNumber/add-UK-entry-document": async ({ data, _nextUrl, _currentUrl, errors, documentNumber, userPrincipal, contactId }) => {
    const index = 0;
    const product = data.catches[index];
    return await validateEntry(product, index, errors, documentNumber, userPrincipal, contactId);
  },

  "/create-storage-document/:documentNumber/add-UK-entry-document/:index": async ({ data, _nextUrl, _currentUrl, errors, params,  documentNumber, userPrincipal, contactId }) => {
    const index = +params.index;
    const product = data.catches[index];
    return await validateEntry(product, index, errors,  documentNumber, userPrincipal, contactId);
  },

  "/create-storage-document/:documentNumber/you-have-added-a-product": async ({ data, _nextUrl, currentUrl, errors, documentNumber, userPrincipal, contactId }) => {
    for (const [index, ctch] of data.catches.entries()) {
      await validateProduct(ctch, index, errors);
      await validateEntry(ctch, index, errors, documentNumber, userPrincipal, contactId);
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
    const index = 0;
    const storageFacility = data.storageFacilities[index];
    return validateStorageFacility(storageFacility, index, errors)
  },

  "/create-storage-document/:documentNumber/add-storage-facility-details/:index": ({ data, _nextUrl, _currentUrl, errors, params }) => {
    const index = +params.index;
    const storageFacility = data.storageFacilities[index];
    return validateStorageFacility(storageFacility, index, errors)
  },

  "/create-storage-document/:documentNumber/add-document-type/:productIndex": async ({ data, errors, params }) => {
    const index = params.productIndex;
    const ctch = data.catches[index];
    return validateDocumentType(ctch, index, errors);
  },

  "/create-storage-document/:documentNumber/add-document-type": async ({ data, errors, _params }) => {
    const index = 0;
    const ctch = data.catches[index];
    return validateDocumentType(ctch, index, errors);
  },

  "/create-storage-document/:documentNumber/you-have-added-a-storage-facility": ({ data, _nextUrl, currentUrl, errors }) => {
    data.storageFacilities.forEach((storageFacility, index) => {
      validateStorageFacility(storageFacility, index, errors, true);
    });

    const addAnotherStorageFacility = data.addAnotherStorageFacility;
    if (!addAnotherStorageFacility || addAnotherStorageFacility === "" || addAnotherStorageFacility === "notset") {
      errors.addAnotherStorageFacility = 'Select yes if you need to add another storage facility';
      return { errors, next: currentUrl };
    }

    if (addAnotherStorageFacility.toLowerCase() === 'yes') {
      return { errors, next: `/create-storage-document/:documentNumber/add-storage-facility-details/${data.storageFacilities.length}` };
    }

    return { errors, next: `/create-storage-document/:documentNumber/how-does-the-export-leave-the-uk` }
  }
};

function validateStorageFacility(storageFacility: any, index: number, errors, isStorageFacilitiesPage: boolean = false) {
  if (!storageFacility.facilityName || validateWhitespace(storageFacility.facilityName)) {
    errors[`storageFacilities-${index}-facilityName`] = `sdAddStorageFacilityDetailsErrorEnterTheFacilityName`;
  }

  if (!storageFacility.facilityAddressOne && !storageFacility.facilityTownCity && !storageFacility.facilityPostcode) {
    errors[`storageFacilities-${index}-facilityAddressOne`] = getFacilityAddressOneError(isStorageFacilitiesPage)
  } else {
    if (!storageFacility.facilityAddressOne || validateWhitespace(storageFacility.facilityAddressOne)) {
      errors[`storageFacilities-${index}-facilityAddressOne`] = `sdAddStorageFacilityDetailsErrorEnterTheBuilding`;
    }
    if (!storageFacility.facilityTownCity || validateWhitespace(storageFacility.facilityTownCity)) {
      errors[`storageFacilities-${index}-facilityTownCity`] = `sdAddStorageFacilityDetailsErrorEnterTheTown`;
    }
    if (!storageFacility.facilityPostcode || validateWhitespace(storageFacility.facilityPostcode)) {
      errors[`storageFacilities-${index}-facilityPostcode`] = `sdAddStorageFacilityDetailsErrorEnterThePostcode`;
    }
  }

  return { errors };
}

function getFacilityAddressOneError(isStorageFacilitiesPage: boolean) {
  return isStorageFacilitiesPage ? 'sdAddStorageFacilityDetailsErrorEditTheStorageFacility'
  : 'sdAddStorageFacilityDetailsErrorEnterTheAddress';
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

export async function validateProduct(product: any, index: number, errors, isNonJs = false,) {
  const isProductNotDefined = !product.product || validateWhitespace(product.product);
  if (isProductNotDefined) {
    errors[`catches-${index}-product`] = 'sdAddProductToConsignmentProductNameErrorNull'
  }

  if (isNonJs && !isProductNotDefined) {
    errors = await validateNonJsSpeciesName(product, errors);
  } else if (!await isSpeciesNameValid(product.product, product.scientificName)) {
    errors[`catches-${index}-product`] = 'sdAddProductToConsignmentSpeciesNameErrorInValid';

    product.product = undefined;
    product.scientificName = undefined;
  }

  if (!product.commodityCode || validateWhitespace(product.commodityCode) ){
    errors[`catches-${index}-commodityCode`] = 'sdAddProductToConsignmentCommodityCodeErrorNull';
  }

  const error: BusinessError = await validateCommodityCode(product.commodityCode, ApplicationConfig.getReferenceServiceUrl());
  if (error.isError) {
    errors[`catches-${index}-commodityCode`] = 'sdAddProductToConsignmentCommodityCodeErrorNull';
  }

  if (!product.productWeight) {
    errors[`catches-${index}-productWeight`] = 'sdAddProductToConsignmentExportWeightErrorNull';
  } else if ((+product.productWeight) <= 0) {
    errors[`catches-${index}-productWeight`] = 'sdAddProductToConsignmentExportWeightErrorMax2DecimalLargerThan0';
  } else if (!isPositiveNumberWithTwoDecimals(product.productWeight)) {
    errors[`catches-${index}-productWeight`] = 'sdAddProductToConsignmentExportWeightPositiveMax2Decimal';
  }

  return { errors };
}

export async function validateEntry(product: any, index: number, errors, documentNumber: string="", userPrincipal: string="", contactId: string="") {
  checkDateOfUnloadingErrors(product, errors, index);

  checkPlaceOfUnloadingErrors(product, errors, index);

  checkTransportUnloadedFromErrors(product, errors, index);

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
  } else if (product.certificateType === 'uk' && !await validateSpecies(product.certificateNumber, product.product, null, userPrincipal, contactId, documentNumber)) {
    errors[`catches-${index}-certificateNumber`] = 'sdAddUKEntryDocumentSpeciesDoesNotExistError';
  }

  checkWeightOnCCErrors(product, errors, index);
  return { errors };
}

function checkDateOfUnloadingErrors(product: any, errors: any, index: number) {
  if (!product.dateOfUnloading || product.dateOfUnloading === "") {
    errors[`catches-${index}-dateOfUnloading`] = `sdAddProductToConsignmentDateOfUnloadingErrorNull`;
  } else if (!validateDate(product.dateOfUnloading)) {
    errors[`catches-${index}-dateOfUnloading`] = `sdAddProductToConsignmentDateOfUnloadingErrorDateFormat`;
  } else if (!validateTodayOrInThePast(product.dateOfUnloading)) {
    errors[`catches-${index}-dateOfUnloading`] = `sdAddProductToConsignmentDateOfUnloadingErrorValidDate`;
    product.dateOfUnloading = cleanDate(product.dateOfUnloading);
  }
  else {
    product.dateOfUnloading = cleanDate(product.dateOfUnloading);
  }
}

function checkPlaceOfUnloadingErrors(product: any, errors: any, index: number) {
  if (!product.placeOfUnloading || validateWhitespace(product.placeOfUnloading)) {
    errors[`catches-${index}-placeOfUnloading`] = 'sdAddProductToConsignmentPlaceOfUnloadingErrorNull';
  } else if (!isPlaceProductEntersUkValid(product.placeOfUnloading)) {
    errors[`catches-${index}-placeOfUnloading`] = 'sdAddProductToConsignmentPlaceOfUnloadingErrorInvalid';
  } else if (product.placeOfUnloading.length > MAX_PORT_NAME_LENGTH) {
    errors[`catches-${index}-placeOfUnloading`] = 'sdAddProductToConsignmentPortErrorMustNotExceed';
  }
}

function checkTransportUnloadedFromErrors(product: any, errors: any, index: number) {
  if (!product.transportUnloadedFrom || validateWhitespace(product.transportUnloadedFrom)) {
    errors[`catches-${index}-transportUnloadedFrom`] = 'sdAddProductToConsignmentTransportDetailsErrorNull';
  } else if (product.transportUnloadedFrom.length > MAX_TRANSPORT_UNLOADED_FROM_LENGTH) {
    errors[`catches-${index}-transportUnloadedFrom`] = `sdAddProductToConsignmentTransportDetailsErrorMustNotExceed-${MAX_TRANSPORT_UNLOADED_FROM_LENGTH}`;
  } else if (!isTransportUnloadedFromFormatValid(product.transportUnloadedFrom)) {
    errors[`catches-${index}-transportUnloadedFrom`] = 'sdAddProductToConsignmentTransportDetailsErrorInValidFormat';
  }
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