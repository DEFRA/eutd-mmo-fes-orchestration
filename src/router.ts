import * as Hapi from "@hapi/hapi";

import GeneralRoutes from "./routes/general";
import FishRoutes from "./routes/fish";
import CommodityRoutes from "./routes/commodity";
import PresentationStateRoutes from "./routes/presentationState";
import TransportRoutes from "./routes/transport";
import ExportPayloadRoutes from "./routes/export-payload";
import ExportPayloadNonjsRoutes from "./routes/export-payload-nonjs";
import ExporterRoutes from "./routes/exporter";
import ExporterValidateRoutes from "./routes/exporter-validate";
import OrchestrationRoutes from "./routes/orchestration";
import HealthRoutes from "./routes/health";
import ConservationRoutes from "./routes/conservation";
import ExportLocationRoutes from "./routes/exportLocation";
import DocumentRoutes from "./routes/document";
import UserAttributesRoutes from "./routes/userAttributes";
import ConfirmDocumentDeleteRoutes from "./routes/confirm-document-delete";
import ConfirmDocumentCopyRoutes from "./routes/confirm-document-copy";
import ConfirmDocumentVoidRoutes from "./routes/void-certificate";
import ProtectiveMonitoringRoutes from "./routes/protective-monitoring";
import UserReferenceRoutes from "./routes/userReference";
import NotificationRoutes from "./routes/notification";
import SummaryErrorsRoutes from './routes/summaryErrors';
import CertificateRoutes from './routes/certificate';
import FavouritesRoutes from "./routes/favourites";
import UploadsRoutes from "./routes/uploads";
import ProgressRoutes from "./routes/progress";
import DocumentPdfRoutes from "./routes/document-pdf";

export default class Router {
  public static async loadRoutes(server: Hapi.Server): Promise<void> {
    [
      new GeneralRoutes(),
      new FavouritesRoutes(),
      new FishRoutes(),
      new UploadsRoutes(),
      new CommodityRoutes(),
      new PresentationStateRoutes(),
      new TransportRoutes(),
      new ExportPayloadRoutes(),
      new ExportPayloadNonjsRoutes(),
      new ExporterRoutes(),
      new ExporterValidateRoutes(),
      new ConservationRoutes(),
      new HealthRoutes(),
      new DocumentRoutes(),
      new UserAttributesRoutes(),
      new ConfirmDocumentDeleteRoutes(),
      new ConfirmDocumentCopyRoutes(),
      new ConfirmDocumentVoidRoutes(),
      new ProtectiveMonitoringRoutes(),
      new ExportLocationRoutes(),
      new UserReferenceRoutes(),
      new NotificationRoutes(),
      new SummaryErrorsRoutes(),
      new ProgressRoutes(),
      new CertificateRoutes(),
      new DocumentPdfRoutes(),
      new OrchestrationRoutes() // this should be at the very bottom as it contains wildcard route
    ].forEach(async (route) => {
      await route.register(server);
    });
  }
}
