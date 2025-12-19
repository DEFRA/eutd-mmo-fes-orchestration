import * as BackEndModels from "../../schema/common"
import { toExportedTo, ICountry } from '../common';

export const truck = 'truck';
export const plane = 'plane';
export const train = 'train';
export const containerVessel = 'containerVessel';
export const fishingVessel = 'directLanding';

export interface Transport {
  vehicle: string;
  cmr?: string;
  nationalityOfVehicle?: string;
  registrationNumber?: string;
  containerIdentificationNumber?: string;
  departurePlace?: string;
  pointOfDestination?: string;
  flightNumber?: string;
  containerNumber?: string;
  containerNumbers?: string[];
  railwayBillNumber?: string;
  airwayBillNumber?: string;
  vesselName?: string;
  flagState?: string;
  user_id?: string;
  journey?: string;
  currentUri?: string;
  nextUri?: string;
  exportDate?: string;
  exportedTo?: ICountry;
  arrival?: boolean;
  departureCountry?: string;
  departurePort?: string;
  departureDate?: string;
  freightBillNumber?: string;
  placeOfUnloading?: string;
  facilityArrivalDate?: string;
}

export const toBackEndTransport = (transport: Transport): BackEndModels.Transport => {

  let backEndTransport: BackEndModels.Transport;

  switch (transport.vehicle) {
    case truck: {
      const hasCmr = (transport.cmr !== null && transport.cmr !== undefined);
      const cmr = (transport.cmr === 'true');
      backEndTransport = getTruckBackEndTransport(transport, hasCmr, cmr);
      break;
    }
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

const getTruckBackEndTransport = (transport: Transport, hasCmr: boolean, cmr: boolean) => ({
  vehicle: transport.vehicle,
  cmr: hasCmr ? cmr : undefined,
  nationalityOfVehicle: cmr ? undefined : transport.nationalityOfVehicle,
  registrationNumber: cmr ? undefined : transport.registrationNumber,
  containerIdentificationNumber: cmr ? undefined : transport.containerIdentificationNumber,
  freightBillNumber: transport.freightBillNumber,
  departurePlace: cmr ? undefined : transport.departurePlace,
  pointOfDestination: transport.pointOfDestination,
  departureCountry: transport.departureCountry,
  departurePort: transport.departurePort,
  departureDate: transport.departureDate,
  exportDate: transport.exportDate,
  exportedTo: transport.exportedTo,
  placeOfUnloading: transport.placeOfUnloading,
  containerNumbers: transport.containerNumbers?.length ? transport.containerNumbers.join(',') : undefined,
});

const getPlaneBackEndTransport = (transport: Transport) => ({
  vehicle: transport.vehicle,
  flightNumber: transport.flightNumber,
  airwayBillNumber: transport.airwayBillNumber,
  containerNumber: transport.containerNumber,
  containerNumbers: transport.containerNumbers?.length ? transport.containerNumbers.join(',') : undefined,
  departurePlace: transport.departurePlace,
  pointOfDestination: transport.pointOfDestination,
  freightBillNumber: transport.freightBillNumber,
  departureCountry: transport.departureCountry,
  departurePort: transport.departurePort,
  departureDate: transport.departureDate,
  exportDate: transport.exportDate,
  exportedTo: transport.exportedTo,
  placeOfUnloading: transport.placeOfUnloading,
});

const getTrainBackEndTransport = (transport: Transport) => ({
  vehicle: transport.vehicle,
  railwayBillNumber: transport.railwayBillNumber,
  freightBillNumber: transport.freightBillNumber,
  departurePlace: transport.departurePlace,
  pointOfDestination: transport.pointOfDestination,
  departureCountry: transport.departureCountry,
  departurePort: transport.departurePort,
  departureDate: transport.departureDate,
  exportDate: transport.exportDate,
  exportedTo: transport.exportedTo,
  placeOfUnloading: transport.placeOfUnloading,
  containerNumbers: transport.containerNumbers?.length ? transport.containerNumbers.join(',') : undefined,
});

const getContainerVesselBackEndTransport = (transport: Transport) => ({
  vehicle: transport.vehicle,
  vesselName: transport.vesselName,
  flagState: transport.flagState,
  freightBillNumber: transport.freightBillNumber,
  departureCountry: transport.departureCountry,
  departurePort: transport.departurePort,
  departureDate: transport.departureDate,
  containerNumber: transport.containerNumber,
  containerNumbers: transport.containerNumbers?.length ? transport.containerNumbers.join(',') : undefined,
  departurePlace: transport.departurePlace,
  pointOfDestination: transport.pointOfDestination,
  exportDate: transport.exportDate,
  exportedTo: transport.exportedTo,
  placeOfUnloading: transport.placeOfUnloading,
});

const getFishingVesselBackEndTransport = (transport: Transport) => ({
  vehicle: transport.vehicle,
  departurePlace: transport.departurePlace,
  exportDate: transport.exportDate,
  exportedTo: transport.exportedTo
});

const getFrontEndContainerNumbers = (containerNumbers?: string) => containerNumbers ? containerNumbers.split(',').map(cn => cn.trim()) : undefined;

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
          freightBillNumber: model.freightBillNumber,
          departurePlace: model.departurePlace,
          pointOfDestination: model.pointOfDestination,
          exportDate: transport.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
          departureCountry: model.departureCountry,
          departurePort: model.departurePort,
          departureDate: model.departureDate,
          placeOfUnloading: model.placeOfUnloading,
          containerNumbers: getFrontEndContainerNumbers(model.containerNumbers),
        };

        break;
      }
      case plane: {
        const model = transport as BackEndModels.Plane;
        frontEndTransport = {
          vehicle: model.vehicle,
          flightNumber: model.flightNumber,
          airwayBillNumber: model.airwayBillNumber,
          freightBillNumber: model.freightBillNumber,
          containerNumber: model.containerNumber,
          containerNumbers: getFrontEndContainerNumbers(model.containerNumbers),
          departurePlace: model.departurePlace,
          pointOfDestination: model.pointOfDestination,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
          departureCountry: model.departureCountry,
          departurePort: model.departurePort,
          departureDate: model.departureDate,
          placeOfUnloading: model.placeOfUnloading,
        };
        break;
      }
      case train: {
        const model = transport as BackEndModels.Train;
        frontEndTransport = {
          vehicle: model.vehicle,
          railwayBillNumber: model.railwayBillNumber,
          freightBillNumber: model.freightBillNumber,
          departurePlace: model.departurePlace,
          pointOfDestination: model.pointOfDestination,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
          departureCountry: model.departureCountry,
          departurePort: model.departurePort,
          departureDate: model.departureDate,
          placeOfUnloading: model.placeOfUnloading,
          containerNumbers: getFrontEndContainerNumbers(model.containerNumbers),
        };
        break;
      }
      case containerVessel: {
        const model = transport as BackEndModels.ContainerVessel;
        frontEndTransport = {
          vehicle: model.vehicle,
          vesselName: model.vesselName,
          flagState: model.flagState,
          freightBillNumber: model.freightBillNumber,
          containerNumber: model.containerNumber,
          containerNumbers: getFrontEndContainerNumbers(model.containerNumbers),
          departurePlace: model.departurePlace,
          pointOfDestination: model.pointOfDestination,
          exportDate: model.exportDate,
          exportedTo: toExportedTo(model.exportedTo),
          departureCountry: model.departureCountry,
          departurePort: model.departurePort,
          departureDate: model.departureDate,
          placeOfUnloading: model.placeOfUnloading,
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
      data = (
        transport.nationalityOfVehicle
        && transport.registrationNumber
        && transport.departurePlace
      ) ? transport : {
        vehicle: transport.vehicle,
        exportedTo: transport.exportedTo
      }
  }
  return data;
}

const checkPlaneDataFrontEnd = (transport: Transport) => (
  transport.flightNumber
  && transport.containerNumbers
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
  && transport.containerNumbers
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
