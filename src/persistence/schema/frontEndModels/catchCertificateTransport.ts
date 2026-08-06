import { hasValue, valueOrDefault } from "../../../helpers/utils/utils";
import * as BackEndModels from "../../schema/catchCert";

export const truck = 'truck';
export const plane = 'plane';
export const train = 'train';
export const containerVessel = 'containerVessel';

export interface CatchCertificateTransportDocument {
  name: string,
  reference: string
}
export interface CatchCertificateTransport {
  id: string;
  vehicle: string;
  // retained for backward compat — reads cmr from pre-removal documents
  cmr?: string;
  nationalityOfVehicle?: string;
  registrationNumber?: string;
  departurePlace?: string;
  flightNumber?: string;
  containerNumber?: string;
  containerIdentificationNumber?: string;
  containerNumbers?: string[];
  railwayBillNumber?: string;
  vesselName?: string;
  flagState?: string;
  freightBillNumber?: string;
  documents?: CatchCertificateTransportDocument[];
  airwayBillNumber?: string;
}

export const toBackEndTransport = (transport: CatchCertificateTransport): BackEndModels.CatchCertificateTransport => {

  let backEndTransport: BackEndModels.CatchCertificateTransport;

  switch (transport.vehicle) {
    case truck:
      backEndTransport = getTruckBackEndTransport(transport);
      break;
    case plane:
      backEndTransport = getPlaneBackEndTransport(transport);
      break;
    case train:
      backEndTransport = getTrainBackEndTransport(transport);
      break;
    case containerVessel:
      backEndTransport = getContainerVesselBackEndTransport(transport);
      break;
    default:
      return null;
  }

  Object.keys(backEndTransport).forEach(key => backEndTransport[key] === undefined ? delete backEndTransport[key] : {});
  return backEndTransport;
};

const getTruckBackEndTransport = (transport: CatchCertificateTransport): BackEndModels.CatchCertificateTruck => ({
  id: Number.parseInt(transport.id),
  vehicle: transport.vehicle,
  nationalityOfVehicle: transport.nationalityOfVehicle,
  registrationNumber: transport.registrationNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  containerIdentificationNumber: transport.containerIdentificationNumber,
  transportDocuments: transport.documents,
});

const getPlaneBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: Number.parseInt(transport.id),
  vehicle: transport.vehicle,
  flightNumber: transport.flightNumber,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
  airwayBillNumber: transport.airwayBillNumber
});

const getTrainBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: Number.parseInt(transport.id),
  vehicle: transport.vehicle,
  railwayBillNumber: transport.railwayBillNumber,
  containerIdentificationNumber: transport.containerIdentificationNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
});

const getContainerVesselBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: Number.parseInt(transport.id),
  vehicle: transport.vehicle,
  vesselName: transport.vesselName,
  flagState: transport.flagState,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
  airwayBillNumber: transport.airwayBillNumber
});

export const toFrontEndTransport = (transport: BackEndModels.CatchCertificateTransport): CatchCertificateTransport => {
  let frontEndTransport: CatchCertificateTransport;

  switch (transport.vehicle) {
    case truck: {
      const model = transport as BackEndModels.CatchCertificateTruck;
      // Transform containerIdentificationNumber string to containerNumbers array
      const containerNumbers = model.containerIdentificationNumber?.split(' ').filter((c: string) => c?.trim());
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        cmr: valueOrDefault(model.cmr?.toString(), hasValue(model.cmr)),
        nationalityOfVehicle: model.nationalityOfVehicle,
        registrationNumber: model.registrationNumber,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        containerIdentificationNumber: model.containerIdentificationNumber,
        containerNumbers: containerNumbers,
        documents: model.transportDocuments
      };
      break;
    }
    case plane: {
      const model = transport as BackEndModels.CatchCertificatePlane;
      // Transform containerNumber string to containerNumbers array
      const containerNumbers = model.containerNumber?.split(' ').filter((c: string) => c?.trim());
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        flightNumber: model.flightNumber,
        containerNumber: model.containerNumber,
        containerNumbers: containerNumbers,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments,
        airwayBillNumber: model.airwayBillNumber
      };
      break;
    }
    case train: {
      const model = transport as BackEndModels.CatchCertificateTrain;
      // Transform containerIdentificationNumber string to containerNumbers array
      const containerNumbers = model.containerIdentificationNumber?.split(' ').filter((c: string) => c?.trim());
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        railwayBillNumber: model.railwayBillNumber,
        containerIdentificationNumber: model.containerIdentificationNumber,
        containerNumbers: containerNumbers,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    case containerVessel: {
      const model = transport as BackEndModels.CatchCertificateContainerVessel;
      // Transform containerNumber string to containerNumbers array
      const containerNumbers = model.containerNumber?.split(' ').filter((c: string) => c?.trim());
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        vesselName: model.vesselName,
        flagState: model.flagState,
        containerNumber: model.containerNumber,
        containerNumbers: containerNumbers,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    default:
      return null;
  }

  Object.keys(frontEndTransport).forEach((key) => {
    if (frontEndTransport[key] === undefined) {
      delete frontEndTransport[key]
    }
  });

  return frontEndTransport;

}
