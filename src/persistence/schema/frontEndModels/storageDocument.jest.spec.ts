import * as FrontEndSD from './storageDocument';
import * as BackEndSD from '../storageDoc'
import * as ExporterDetails from "./exporterDetails";
import * as Transport from "./transport";
import * as moment from "moment";

describe('when mapping frontend catch to backend catch for statementDocument', () => {
  it('should contain the relevant properties for mongo Catch type', () => {
    const frontendCatch: FrontEndSD.Catch[] = [{
      product: "Atlantic cod (COD)",
      speciesCode: "COD",
      id: '200-' + moment.utc().unix() + '-0',
      commodityCode: "the cod code",
      certificateNumber: "200",
      productWeight: "200",
      weightOnCC: "159",
      dateOfUnloading: "soon",
      placeOfUnloading: "there",
      transportUnloadedFrom: "here",
      scientificName: "some scientific name",
      certificateType: "uk",
    }];

    const expected: BackEndSD.Catch[] = [{
      product: "Atlantic cod (COD)",
      speciesCode: "COD",
      id: '200-' + moment.utc().unix() + '-0',
      commodityCode: "the cod code",
      certificateNumber: "200",
      productWeight: "200",
      weightOnCC: "159",
      dateOfUnloading: "soon",
      placeOfUnloading: "there",
      transportUnloadedFrom: "here",
      scientificName: "some scientific name",
      certificateType: "uk",
      issuingCountry: undefined,
      supportingDocuments: undefined,
      productDescription: undefined,
      netWeightFisheryProductArrival: undefined,
      netWeightProductArrival: undefined,
      netWeightFisheryProductDeparture: undefined,
      netWeightProductDeparture: undefined,
    }];

    const result = FrontEndSD.toBackEndCatchSD(frontendCatch);

    expect(result).toStrictEqual(expected);

  });

  it('should not contain an id in back end SD catch', () => {
    const frontendCatch: FrontEndSD.Catch[] = [{
      product: "COD",
      scientificName: "some scientific name",
      productWeight: "200",
      commodityCode: "the cod code"
    }];

    const expected: BackEndSD.Catch[] = [{
      certificateType: undefined,
      certificateNumber: undefined,
      issuingCountry: undefined,
      supportingDocuments: undefined,
      product: "COD",
      scientificName: "some scientific name",
      productWeight: "200",
      commodityCode: "the cod code",
      dateOfUnloading: undefined,
      id: undefined,
      placeOfUnloading: undefined,
      speciesCode: undefined,
      transportUnloadedFrom: undefined,
      weightOnCC: undefined,
      productDescription: undefined,
      netWeightFisheryProductArrival: undefined,
      netWeightProductArrival: undefined,
      netWeightFisheryProductDeparture: undefined,
      netWeightProductDeparture: undefined,
    }];

    const result = FrontEndSD.toBackEndCatchSD(frontendCatch);

    expect(result).toStrictEqual(expected);
  });
});

