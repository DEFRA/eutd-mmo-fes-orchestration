import * as BackEndCertificate from "../catchCert";
import * as CatchCertificateTransport from "./catchCertificateTransport";
import { Conservation } from "./conservation";
import { ExportLocation } from "./export-location";
import { ProductsLanded, toFrontEndProductsLanded, BaseProgress } from "./payload";
import { CcExporter, toFrontEndCcExporterDetails } from "./exporterDetails";
import { ProgressStatus } from "../common";
import { toFrontEndConservation, LandingsEntryOptions } from "../catchCert";

export interface CatchCertificateDraft {
  documentNumber: string,
  status: string,
  userReference: string,
  startedAt: string,
  isFailed: boolean
}

export interface CatchCertificate {
  exporter: CcExporter,
  exportPayload: ProductsLanded,
  conservation: Conservation,
  transportations: CatchCertificateTransport.CatchCertificateTransport[],
  exportLocation: ExportLocation,
  landingsEntryOption: LandingsEntryOptions
}
export interface CatchCertificateProgress extends BaseProgress {
  dataUpload?: string;
  products: ProgressStatus;
  landings: ProgressStatus;
  conservation: ProgressStatus;
  exportJourney: ProgressStatus;
  transportType?: ProgressStatus;
  transportDetails?: ProgressStatus;
}

export const toFrontEndCatchCert = (
  certificate: BackEndCertificate.CatchCertificate
): CatchCertificate =>
  certificate.exportData
    ? {
        exporter: toFrontEndCcExporterDetails(
          certificate.exportData.exporterDetails
        ),
        exportPayload: toFrontEndProductsLanded(
          certificate.exportData.products
        ),
        conservation: toFrontEndConservation(
          certificate.exportData.conservation
        ),
        exportLocation: toFrontEndExportLocation(
          certificate.exportData
        ),
        landingsEntryOption: certificate.exportData.landingsEntryOption,
        transportations: certificate.exportData.transportations.map((t: BackEndCertificate.CatchCertificateTransport) => CatchCertificateTransport.toFrontEndTransport(t))
      }
    : null;

export const toFrontEndExportLocation = (exportData: BackEndCertificate.ExportData): ExportLocation => {
  if (exportData?.exportedFrom || exportData?.exportedTo) {
    return {
      exportedFrom: exportData.exportedFrom,
      exportedTo: exportData.exportedTo
    }
  }

  return {
    exportedFrom: exportData?.transportation ? exportData.transportation.exportedFrom : '',
    exportedTo: exportData?.transportation ? exportData.transportation.exportedTo : undefined
  }
};