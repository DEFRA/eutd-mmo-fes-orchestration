import * as BackEndModels from "../persistence/schema/catchCert"
import * as Transport from "../persistence/schema/frontEndModels/transport";
import { toBackEndTransport, CatchCertificateTransport, toFrontEndTransport } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import { getDraft, upsertDraftData } from "../persistence/services/catchCert";
import logger from "../logger";

export default class CatchCertificateTransportService {

  public static async getTransport(id: number, userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport> {
    const draft: BackEndModels.CatchCertificate = await getDraft(userPrincipal, documentNumber, contactId);
    const transportations: BackEndModels.CatchCertificateTransport[] = draft?.exportData?.transportations;

    if (transportations) {
      const transport = transportations.find((t: BackEndModels.CatchCertificateTransport) => t.id === id);
      return transport ? toFrontEndTransport(transport) : null;
    }

    return null;
  }

  public static async getTransportations(userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport[]> {
    const draft: BackEndModels.CatchCertificate = await getDraft(userPrincipal, documentNumber, contactId);
    const transportations: BackEndModels.CatchCertificateTransport[] = draft.exportData.transportations;

    if (Array.isArray(transportations)) {
      return transportations.map((transportation: BackEndModels.CatchCertificateTransport) => toFrontEndTransport(transportation));
    }

    return [];
  }

  public static async getTransportationDetails(userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport | Transport.Transport> {
    const draft: BackEndModels.CatchCertificate = await getDraft(userPrincipal, documentNumber, contactId);
    const transportations: BackEndModels.CatchCertificateTransport[] = draft.exportData.transportations;

    if (Array.isArray(transportations) && transportations.length > 0) {
      const _ = transportations.find((t: BackEndModels.CatchCertificateTransport) => t.departurePlace);
      return toFrontEndTransport(_);
    }

    return (draft && draft.exportData && draft.exportData.transportation)
      ? Transport.toFrontEndTransport(draft.exportData.transportation)
      : null;
  }

  public static async addTransport(payload: CatchCertificateTransport, userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport> {
    const transport: BackEndModels.CatchCertificateTransport = toBackEndTransport(payload);

    await upsertDraftData(userPrincipal, documentNumber, { '$push': { 'exportData.transportations': transport } }, contactId);

    return payload;
  }

  public static async updateTransport(payload: CatchCertificateTransport, userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport> {
    await this.editTransportDetails(payload, userPrincipal, documentNumber, contactId)

    return payload;
  }
  public static async updateTransportDocuments(payload: CatchCertificateTransport, userPrincipal: string, documentNumber: string, contactId: string): Promise<CatchCertificateTransport> {
    await this.editTransportDetails(payload, userPrincipal, documentNumber, contactId, true)

    return payload;
  }

  public static async editTransportDetails(payload: CatchCertificateTransport, userPrincipal: string, documentNumber: string, contactId: string, isDocument: boolean = false): Promise<CatchCertificateTransport> {
    const transport: BackEndModels.CatchCertificateTransport = toBackEndTransport(payload);
    const draft: BackEndModels.CatchCertificate = await getDraft(userPrincipal, documentNumber, contactId);
    const transportations: BackEndModels.CatchCertificateTransport[] = draft?.exportData?.transportations ?? [];

    const hasTransport: (modes: BackEndModels.CatchCertificateTransport[]) => boolean = (modes: BackEndModels.CatchCertificateTransport[]) =>
      modes.some((mode: BackEndModels.CatchCertificateTransport) => mode.id === transport?.id);

    const shouldUpdate = hasTransport(transportations);
    logger.info(`[UPDATE-TRANSPORT-DETAILS][${documentNumber}][HAS-TRANSPORTATION-DETAILS][${shouldUpdate}]`);

    if (shouldUpdate) {
      const index = transportations.findIndex((t: BackEndModels.CatchCertificateTransport) => t.id === transport.id);

      logger.info(`[UPDATE-TRANSPORT-DETAILS][${documentNumber}][TRANSPORTATION-DETAILS][${index}]`);


      if (isDocument) {
        transportations[index] = toBackEndTransport(payload);

        await upsertDraftData(userPrincipal, documentNumber, {
          '$set': {
            [`exportData.transportations.${index}.transportDocuments`]: transportations[index].transportDocuments
          }
        }, contactId);
      } else {
        transportations[index] = toBackEndTransport({ ...payload, documents: transportations[index].transportDocuments });
        await upsertDraftData(userPrincipal, documentNumber, { '$set': { 'exportData.transportations': transportations } }, contactId);
      }

    }

    return payload;
  }

}