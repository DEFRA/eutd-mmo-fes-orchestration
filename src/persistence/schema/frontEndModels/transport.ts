import * as BackEndModels from "../../schema/common"
import { ExportLocation } from "./export-location";
import { toExportedTo, ICountry } from '../common';

export const truck  = 'truck';
export const plane = 'plane';
export const train = 'train';
export const containerVessel = 'containerVessel';
export const fishingVessel = 'directLanding';

export interface Transport {
  vehicle : string;
  cmr ? : string;
  nationalityOfVehicle ? : string;
  registrationNumber  ? : string;
  departurePlace ? : string;
  flightNumber ? : string;
  containerNumber ? : string;
  railwayBillNumber ? : string;
  vesselName ? : string;
  flagState ? : string;
  user_id? : string;
  journey? : string;
  currentUri? : string;
  nextUri? : string;
  exportDate?: string;
  exportedTo?: ICountry;
}

export const toBackEndTransport = (transport: Transport, exportLocation?: ExportLocation) : BackEndModels.Transport => {

  let backEndTransport : BackEndModels.Transport;

  switch (transport.vehicle) {
    case truck: {
      const hasCmr = (transport.cmr !== null && transport.cmr !== undefined);
      const cmr = (transport.cmr === 'true');
      backEndTransport = getTruckBackEndTransport(transport, exportLocation, hasCmr, cmr);
      break;
    }
    case  plane :
      backEndTransport = getPlaneBackEndTransport(transport, exportLocation);
      break;
    case train :
      backEndTransport = getTrainBackEndTransport(transport, exportLocation);
      break;
    case containerVessel :
      backEndTransport = getContainerVesselBackEndTransport(transport, exportLocation);
      break;
    case fishingVessel :
      backEndTransport = getFishingVesselBackEndTransport(transport, exportLocation);
      break;
    default :
      return null;
  }

  Object.keys(backEndTransport).forEach(key => backEndTransport[key] === undefined ? delete backEndTransport[key] : {});
  return backEndTransport;
};

const getTruckBackEndTransport = (transport: Transport, exportLocation: ExportLocation, hasCmr: boolean, cmr: boolean) => ({
  vehicle: transport.vehicle,
  exportedFrom: exportLocation ? exportLocation.exportedFrom : undefined,
  exportedTo: exportLocation ? exportLocation.exportedTo : undefined,
  cmr: hasCmr ? cmr : undefined,
  nationalityOfVehicle: cmr ? undefined : transport.nationalityOfVehicle,
  registrationNumber: cmr ? undefined : transport.registrationNumber,
  departurePlace: cmr ? undefined : transport.departurePlace,
  exportDate: transport.exportDate
});

const getPlaneBackEndTransport = (transport: Transport, exportLocation: ExportLocation) => ({
  vehicle: transport.vehicle,
  exportedFrom: exportLocation ? exportLocation.exportedFrom : undefined,
  exportedTo: exportLocation ? exportLocation.exportedTo : undefined,
  flightNumber: transport.flightNumber,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  exportDate: transport.exportDate
});

const getTrainBackEndTransport = (transport: Transport, exportLocation: ExportLocation) => ({
  vehicle: transport.vehicle,
  exportedFrom: exportLocation ? exportLocation.exportedFrom : undefined,
  exportedTo: exportLocation ? exportLocation.exportedTo : undefined,
  railwayBillNumber: transport.railwayBillNumber,
  departurePlace: transport.departurePlace,
  exportDate: transport.exportDate
});

const getContainerVesselBackEndTransport = (transport: Transport, exportLocation: ExportLocation) => ({
  vehicle: transport.vehicle,
  exportedFrom: (exportLocation) ? exportLocation.exportedFrom : undefined,
  exportedTo: (exportLocation) ? exportLocation.exportedTo : undefined,
  vesselName: transport.vesselName,
  flagState: transport.flagState,
  containerNumber: transport.containerNumber,
  departurePlace: transport.departurePlace,
  exportDate: transport.exportDate
});

const getFishingVesselBackEndTransport = (transport: Transport, exportLocation: ExportLocation) => ({
  vehicle: transport.vehicle,
  exportedFrom: exportLocation ? exportLocation.exportedFrom : undefined,
  exportedTo: exportLocation ? exportLocation.exportedTo : undefined,
  departurePlace: transport.departurePlace,
  exportDate: transport.exportDate
});

