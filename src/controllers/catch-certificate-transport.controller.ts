import * as Hapi from "@hapi/hapi"
import Service from "../services/catch-certificate-transport.service";
import { CatchCertificateTransport } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import { getRandomNumber } from "../helpers/utils/utils";

export default class CatchCertificateTransportController {

  public static async addTransport(req: Hapi.Request, userPrincipal: string, documentNumber : string, contactId: string) {
    const transport: CatchCertificateTransport = {
      id: getRandomNumber().toString(),
      vehicle: (req.payload as any).vehicle
    }

    return Service.addTransport(transport, userPrincipal, documentNumber, contactId);
  }

  public static async getTransportations(req: Hapi.Request, userPrincipal: string, documentNumber : string, contactId: string) {
    return Service.getTransportations(userPrincipal, documentNumber, contactId);
  }

  public static async getTransport(req: Hapi.Request, userPrincipal: string, documentNumber : string, contactId: string) {
    const id: number = parseInt((req.params as any).transportId);

    return Service.getTransport(id, userPrincipal, documentNumber, contactId);
  }

  public static async updateTransport(req: Hapi.Request, userPrincipal: string, documentNumber : string, contactId: string) {
    const payload = (req.payload as CatchCertificateTransport)
    const transport: CatchCertificateTransport = {
      id: payload.id,
      vehicle: payload.vehicle,
      ...payload
    };

    return Service.updateTransport(transport, userPrincipal, documentNumber, contactId);
  }

  public static async updateTransportDocuments(req: Hapi.Request, userPrincipal: string, documentNumber : string, contactId: string) {
    const payload = (req.payload as CatchCertificateTransport)
    const transport: CatchCertificateTransport = {
      id: payload.id,
      vehicle: payload.vehicle,
      documents: payload.documents,
    };

    return Service.updateTransportDocuments(transport, userPrincipal, documentNumber, contactId);
  }

}