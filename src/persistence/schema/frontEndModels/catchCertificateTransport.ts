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

const getTruckBackEndTransport = (transport: CatchCertificateTransport): BackEndModels.CatchCertificateTruck => {
  const cmrIsSet = typeof transport.cmr === 'string';
  const hasCmr = transport.cmr === 'true';
  const result = {
    id: parseInt(transport.id),
    vehicle: transport.vehicle,
    cmr: cmrIsSet ? hasCmr : undefined,
    nationalityOfVehicle: cmrIsSet && hasCmr ? undefined : transport.nationalityOfVehicle,
    registrationNumber: cmrIsSet && hasCmr ? undefined : transport.registrationNumber,
    departurePlace: cmrIsSet && hasCmr ? undefined : transport.departurePlace,
    freightBillNumber: cmrIsSet && hasCmr ? undefined : transport.freightBillNumber,
    containerIdentificationNumber: cmrIsSet && hasCmr ? undefined : transport.containerIdentificationNumber,
    transportDocuments: cmrIsSet && hasCmr ? undefined : transport.documents,
  };
  return result;
};

const getPlaneBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: parseInt(transport.id),
  vehicle: transport.vehicle,
  flightNumber: transport.flightNumber,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
});

const getTrainBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: parseInt(transport.id),
  vehicle: transport.vehicle,
  railwayBillNumber: transport.railwayBillNumber,
  containerIdentificationNumber: transport.containerIdentificationNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
});

const getContainerVesselBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: parseInt(transport.id),
  vehicle: transport.vehicle,
  vesselName: transport.vesselName,
  flagState: transport.flagState,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
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
        nationalityOfVehicle: valueOrDefault(model.nationalityOfVehicle, !model.cmr),
        registrationNumber: valueOrDefault(model.registrationNumber, !model.cmr),
        departurePlace: valueOrDefault(model.departurePlace, !model.cmr),
        freightBillNumber: valueOrDefault(model.freightBillNumber, !model.cmr),
        containerIdentificationNumber: valueOrDefault(model.containerIdentificationNumber, !model.cmr),
        containerNumbers: valueOrDefault(containerNumbers, !model.cmr),
        documents: valueOrDefault(model.transportDocuments, !model.cmr)
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
        documents: model.transportDocuments
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
