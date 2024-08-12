import { IOnlineValidationReportItem } from './onlineValidationReport'

export interface IExportCertificateResults  {
  documentNumber: string;
  uri: string;
  report: IOnlineValidationReportItem[];
  isBlockingEnabled: boolean;
}
