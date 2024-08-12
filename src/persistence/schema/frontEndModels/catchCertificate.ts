import * as BackEndCertificate from "../catchCert";
import { Conservation } from "./conservation";
import { ExportLocation } from "./export-location";
import { ProductsLanded, toFrontEndProductsLanded, BaseProgress } from "./payload";
import { toFrontEndTransport, Transport } from "./transport";
import { CcExporter, toFrontEndCcExporterDetails } from "./exporterDetails";
import { toBackEndCcExportData } from "./exportData";
import { DocumentNumber } from "./documentNumber";
import { toFrontEndExportLocation, ProgressStatus } from "../common";
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
  transport: Transport
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

export const toBackEndCatchCert = (
  documentNumber: DocumentNumber,
  productsLanded: ProductsLanded,
  transport: Transport,
  exportLocation: ExportLocation,
  conservation: Conservation,
  exporterDetails: CcExporter,
  landingsEntryOption: LandingsEntryOptions,
  requestedByAdmin: boolean
): BackEndCertificate.CatchCertificate => {
  return {
    documentNumber: documentNumber.documentNumber,
    createdAt: documentNumber.startedAt,
    createdBy: "User Id  to be done ",
    createdByEmail: "User email  to be done ",
    exportData: toBackEndCcExportData(productsLanded, transport, exportLocation, conservation, exporterDetails, landingsEntryOption),
    status: documentNumber.status,
    draftData: {},
    documentUri: "",
    userReference: '',
    requestByAdmin: requestedByAdmin
  }
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
        transport: toFrontEndTransport(certificate.exportData.transportation),
        exportLocation: toFrontEndExportLocation(
          certificate.exportData.transportation
        ),
        landingsEntryOption: certificate.exportData.landingsEntryOption,
      }
    : null;