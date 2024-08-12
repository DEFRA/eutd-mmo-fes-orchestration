import { ProcessingStatement } from '../schema/processingStatement';
import * as moment from 'moment';

export interface UserDetails {
  email: string,
  principal: string
}

export interface ProcessingStmtTransientData {
  catches: object[],
  exporter: object,
  documentNumber: string,
  status: string,
  user: UserDetails,
  consignmentDescription    : string,
  healthCertificateNumber   : string,
  healthCertificateDate: string,
  personResponsibleForConsignment: string,
  plantApprovalNumber: string,
  plantName: string,
  plantAddressOne: string,
  plantBuildingNumber?: string,
  plantSubBuildingName?: string,
  plantBuildingName?: string,
  plantStreetName?: string,
  plantCounty?: string,
  plantCountry?: string,
  plantTownCity: string,
  plantPostcode: string,
  dateOfAcceptance: string,
  documentUri: string
}


export const mapToPersistableSchema = (dataToPersist: ProcessingStmtTransientData): ProcessingStatement => {
  const procStmt = {
    createdAt: moment.utc().toISOString(),
    createdBy: dataToPersist.user.principal,
    createdByEmail: dataToPersist.user.email,
    documentNumber: dataToPersist.documentNumber,
    status: dataToPersist.status,
    documentUri: dataToPersist.documentUri,
    exportData: {
      catches                           : dataToPersist.catches,
      exporterDetails                   : dataToPersist.exporter,
      consignmentDescription            : dataToPersist.consignmentDescription,
      healthCertificateNumber           : dataToPersist.healthCertificateNumber,
      healthCertificateDate             : dataToPersist.healthCertificateDate,
      personResponsibleForConsignment   : dataToPersist.personResponsibleForConsignment,
      plantApprovalNumber               : dataToPersist.plantApprovalNumber,
      plantName                         : dataToPersist.plantName,
      plantAddressOne                   : dataToPersist.plantAddressOne,
      plantBuildingName                 : dataToPersist.plantBuildingName,
      plantBuildingNumber               : dataToPersist.plantBuildingNumber,
      plantSubBuildingName              : dataToPersist.plantSubBuildingName,
      plantStreetName                   : dataToPersist.plantStreetName,
      plantCounty                       : dataToPersist.plantCounty,
      plantCountry                      : dataToPersist.plantCountry,
      plantTownCity                     : dataToPersist.plantTownCity,
      plantPostcode                     : dataToPersist.plantPostcode,
      dateOfAcceptance                  : dataToPersist.dateOfAcceptance
    }
  } as ProcessingStatement;
  return procStmt;
}