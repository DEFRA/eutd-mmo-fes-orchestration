import * as Hapi from "@hapi/hapi"
import Service from "../services/catch-certificate-transport.service";
import { CatchCertificateTransport, CatchCertificateTransportDocument } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import { getRandomNumber } from "../helpers/utils/utils";
import { AddTransportation } from "../persistence/schema/catchCert";

export default class CatchCertificateTransportController {

  public static async addTransport(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const transport: CatchCertificateTransport = {
      id: getRandomNumber().toString(),
      vehicle: (req.payload as any).vehicle
    };

    return Service.addTransport(transport, userPrincipal, documentNumber, contactId);
  }

  public static async getTransportations(userPrincipal: string, documentNumber: string, contactId: string) {
    return Service.getTransportations(userPrincipal, documentNumber, contactId);
  }

  public static async getTransport(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const id: number = parseInt((req.params as any).transportId);

    return Service.getTransport(id, userPrincipal, documentNumber, contactId);
  }

  public static async updateTransport(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = (req.payload as any)
    
    // Transform containerNumbers array to containerIdentificationNumber string for trucks
    let containerIdentificationNumber = payload.containerIdentificationNumber;
    if (payload.vehicle === 'truck' && payload.containerNumbers && Array.isArray(payload.containerNumbers)) {
      containerIdentificationNumber = payload.containerNumbers.filter((c: string) => c?.trim()).join(' ');
    }
    
    const transport: CatchCertificateTransport = {
      id: payload.id,
      vehicle: payload.vehicle,
      ...payload,
      containerIdentificationNumber
    };

    return Service.updateTransport(transport, userPrincipal, documentNumber, contactId);
  }

  public static async saveTransportDocuments(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = (req.payload as CatchCertificateTransport)
    const transport: CatchCertificateTransport = {
      id: payload.id,
      vehicle: payload.vehicle,
      documents: payload.documents.filter((transportDocument: CatchCertificateTransportDocument) => transportDocument.name?.trim() && transportDocument.reference?.trim()),
    };

    return Service.updateTransportDocuments(transport, userPrincipal, documentNumber, contactId);
  }

  public static async updateTransportDocuments(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = (req.payload as CatchCertificateTransport)
    const transport: CatchCertificateTransport = {
      id: payload.id,
      vehicle: payload.vehicle,
      documents: payload.documents,
    };

    return Service.updateTransportDocuments(transport, userPrincipal, documentNumber, contactId);
  }

  public static async removeTransportationById(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const id: number = parseInt((req.params as any).transportId);
    await Service.removeTransportation(id, userPrincipal, documentNumber, contactId);
  }

  public static async removeTransportations(userPrincipal: string, documentNumber: string, contactId: string) {
    await Service.removeTransportations(userPrincipal, documentNumber, contactId);
  }

  public static async addTransportationCheck(req: Hapi.Request, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = (req.payload as { addTransportation: AddTransportation })
    await Service.addTransportCheck(payload.addTransportation, userPrincipal, documentNumber, contactId);
    return payload;
  }

  public static async getTransportationCheck(userPrincipal: string, documentNumber: string, contactId: string) {
    return await Service.getTransportCheck(userPrincipal, documentNumber, contactId);
  }
}