import * as CCService from '../persistence/services/catchCert'
import * as SDService from '../persistence/services/storageDoc'
import * as PSService from '../persistence/services/processingStatement'
import DocumentNumberService from '../services/documentNumber.service';
import UserReferenceController from '../controllers/userReference.controller';
import { CatchCertificate, LandingsEntryOptions } from '../persistence/schema/catchCert';
import { ProcessingStatement } from '../persistence/schema/processingStatement';
import { StorageDocument } from '../persistence/schema/storageDoc';

describe('get', () => {

  it('should call the CC service if the given a CC document number', async () => {
    const document: CatchCertificate = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "GBR-X-CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "CC-ref",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: ''
        },
        products: [{
          species: "Atlantic cod (COD)",
          speciesId: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
          speciesCode: "COD",
          commodityCode: "03024310",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "WHL",
            name: "Whole"
          },
          caughtBy: [{
            numberOfSubmissions: 0,
            vessel: "AGAN BORLOWEN",
            pln: "SS229",
            homePort: "NEWLYN",
            flag: "GBR",
            imoNumber: null,
            licenceNumber: "25072",
            licenceValidTo: "2382-12-31T00:00:00",
            id: "GBR-X-CC-1-1610013801",
            date: "2021-01-07",
            faoArea: "FAO27",
            weight: 12
          }]
        }],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "directLanding",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        transportations: [{
          id: 0,
          vehicle: "directLanding",
        }],
        landingsEntryOption: LandingsEntryOptions.ManualEntry,
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      draftData: {},
      documentUri: 'some document uri',
    }
    const result = await UserReferenceController.getUserReference(document);

    expect(result).toBe('CC-ref');
  });

  it('should call the SD service if the given a SD document number', async () => {
    const document: StorageDocument = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "GBR-X-CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "SD-ref",
      exportData: {
        catches: [{
          product: "Mola rock crab (CWE)",
          commodityCode: "12",
          certificateNumber: "12",
          productWeight: "12",
          weightOnCC: "12",
          placeOfUnloading: "12",
          dateOfUnloading: "26/05/2021",
          transportUnloadedFrom: "12",
          id: "12-1622029341",
          scientificName: "Cancer edwardsii"
        }],
        exporterDetails: {
          contactId: "70676bc6-295e-ea11-a811-000d3a20f8d4",
          accountId: "7d676bc6-295e-ea11-a811-000d3a20f8d4",
          exporterCompanyName: "Fish trader",
          addressOne: "The cat is flat, Building name, street name",
          buildingNumber: null,
          subBuildingName: "The cat is flat",
          buildingName: "Building name",
          streetName: "Street name",
          county: "Ealing",
          country: "United Kingdom of Great Britain and Northern Ireland",
          townCity: "LONDON",
          postcode: "W3 0ab",
          _dynamicsAddress: {
          },
          _dynamicsUser: {
            firstName: "Ivina",
            lastName: "Pontes"
          }
        },
        storageFacilities: [{
          facilityName: "fi",
          facilityAddressOne: "The cat is flat, Building name, street name ",
          facilityTownCity: "Ealing",
          facilityPostcode: "W3 0ab",
          facilitySubBuildingName: "Sub building name",
          facilityBuildingNumber: null,
          facilityBuildingName: "Building name",
          facilityStreetName: "Street name",
          facilityCounty: "Ealing",
          facilityCountry: "United Kingdom of Great Britain and Northern Ireland"

        }],
        exportedTo: {
          officialCountryName: "Sweden",
          isoCodeAlpha2: "SE",
          isoCodeAlpha3: "SWE",
          isoNumericCode: "752"
        },
        transportation: {
          vehicle: "truck",
          exportedTo: {
            officialCountryName: "Sweden",
            isoCodeAlpha2: "SE",
            isoCodeAlpha3: "SWE",
            isoNumericCode: "752"
          },
          cmr: true
        }
      },
      draftData: {},
      documentUri: 'some document uri',
    }

    const result = await UserReferenceController.getUserReference(document);

    expect(result).toBe('SD-ref');
  });

  it('should call the PS service if the given a PS document number', async () => {
    const document: ProcessingStatement = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "GBR-X-CC-1",
      requestByAdmin: false,
      audit: [],
      userReference: "PS-ref",
      exportData: {
        catches: [{
          species: "Atlantic herring (HER)",
          id: '2342234-1610018899',
          catchCertificateNumber: "12345",
          totalWeightLanded: "34",
          exportWeightBeforeProcessing: "34",
          exportWeightAfterProcessing: "45",
          scientificName: 'scientificName'
        }],
        exporterDetails: {
          contactId : 'a contact Id',
          accountId  : 'an account id',
          exporterCompanyName: "Exporter Fish Ltd",
          addressOne: "London",
          addressTwo: "London",
          townCity: "London",
          postcode: "SE37 6YH",
          _dynamicsAddress: {},
          _dynamicsUser : {
            firstName: "John",
            lastName: "Doe"
          }
        },
        consignmentDescription: "Commodity code",
        healthCertificateNumber: "45645",
        healthCertificateDate: "27/10/2019",
        personResponsibleForConsignment: "Isaac",
        plantApprovalNumber: "12345",
        plantName: "Plant Name",
        plantAddressOne: "London",
        plantBuildingName: "plantBuildingName",
        plantBuildingNumber: "plantBuildingNumber",
        plantSubBuildingName: "plantSubBuildingName",
        plantStreetName: "plantStreetName",
        plantCountry: "plantCountry",
        plantCounty: "plantCounty",
        plantTownCity: "London",
        plantPostcode: "SE37 6YH",
        dateOfAcceptance: "10/02/2020",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      draftData: {},
      documentUri: 'some document uri',
    }

    const result = await UserReferenceController.getUserReference(document);

    expect(result).toBe('PS-ref');
  });

  it('should call nothing and return null if given any other document number', async () => {
    const document: CatchCertificate | ProcessingStatement | StorageDocument = undefined;

    const result = await UserReferenceController.getUserReference(document);

    expect(result).toBeNull();
  });

  it('should return nothing if there is no reference', async () => {
    const document: CatchCertificate = {
      createdAt: "2021-01-05T16:59:29.190Z",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      status: "LOCKED",
      documentNumber: "GBR-X-CC-1",
      requestByAdmin: false,
      audit: [],
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: ''
        },
        products: [{
          species: "Atlantic cod (COD)",
          speciesId: "GBR-X-CC-1-ad634ac5-6a9a-4726-8e4b-f9c0f3ec32c5",
          speciesCode: "COD",
          commodityCode: "03024310",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "WHL",
            name: "Whole"
          },
          caughtBy: [{
            numberOfSubmissions: 0,
            vessel: "AGAN BORLOWEN",
            pln: "SS229",
            homePort: "NEWLYN",
            flag: "GBR",
            imoNumber: null,
            licenceNumber: "25072",
            licenceValidTo: "2382-12-31T00:00:00",
            id: "GBR-X-CC-1-1610013801",
            date: "2021-01-07",
            faoArea: "FAO27",
            weight: 12
          }]
        }],
        conservation: {
          conservationReference: "UK Fisheries Policy"
        },
        transportation: {
          vehicle: "directLanding",
          exportedFrom: "United Kingdom",
          exportedTo: {
            officialCountryName: "SPAIN",
            isoCodeAlpha2: "A1",
            isoCodeAlpha3: "A3",
            isoNumericCode: "SP"
          }
        },
        transportations: [{
          id: 0,
          vehicle: "directLanding",
        }],
        landingsEntryOption: LandingsEntryOptions.ManualEntry,
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      },
      draftData: {},
      documentUri: 'some document uri',
    }


    const result = await UserReferenceController.getUserReference(document);

    expect(result).toBeUndefined();
  });

});