export const toFrontEndTransport = (
  transport: BackEndModels.Transport
): Transport => {
  let frontEndTransport: Transport;

  if (transport) {
    switch (transport.vehicle) {
      case truck: {
        const model = transport as BackEndModels.Truck;
        const hasCmr = model.cmr !== null && model.cmr !== undefined;
        frontEndTransport = {
          vehicle: model.vehicle,
          cmr: hasCmr ? (model.cmr === true).toString() : undefined,
          nationalityOfVehicle: model.nationalityOfVehicle,
          registrationNumber: model.registrationNumber,
          departurePlace: model.departurePlace,
          exportDate: transport.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
        };

        break;
      }
      case plane: {
        const model = transport as BackEndModels.Plane;
        frontEndTransport = {
          vehicle: model.vehicle,
          flightNumber: model.flightNumber,
          containerNumber: model.containerNumber,
          departurePlace: model.departurePlace,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
        };
        break;
      }
      case train: {
        const model = transport as BackEndModels.Train;
        frontEndTransport = {
          vehicle: model.vehicle,
          railwayBillNumber: model.railwayBillNumber,
          departurePlace: model.departurePlace,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
        };
        break;
      }
      case containerVessel: {
        const model = transport as BackEndModels.ContainerVessel;
        frontEndTransport = {
          vehicle: model.vehicle,
          vesselName: model.vesselName,
          flagState: model.flagState,
          containerNumber: model.containerNumber,
          departurePlace: model.departurePlace,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
        };
        break;
      }
      case fishingVessel: {
        frontEndTransport = {
          vehicle: transport.vehicle,
          exportDate: transport.exportDate,
          exportedTo: toExportedTo(transport.exportedTo),
        };
        break;
      }
      default:
        return null;
    }

    Object.keys(frontEndTransport).forEach((key) =>
      frontEndTransport[key] === undefined ? delete frontEndTransport[key] : {}
    );
    return frontEndTransport;
  } else {
    const frontEndTransport = {
      vehicle: '',
      exportedTo: {
        officialCountryName: '',
        isoCodeAlpha2: '',
        isoCodeAlpha3: '',
        isoNumericCode: '',
      },
    }
    return frontEndTransport;
  }
};

export const checkTransportDataFrontEnd = (transport: Transport): Transport => {

  let data: Transport;

  if (transport) {
    switch (transport.vehicle) {
      case truck: {
        data = checkTruckDataFrontEnd(transport);
        break;
      }
      case plane: {
        data = checkPlaneDataFrontEnd(transport);
        break
      }
      case train: {
        data = checkTrainDataFrontEnd(transport);
        break
      }
      case containerVessel: {
        data = checkContainerVesselDataFrontEnd(transport);
        break
      }
      case fishingVessel: {
        data = checkFishingvesselDataFrontEnd(transport);
        break
      }
      default:
        return null;
    }
  } else {
    data = {
      vehicle: '',
      exportedTo: {
        officialCountryName: '',
        isoCodeAlpha2: '',
        isoCodeAlpha3: '',
        isoNumericCode: '',
      },
    }
  }

  return data;
};

const checkTruckDataFrontEnd = (transport: Transport) => {
  let data;
  if (transport.cmr) {
    if (transport.cmr === "false") {
      data = (
        transport.nationalityOfVehicle
        && transport.registrationNumber
        && transport.departurePlace
      ) ? transport : {
        vehicle: transport.vehicle,
        cmr: transport.cmr,
        exportedTo: transport.exportedTo
      }
    } else {
      data = {
        vehicle: transport.vehicle,
        cmr: transport.cmr,
        exportedTo: transport.exportedTo
      }
    }
  } else {
    data = {
      vehicle: transport.vehicle,
      exportedTo: transport.exportedTo
    }
  }
  return data;
}

const checkPlaneDataFrontEnd = (transport: Transport) => (
  transport.flightNumber
  && transport.containerNumber
  && transport.departurePlace
) ? transport : {
  vehicle: transport.vehicle,
  exportedTo: transport.exportedTo
}

const checkTrainDataFrontEnd = (transport: Transport) => (
  transport.railwayBillNumber
  && transport.departurePlace
) ? transport : {
  vehicle: transport.vehicle,
  exportedTo: transport.exportedTo
}

const checkContainerVesselDataFrontEnd = (transport: Transport) => (
  transport.vesselName
  && transport.flagState
  && transport.containerNumber
  && transport.departurePlace
) ? transport : {
  vehicle: transport.vehicle,
  exportedTo: transport.exportedTo
}

const checkFishingvesselDataFrontEnd = (transport: Transport) => (
  transport.exportDate
) ? transport : {
  vehicle: transport.vehicle,
  exportedTo: transport.exportedTo
};