describe('Maps the catches from back end to front end', () => {
  it('contains the catch details from back end to front end', () => {
    const expected: FrontEndSD.Catch = {
      product: "Alaska plaice (ALP)",
      id: '123-1610018899',
      commodityCode: "12",
      productWeight: "12",
      dateOfUnloading: "26/01/2020",
      placeOfUnloading: "London",
      transportUnloadedFrom: "Truck",
      certificateNumber: "123",
      weightOnCC: "22"
    };

    const catches: BackEndSD.Catch = {
      product: "Alaska plaice (ALP)",
      id: '123-1610018899',
      commodityCode: "12",
      productWeight: "12",
      dateOfUnloading: "26/01/2020",
      placeOfUnloading: "London",
      transportUnloadedFrom: "Truck",
      certificateNumber: "123",
      weightOnCC: "22"
    };
    const result = BackEndSD.toFrontEndCatchStorageDocument(catches);
    expect(result).toStrictEqual(expected);
  });


});
describe('when mapping frontend  to backend exportData for statementDocument', () => {

  const frontEndExporterDetails: ExporterDetails.Exporter = {
    model: {
      contactId: "a contact Id",
      accountId: "an account id",
      exporterCompanyName: "JuanFishing",
      addressOne: "23 Prince Rupert",
      townCity: "Aylesbury",
      postcode: "HP19 9rb",
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe",
      },
      user_id: "",
      journey: "storageNotes",
      currentUri: "",
      nextUri: "",
    },
  };

  const frontEndCatches: [FrontEndSD.Catch] = [{
    "product": "Atlantic cod (COD)",
    "id": '1234123525-' + moment.utc().unix(),
    "commodityCode": "231412412354125",
    "productWeight": "200",
    "dateOfUnloading": "27/01/2020",
    "placeOfUnloading": "dover",
    "transportUnloadedFrom": "21341325125",
    "certificateNumber": "1234123525",
    "weightOnCC": "200",
    "scientificName": "some scientific name"
  }];

  const frontendStorageFacilities: [FrontEndSD.StorageFacility] = [{
    "facilityName": "juan testing",
    "facilityAddressOne": "23 Prince Rupert",
    "facilityTownCity": "Aylesbury",
    "facilityPostcode": "HP19 9rb",
    "facilitySubBuildingName": "Sub building name",
    "facilityBuildingNumber": undefined,
    "facilityBuildingName": "Building name",
    "facilityStreetName": "Street name",
    "facilityCounty": "Ealing",
    "facilityCountry": "United Kingdom of Great Britain and Northern Ireland"

  }];

  const frontEndTransportation: Transport.Transport = {
    vehicle: "truck",
    cmr: "false",
    nationalityOfVehicle: "adsf",
    registrationNumber: "asdsfsd",
    departurePlace: "Aylesbury",
    exportDate: "27/01/2020",
    user_id: "",
    journey: "storageNotes",
    currentUri: "",
    nextUri: ""
  };

  it('should contain the relevant properties for mongo exportData type', () => {
    const sd: FrontEndSD.StorageDocument = {
      catches: frontEndCatches,
      storageFacilities: frontendStorageFacilities,
      transport: frontEndTransportation,
      arrivalTransport: frontEndTransportation,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndSD.toBackEndExportDataSD(sd, frontEndExporterDetails);

    expect(result.exporterDetails.addressOne).toBeTruthy();
    expect(result.exporterDetails.townCity).toBeTruthy();
    expect(result.exporterDetails.postcode).toBeTruthy();
    expect(result.exporterDetails.buildingName).toBeUndefined();
    expect(result.exporterDetails.buildingNumber).toBeUndefined();
    expect(result.exporterDetails.subBuildingName).toBeUndefined();
    expect(result.exporterDetails.county).toBeUndefined();
    expect(result.arrivalTransportation).toBeDefined();
  });

  it('should contain return an empty exporter details section', () => {
    const sd: FrontEndSD.StorageDocument = {
      catches: frontEndCatches,
      storageFacilities: frontendStorageFacilities,
      transport: frontEndTransportation,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndSD.toBackEndExportDataSD(sd, undefined);

    expect(result.exporterDetails).toBeUndefined();
  });
});

describe('when using sdDataToSave', () => {

  let backEndExportData: BackEndSD.ExportData;
  let frontEndStorageDocument: FrontEndSD.StorageDocument;
  let mockToBackEndExportDataSD: jest.SpyInstance;
  let mockToFrontEndPsAndSdExporterDetails: jest.SpyInstance;

  beforeEach(() => {
    backEndExportData = {
      catches: [
        {
          product: "Atlantic cod (COD)",
          id: "1234123525-" + moment.utc().unix(),
          commodityCode: "231412412354125",
          productWeight: "200",
          dateOfUnloading: "27/01/2020",
          placeOfUnloading: "dover",
          transportUnloadedFrom: "21341325125",
          certificateNumber: "1234123525",
          weightOnCC: "200",
          scientificName: "some scientific name",
        },
      ],
      facilityName: "back 0 juan testing",
      facilityAddressOne: "23 Prince Rupert",
      facilityTownCity: "Aylesbury",
      facilityPostcode: "HP19 9rb",
      facilitySubBuildingName: "Sub building name",
      facilityBuildingNumber: undefined,
      facilityBuildingName: "Building name",
      facilityStreetName: "Street name",
      facilityCounty: "Ealing",
      facilityCountry: "United Kingdom of Great Britain and Northern Ireland",
      exporterDetails: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "JuanFishing",
        addressOne: "23 Prince Rupert",
        townCity: "Aylesbury",
        postcode: "HP19 9rb",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
      },
      transportation: {
        vehicle: "truck",
        cmr: false,
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        exportDate: "27/01/2020",
      },
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP",
      }
    };

    frontEndStorageDocument = {
      catches: [{
        "product": "Atlantic cod (COD)",
        "id": '1234123525-' + moment.utc().unix(),
        "commodityCode": "231412412354125",
        "productWeight": "200",
        "dateOfUnloading": "27/01/2020",
        "placeOfUnloading": "dover",
        "transportUnloadedFrom": "21341325125",
        "certificateNumber": "1234123525",
        "weightOnCC": "200",
        "scientificName": "some scientific name"
      }],
      transport: {
        vehicle: "truck",
        cmr: "false",
        nationalityOfVehicle: "adsf",
        registrationNumber: "asdsfsd",
        departurePlace: "Aylesbury",
        exportDate: "27/01/2020",
        user_id: "",
        journey: "storageNotes",
        currentUri: "",
        nextUri: ""
      },
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
    };

    mockToBackEndExportDataSD = jest.spyOn(FrontEndSD, 'toBackEndExportDataSD');
    mockToBackEndExportDataSD.mockReturnValue(backEndExportData);

    mockToFrontEndPsAndSdExporterDetails = jest.spyOn(ExporterDetails, 'toFrontEndPsAndSdExporterDetails');
    mockToFrontEndPsAndSdExporterDetails.mockReturnValue({});
  });

  afterEach(() => {
    mockToBackEndExportDataSD.mockRestore();
    mockToFrontEndPsAndSdExporterDetails.mockRestore();
  });

  it('should call toBackEndExportDataSD once with full frontEndStorageDocument if none of storageFacilities is empty', () => {
    frontEndStorageDocument.facilityName = "juan testing",
    frontEndStorageDocument.facilityAddressOne = "23 Prince Rupert",
    frontEndStorageDocument.facilityTownCity = "Aylesbury",
    frontEndStorageDocument.facilityPostcode = "HP19 9rb",
    frontEndStorageDocument.facilitySubBuildingName = "Sub building name",
    frontEndStorageDocument.facilityBuildingNumber = undefined,
    frontEndStorageDocument.facilityBuildingName = "Building name",
    frontEndStorageDocument.facilityStreetName = "Street name",
    frontEndStorageDocument.facilityCounty = "Ealing",
    frontEndStorageDocument.facilityCountry = "United Kingdom of Great Britain and Northern Ireland"

    FrontEndSD.sdDataToSave(frontEndStorageDocument, backEndExportData);


    expect(mockToBackEndExportDataSD).toHaveBeenCalledTimes(1);
    expect(mockToBackEndExportDataSD).toHaveBeenCalledWith(frontEndStorageDocument, {});
  });

  it('should call toBackEndExportDataSD once with the keeping original storageFacilities for the ones in FE that are empty', () => {
    frontEndStorageDocument.facilityName = "juan fe testing",
    frontEndStorageDocument.facilityAddressOne = "23 Prince Rupert",
    frontEndStorageDocument.facilityTownCity = "Aylesbury",
    frontEndStorageDocument.facilityPostcode = "HP19 9rb",
    frontEndStorageDocument.facilitySubBuildingName = "Sub building name",
    frontEndStorageDocument.facilityBuildingNumber = undefined,
    frontEndStorageDocument.facilityBuildingName = "Building name",
    frontEndStorageDocument.facilityStreetName = "Street name",
    frontEndStorageDocument.facilityCounty = "Ealing",
    frontEndStorageDocument.facilityCountry = "United Kingdom of Great Britain and Northern Ireland"

    FrontEndSD.sdDataToSave(frontEndStorageDocument, backEndExportData);

    const storageDocumentToBeSaved = { ...frontEndStorageDocument };
    storageDocumentToBeSaved.facilityName = "juan fe testing",
    storageDocumentToBeSaved.facilityAddressOne = "23 Prince Rupert",
    storageDocumentToBeSaved.facilityTownCity = "Aylesbury",
    storageDocumentToBeSaved.facilityPostcode = "HP19 9rb",
    storageDocumentToBeSaved.facilitySubBuildingName = "Sub building name",
    storageDocumentToBeSaved.facilityBuildingNumber = undefined,
    storageDocumentToBeSaved.facilityBuildingName = "Building name",
    storageDocumentToBeSaved.facilityStreetName = "Street name",
    storageDocumentToBeSaved.facilityCounty = "Ealing",
    storageDocumentToBeSaved.facilityCountry = "United Kingdom of Great Britain and Northern Ireland"


    expect(mockToBackEndExportDataSD).toHaveBeenCalledTimes(1);
    expect(mockToBackEndExportDataSD).toHaveBeenCalledWith(storageDocumentToBeSaved, {});
  });

  it('should call toBackEndExportDataSD once with the incomplete front end storage facility', () => {

    frontEndStorageDocument.facilityName = "juan testing",
    frontEndStorageDocument.facilityAddressOne = "23 Prince Rupert",
    frontEndStorageDocument.facilityTownCity = "Aylesbury",
    frontEndStorageDocument.facilityPostcode = "HP19 9rb",
    frontEndStorageDocument.facilitySubBuildingName = "Sub building name",
    frontEndStorageDocument.facilityBuildingNumber = undefined,
    frontEndStorageDocument.facilityBuildingName = "Building name",
    frontEndStorageDocument.facilityStreetName = "Street name",
    frontEndStorageDocument.facilityCounty = "Ealing",
    frontEndStorageDocument.facilityCountry = "United Kingdom of Great Britain and Northern Ireland"

    backEndExportData.storageFacilities = [];

    FrontEndSD.sdDataToSave(frontEndStorageDocument, backEndExportData);

    const storageDocumentToBeSaved = { ...frontEndStorageDocument };
    storageDocumentToBeSaved.facilityName = "juan testing",
    storageDocumentToBeSaved.facilityAddressOne = "23 Prince Rupert",
    storageDocumentToBeSaved.facilityTownCity = "Aylesbury",
    storageDocumentToBeSaved.facilityPostcode = "HP19 9rb",
    storageDocumentToBeSaved.facilitySubBuildingName = "Sub building name",
    storageDocumentToBeSaved.facilityBuildingNumber = undefined,
    storageDocumentToBeSaved.facilityBuildingName = "Building name",
    storageDocumentToBeSaved.facilityStreetName = "Street name",
    storageDocumentToBeSaved.facilityCounty = "Ealing",
    storageDocumentToBeSaved.facilityCountry = "United Kingdom of Great Britain and Northern Ireland"

    expect(mockToBackEndExportDataSD).toHaveBeenCalledTimes(1);
    expect(mockToBackEndExportDataSD).toHaveBeenCalledWith(storageDocumentToBeSaved, {});
  });

});

