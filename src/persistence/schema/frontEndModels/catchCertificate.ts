import * as BackEndCertificate from "../catchCert";
import * as CatchCertificateTransport from "./catchCertificateTransport";
import { Conservation } from "./conservation";
import { ExportLocation } from "./export-location";
import { ProductsLanded, toFrontEndProductsLanded, BaseProgress } from "./payload";
import { toFrontEndTransport, Transport } from "./transport";
import { CcExporter, toFrontEndCcExporterDetails } from "./exporterDetails";
import { ProgressStatus } from "../common";
import { toFrontEndConservation, LandingsEntryOptions } from "../catchCert";

export interface CatchCertificateDraft {
  documentNumber: string,
  status: string,
  userReference: string,
  startedAt: string,
  isFailed: boolean,
  landingsEntryOption?: string | null,
  transportSummary?: string | null
}

export interface CatchCertificate {
  exporter: CcExporter,
  exportPayload: ProductsLanded,
  conservation: Conservation,
  transport?: Transport,
  transportations?: CatchCertificateTransport.CatchCertificateTransport[],
  exportLocation: ExportLocation,
  landingsEntryOption: LandingsEntryOptions,
  transportSummary?: string | null
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

const getTransportSummary = (exportData: BackEndCertificate.ExportData): string | null => {
  const transport = exportData?.transportation;
  const summary = [
    transport?.vehicle,
    transport?.exportedFrom,
    transport?.exportedTo?.officialCountryName || transport?.exportedTo,
    transport?.pointOfDestination,
  ].filter(Boolean).join(' • ');

  return summary || null;
};

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
        transportSummary: getTransportSummary(certificate.exportData),
        transport: toFrontEndTransport(certificate.exportData.transportation),
        transportations: Array.isArray(certificate.exportData.transportations) ? certificate.exportData.transportations.map((t: BackEndCertificate.CatchCertificateTransport) => CatchCertificateTransport.toFrontEndTransport(t)) : []
      }
    : null;

export const toFrontEndExportLocation = (exportData: BackEndCertificate.ExportData): ExportLocation => {
  if (exportData?.exportedFrom || exportData?.exportedTo) {
    return {
      exportedFrom: exportData.exportedFrom,
      exportedTo: exportData.exportedTo,
      pointOfDestination: exportData.pointOfDestination
    }
  }

  return {
    exportedFrom: exportData?.transportation ? exportData.transportation.exportedFrom : '',
    exportedTo: exportData?.transportation ? exportData.transportation.exportedTo : undefined,
    pointOfDestination: exportData?.pointOfDestination
  }
};