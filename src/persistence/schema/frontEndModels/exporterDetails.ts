import { isEmpty } from "lodash";
import * as BackEndModels from "../../schema/catchCert"
import { ExporterDetails }from "../common"

export interface ExporterDetailModel {
  contactId?: string;
  accountId?: string;
  exporterCompanyName: string;
  addressOne: string;
  addressTwo?: string;
  buildingNumber?: string;
  subBuildingName?: string;
  buildingName?: string;
  streetName?: string;
  county?: string;
  country?: string;
  townCity?: string;
  postcode: string;
  user_id: string;
  journey: string;
  currentUri: string;
  nextUri: string;
  _dynamicsAddress : any;
  _dynamicsUser: any;
  _updated?: boolean;
}

export interface Exporter {
  model : ExporterDetailModel;
}

export interface CcExportedDetailModel extends ExporterDetailModel{
  exporterFullName: string;
}

export interface CcExporter  {
  model : CcExportedDetailModel;
}

export const toBackEndCcExporterDetails = (exporterDetails : CcExporter) : BackEndModels.CcExporterDetails => {
  const result = {
    contactId : exporterDetails.model.contactId,
    accountId : exporterDetails.model.accountId,
    exporterFullName : exporterDetails.model.exporterFullName,
    exporterCompanyName: exporterDetails.model.exporterCompanyName,
    addressOne: exporterDetails.model.addressOne,
    buildingNumber: exporterDetails.model.buildingNumber,
    subBuildingName: exporterDetails.model.subBuildingName,
    buildingName: exporterDetails.model.buildingName,
    streetName: exporterDetails.model.streetName,
    county: exporterDetails.model.county,
    country: exporterDetails.model.country,
    townCity: exporterDetails.model.townCity,
    postcode: exporterDetails.model.postcode,
    _dynamicsAddress : exporterDetails.model._dynamicsAddress,
    _dynamicsUser : exporterDetails.model._dynamicsUser,
  }

  Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});

  return result;
};

export const toBackEndPsAndSdExporterDetails = (exporterDetails : Exporter) : ExporterDetails => {
  if (isEmpty(exporterDetails)) {
    return undefined;
  }

  const result = {
    contactId : exporterDetails.model.contactId,
    accountId : exporterDetails.model.accountId,
    exporterCompanyName: exporterDetails.model.exporterCompanyName,
    addressOne: exporterDetails.model.addressOne,
    buildingNumber: exporterDetails.model.buildingNumber,
    subBuildingName: exporterDetails.model.subBuildingName,
    buildingName: exporterDetails.model.buildingName,
    streetName: exporterDetails.model.streetName,
    county: exporterDetails.model.county,
    country: exporterDetails.model.country,
    townCity: exporterDetails.model.townCity,
    postcode: exporterDetails.model.postcode,
    _dynamicsAddress : exporterDetails.model._dynamicsAddress,
    _dynamicsUser : exporterDetails.model._dynamicsUser,
  }

  Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});

  return result;
};

export const toFrontEndCcExporterDetails = (exporterDetails: BackEndModels.CcExporterDetails) : CcExporter  => {
  return {
    model: {
      ...toBackEndNewCcExporterDetails(exporterDetails),
      user_id: '',
      journey: '',
      currentUri: '',
      nextUri: ''
    }
  }
};


export const toFrontEndPsAndSdExporterDetails = (exporterDetails: ExporterDetails, doNotTransform? : boolean): Exporter => {
   const newExporterDetails = doNotTransform ? exporterDetails :  toBackEndNewPsAndSdExporterDetails(exporterDetails) ;
  return {
    model: {
      ...newExporterDetails,
      user_id: '',
      journey: '',
      currentUri: '',
      nextUri: '',
    }
  }
};

export const toBackEndNewCcExporterDetails = (
  exporterDetails: BackEndModels.CcExporterDetails
): BackEndModels.CcExporterDetails =>
  exporterDetails
    ? {
        ...toBackEndNewPsAndSdExporterDetails(
          exporterDetails as ExporterDetails
        ),
        exporterFullName: exporterDetails.exporterFullName,
      }
    : null;

const isOldExporterDetails = (exporterDetails: ExporterDetails) =>
  !isEmpty(exporterDetails) && !isEmpty(exporterDetails.addressOne) &&
  ['buildingNumber', 'subBuildingName', 'buildingName', 'streetName', 'county', 'country'].every((key: string) =>
    !Object.prototype.hasOwnProperty.call(exporterDetails, key));

const addressOne = (dynamicsAddress: any): string | undefined => {
  const addressLineOne: string[] = [];

  if (dynamicsAddress && dynamicsAddress.defra_premises) {
    addressLineOne.push(dynamicsAddress.defra_premises);
  }

  if (dynamicsAddress && dynamicsAddress.defra_subbuildingname) {
    addressLineOne.push(dynamicsAddress.defra_subbuildingname);
  }

  if (dynamicsAddress && dynamicsAddress.defra_buildingname) {
    addressLineOne.push(dynamicsAddress.defra_buildingname);
  }

  if (dynamicsAddress && dynamicsAddress.defra_street) {
    addressLineOne.push(dynamicsAddress.defra_street);
  }

  if (dynamicsAddress && dynamicsAddress.defra_locality) {
    addressLineOne.push(dynamicsAddress.defra_locality);
  }

  if (dynamicsAddress && dynamicsAddress.defra_dependentlocality) {
    addressLineOne.push(dynamicsAddress.defra_dependentlocality);
  }

  return (addressLineOne.length > 0)
    ? addressLineOne
      .filter((_: string) => _ !== 'null')
      .join(', ')
    : '';
}

export const toBackEndNewPsAndSdExporterDetails = (exporterDetails: ExporterDetails) : ExporterDetails  => {

  return isOldExporterDetails(exporterDetails) ? {
    ...exporterDetails,
    addressOne: addressOne(exporterDetails._dynamicsAddress),
    addressTwo: undefined,
    buildingNumber: getBuildingNumber(exporterDetails),
    subBuildingName: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_subbuildingname : null,
    buildingName: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_buildingname : null,
    streetName: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_street : null,
    townCity: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_towntext : null,
    county: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_county : null,
    postcode: exporterDetails._dynamicsAddress ? exporterDetails._dynamicsAddress.defra_postcode : null,
    country: getConutry(exporterDetails),
    _updated: true
  } : {
    ...exporterDetails
  }
}

const getBuildingNumber = (exporterDetails: ExporterDetails) => exporterDetails._dynamicsAddress && exporterDetails._dynamicsAddress.defra_premises !== 'null'
? exporterDetails._dynamicsAddress.defra_premises : null

const getConutry = (exporterDetails: ExporterDetails) => exporterDetails._dynamicsAddress
? exporterDetails._dynamicsAddress._defra_country_value_OData_Community_Display_V1_FormattedValue
: null
