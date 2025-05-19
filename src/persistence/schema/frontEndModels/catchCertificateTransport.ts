import * as BackEndModels from "../../schema/catchCert";

export const truck = 'truck';
export const plane = 'plane';
export const train = 'train';
export const containerVessel = 'containerVessel';
export const fishingVessel = 'directLanding';

export interface CatchCertificateTransportDocument {
  name: string,
  reference: string
}
export interface CatchCertificateTransport {
  id: string;
  vehicle: string;
  nationalityOfVehicle?: string;
  registrationNumber?: string;
  departurePlace?: string;
  flightNumber?: string;
  containerNumber?: string;
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
    case fishingVessel:
      backEndTransport = getFishingVesselBackEndTransport(transport);
      break;
    default:
      return null;
  }

  Object.keys(backEndTransport).forEach(key => backEndTransport[key] === undefined ? delete backEndTransport[key] : {});
  return backEndTransport;
};

const getTruckBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: parseInt(transport.id),
  vehicle: transport.vehicle,
  nationalityOfVehicle: transport.nationalityOfVehicle,
  registrationNumber: transport.registrationNumber,
  departurePlace: transport.departurePlace,
  freightBillNumber: transport.freightBillNumber,
  transportDocuments: transport.documents,
});

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

const getFishingVesselBackEndTransport = (transport: CatchCertificateTransport) => ({
  id: parseInt(transport.id),
  vehicle: transport.vehicle,
  departurePlace: transport.departurePlace,
  transportDocuments: transport.documents,
});

export const toFrontEndTransport = (transport: BackEndModels.CatchCertificateTransport): CatchCertificateTransport => {
  let frontEndTransport: CatchCertificateTransport;

  switch (transport.vehicle) {
    case truck: {
      const model = transport as BackEndModels.CatchCertificateTruck;
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        nationalityOfVehicle: model.nationalityOfVehicle,
        registrationNumber: model.registrationNumber,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    case plane: {
      const model = transport as BackEndModels.CatchCertificatePlane;
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        flightNumber: model.flightNumber,
        containerNumber: model.containerNumber,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    case train: {
      const model = transport as BackEndModels.CatchCertificateTrain;
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        railwayBillNumber: model.railwayBillNumber,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    case containerVessel: {
      const model = transport as BackEndModels.CatchCertificateContainerVessel;
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: model.vehicle,
        vesselName: model.vesselName,
        flagState: model.flagState,
        containerNumber: model.containerNumber,
        departurePlace: model.departurePlace,
        freightBillNumber: model.freightBillNumber,
        documents: model.transportDocuments
      };
      break;
    }
    case fishingVessel: {
      frontEndTransport = {
        id: transport.id.toString(),
        vehicle: transport.vehicle
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