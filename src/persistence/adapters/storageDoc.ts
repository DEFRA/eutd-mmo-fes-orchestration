import { StorageDocument } from '../schema/storageDoc';
import * as moment from 'moment';

export interface UserDetails {
  email: string,
  principal: string
}

export interface TransientData {
  catches                   : object[],
  storageFacilities         : object[],
  exporter                  : object,
  documentNumber            : string,
  status                    : string,
  user                      : UserDetails,
  transport                 : object,
  documentUri               : string,
  requestByAdmin            : boolean
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
      transportation            : dataToPersist.transport
    },
    requestByAdmin              : dataToPersist.requestByAdmin
  } as StorageDocument;
}