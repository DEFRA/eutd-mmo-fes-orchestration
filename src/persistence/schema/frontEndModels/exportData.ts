import { ProductsLanded, toBackEndProductsLanded } from './payload';
import { Conservation, toBackEndConservationDetails } from './conservation'
import { Transport, toBackEndTransport } from './transport'
import { CcExporter, toBackEndCcExporterDetails } from './exporterDetails';
import { ExportData, LandingsEntryOptions } from "../catchCert";
import { ExportLocation } from "./export-location";

export const toBackEndCcExportData = (
  productsLanded: ProductsLanded,
  transportation: Transport,
  exportLocation: ExportLocation,
  conservation: Conservation,
  exporterDetails: CcExporter,
  landingsEntryOption: LandingsEntryOptions
): ExportData => {
  return {
    products: toBackEndProductsLanded(productsLanded),
    transportation: toBackEndTransport(transportation),
    conservation: toBackEndConservationDetails(conservation),
    exporterDetails: toBackEndCcExporterDetails(exporterDetails),
    landingsEntryOption: landingsEntryOption,
    exportedFrom: exportLocation.exportedFrom,
    exportedTo: exportLocation.exportedTo,
    pointOfDestination: exportLocation.pointOfDestination
  }
};