describe('Post user reference', () => {

  let mockCCUpsertUserReference;
  let mockSDUpsertUserReference;
  let mockPSUpsertUserReference;

  const contactId = 'contactBob';

  beforeEach(() => {
    mockCCUpsertUserReference = jest.spyOn(CCService, 'upsertUserReference');
    mockCCUpsertUserReference.mockResolvedValue('CC-ref');

    mockPSUpsertUserReference = jest.spyOn(PSService, 'upsertUserReference');
    mockPSUpsertUserReference.mockResolvedValue('PS-ref');


    mockSDUpsertUserReference = jest.spyOn(SDService, 'upsertUserReference');
    mockSDUpsertUserReference.mockResolvedValue('SD-ref');

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should post a user reference to CC', async () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('CC');
    const userPrincipal = 'Ivina';
    const userReference = 'This is a reference';


    await UserReferenceController.addUserReference(userPrincipal, documentNumber, userReference, contactId);

    expect(mockCCUpsertUserReference).toHaveBeenCalled();
  });

  it('Should post a user reference to SD', async () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('SD');
    const userPrincipal = 'Ivina';
    const userReference = 'This is a reference';

    await UserReferenceController.addUserReference(userPrincipal, documentNumber,userReference, contactId);

    expect(mockSDUpsertUserReference).toHaveBeenCalled();
  });

  it('should post a user reference to PS', async () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('PS');
    const userPrincipal = 'Ivina';
    const userReference = 'This is a reference';

    await UserReferenceController.addUserReference(userPrincipal, documentNumber, userReference, contactId);

    expect(mockPSUpsertUserReference).toHaveBeenCalled();
  });

  it('should call nothing and return null if given any other document number', async () => {
    const documentNumber = DocumentNumberService.getDocumentNumber('XX');
    const userPrincipal = 'Ivina';
    const userReference = 'This is a reference';

    const result = await UserReferenceController.addUserReference(documentNumber, userPrincipal, userReference, contactId);

    expect(result).toBeNull();
    expect(mockSDUpsertUserReference).not.toHaveBeenCalled();
    expect(mockPSUpsertUserReference).not.toHaveBeenCalled();
    expect(mockCCUpsertUserReference).not.toHaveBeenCalled();
  });

});