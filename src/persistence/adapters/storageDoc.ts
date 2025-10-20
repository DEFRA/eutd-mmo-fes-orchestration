import { StorageDocument } from '../schema/storageDoc';
import * as moment from 'moment';

export interface UserDetails {
  email: string,
  principal: string
}

export interface TransientData {
  catches                   : object[],
  storageFacilities?        : object[],
  exporter                  : object,
  documentNumber            : string,
  status                    : string,
  user                      : UserDetails,
  transport                 : object,
  documentUri               : string,
  requestByAdmin            : boolean,
  facilityName?             : string,
  facilityAddressOne?       : string,
  facilityTownCity?         : string,
  facilityPostcode?         : string,
  facilitySubBuildingName?  : string,
  facilityBuildingNumber?   : string,
  facilityBuildingName?     : string,
  facilityStreetName?       : string,
  facilityCounty?           : string,
  facilityCountry?          : string,
  facilityApprovalNumber?   : string,
  facilityStorage?          : string,
  _facilityUpdated?         : boolean,
  facilityArrivalDate?      : string,
}


export const mapToPersistableSchema = (dataToPersist: TransientData): StorageDocument => {
  return {
    createdAt: moment.utc().toISOString(),
    createdBy: dataToPersist.user.principal,
    createdByEmail: dataToPersist.user.email,
    documentNumber: dataToPersist.documentNumber,
    documentUri: dataToPersist.documentUri,
    status: dataToPersist.status,
    exportData: {
      catches                   : dataToPersist.catches,
      storageFacilities         : dataToPersist.storageFacilities,
      exporter                  : dataToPersist.exporter,
      documentNumber            : dataToPersist.documentNumber,
      user                      : dataToPersist.user,
      exporterDetails           : dataToPersist.exporter,
      transportation            : dataToPersist.transport,
      facilityName              : dataToPersist.facilityName,
      facilityAddressOne        : dataToPersist.facilityAddressOne,
      facilityTownCity          : dataToPersist.facilityTownCity,
      facilityPostcode          : dataToPersist.facilityPostcode,
      facilitySubBuildingName   : dataToPersist.facilitySubBuildingName,
      facilityBuildingNumber    : dataToPersist.facilityBuildingNumber,
      facilityBuildingName      : dataToPersist.facilityBuildingName,
      facilityStreetName        : dataToPersist.facilityStreetName,
      facilityCounty            : dataToPersist.facilityCounty,
      facilityCountry           : dataToPersist.facilityCountry,
      facilityApprovalNumber    : dataToPersist.facilityApprovalNumber,
      facilityStorage           : dataToPersist.facilityStorage,
      facilityArrivalDate       : dataToPersist.facilityArrivalDate
    },
    requestByAdmin              : dataToPersist.requestByAdmin
  } as StorageDocument;
}