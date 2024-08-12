export const BLOB_STORAGE_CONTAINER_NAME = 'export-certificates';

export const SYSTEM_ERROR: string = 'SYSTEM_ERROR';
export const STATUS_VOID: string = 'VOID';
export const STATUS_COMPLETE: string = 'COMPLETE';
export const STATUS_DRAFT: string = 'DRAFT';
export const PROTECTIVE_MONITORING_PRIORITY_NORMAL: number = 0;
export const PROTECTIVE_MONITORING_PRIORITY_UNUSUAL: number = 5;

export const PROTECTIVE_MONITORING_COMPLETED_TRANSACTION: string = 'CREATE';
export const PROTECTIVE_MONITORING_DOWNLOADED_TRANSACTION: string = 'DOWNLOAD';
export const PROTECTIVE_MONITORING_VOID_TRANSACTION: string = 'VOID';

export const MIN_COMMODITY_CODE_LENGTH: number = 6;
export const MAX_COMMODITY_CODE_LENGTH: number = 12;
export const MIN_PERSON_RESPONSIBLE_LENGTH: number = 1;
export const MAX_PERSON_RESPONSIBLE_LENGTH: number = 50;
export const MAX_PLANT_NAME_LENGTH: number = 54;
export const MAX_DOCUMENT_NUMBER_LENGTH: number = 54;
export const MAX_TRANSPORT_UNLOADED_FROM_LENGTH: number = 60;
export const MAX_PORT_NAME_LENGTH: number = 50;

export const JOURNEY: {
  catchCertificate: string,
  processingStatement: string,
  storageNotes: string,
} = {
  catchCertificate: 'catch certificate',
  processingStatement: 'processing statement',
  storageNotes: 'storage document'
}

export const COUNTRY: string[] = [
  'ENGLAND',
  'SCOTLAND',
  'WALES',
  'NORTHERN IRELAND',
  'GUERNSEY',
  'JERSEY',
  'ISLE OF MAN',
]