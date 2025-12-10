import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as BackEndStorageDocument from './storageDoc';
import { DocumentNumber } from './frontEndModels/documentNumber';
import { Catch } from './frontEndModels/storageDocument';
import { ExporterDetails, Transport, ICountry } from './common';
import * as Utils from '../../helpers/utils/utils';

describe('When newing up a new storage document', () => {
  it('Will uppercase its document number', () => {
    const schema = {
      documentNumber: "aaa",
      status: "test",
      createdAt: "2019-01-01",
      createdBy: "John",
      createdByEmail: "test@test.com",
      exportData: { catches: [{ certificateNumber: "aaa" }] },
      documentUri: "test"
    };

    const mySchema = new BackEndStorageDocument.StorageDocumentModel(schema);

    expect(mySchema.exportData.catches[0].certificateNumber).toEqual('AAA')
  });
});

describe('toFrontEndDocumentNumber mapping back end to front end', () => {

  it('should return a valid document number data object when called with a storage document', () => {
    const expected: DocumentNumber = {
      documentNumber: "GBR-2020-SD-272B300C3",
      status: "DRAFT",
      startedAt: "10 Feb 2020"
    };

    const storageDocument: BackEndStorageDocument.StorageDocument = {
      createdAt: "10 Feb 2020",
      createdBy: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      createdByEmail: "foo@foo.com",
      documentNumber: "GBR-2020-SD-272B300C3",
      documentUri: "_1d1e7128-2b8a-404b-b842-f0303a1218ef.pdf",
      requestByAdmin: true,
      status: "DRAFT",
      draftData: {},
      exportData: {
        catches: [
          {
            product: "Atlantic herring (HER)",
            id: '34RWR-1610018899',
            commodityCode: "34567",
            productWeight: "45",
            dateOfUnloading: "11/02/2020",
            placeOfUnloading: "London",
            transportUnloadedFrom: "12345",
            certificateNumber: "34RWR",
            weightOnCC: "45"
          }
        ],
        exporterDetails: {
          contactId: 'a contact Id',
          accountId: 'an account id',
          exporterCompanyName: "Exporter Fish Ltd",
          addressOne: "London",
          addressTwo: "London",
          townCity: "London",
          postcode: "SE37 6YH",
          _dynamicsAddress: { someData: 'original data' },
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe"
          }
        },
        transportation: {
          vehicle: "truck",
          nationalityOfVehicle: "British",
          registrationNumber: "WE78ERF",
          departurePlace: "London",
          exportDate: "25/11/2019"
        },
        facilityName: 'ssss',
        facilityAddressOne: 'sadsad, sdsa, ewr, sadasd',
        facilityTownCity: 'asdads',
        facilityPostcode: '12343',
        facilitySubBuildingName: 'sdsa',
        facilityBuildingNumber: 'sadsad',
        facilityBuildingName: 'ewr',
        facilityStreetName: 'sadasd',
        facilityCounty: 'england',
        facilityCountry: 'Afghanistan',
        facilityApprovalNumber: 'TSF001',
        facilityStorage: 'chilled, frozen',
        facilityArrivalDate: '17/10/2025',
        _facilityUpdated: false

      },
      "audit": []
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentDocumentNumber(storageDocument)).toStrictEqual(expected);
  });

});

describe('toFrontEndStorageDocumentExportData mapping back end to front end', () => {

  it('should return a valid front end export data object for storage document', () => {
    const expected = {
      catches: [
        {
          product: "Atlantic herring (HER)",
          id: "34RWR-1610018899",
          commodityCode: "34567",
          productWeight: "45",
          dateOfUnloading: "11/02/2020",
          placeOfUnloading: "London",
          transportUnloadedFrom: "12345",
          certificateNumber: "34RWR",
          weightOnCC: "45"
        }
      ],
      validationErrors: [],
      addAnotherProduct: "No",
      transport: {
        vehicle: "truck",
        cmr: "false",
        nationalityOfVehicle: "British",
        registrationNumber: "WE78ERF",
        departurePlace: "London",
        exportDate: "25/11/2019"
      },
      arrivalTransport: undefined,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      facilityAddressOne: "",
      facilityApprovalNumber: "",
      facilityArrivalDate: "",
      facilityBuildingName: "",
      facilityBuildingNumber: "",
      facilityCountry: "",
      facilityCounty: "",
      facilityName: "",
      facilityPostcode: "",
      facilityStorage: "Chilled",
      facilityStreetName: "",
      facilitySubBuildingName: "",
      facilityTownCity: "",
    };

    const catches: Catch[] = [{
      product: "Atlantic herring (HER)",
      id: '34RWR-1610018899',
      commodityCode: "34567",
      productWeight: "45",
      dateOfUnloading: "11/02/2020",
      placeOfUnloading: "London",
      transportUnloadedFrom: "12345",
      certificateNumber: "34RWR",
      weightOnCC: "45"
    }];

    const exporterDetails: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      addressTwo: "London",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: 'original data' },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const transport: Transport = {
      vehicle: "truck",
      cmr: false,
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportDate: "25/11/2019"
    }

    const exportData: BackEndStorageDocument.ExportData = {
      catches: catches,
      exporterDetails: exporterDetails,
      transportation: transport,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      facilityAddressOne: "",
      facilityApprovalNumber: "",
      facilityArrivalDate: "",
      facilityBuildingName: "",
      facilityBuildingNumber: "",
      facilityCountry: "",
      facilityCounty: "",
      facilityName: "",
      facilityPostcode: "",
      facilityStorage: "Chilled",
      facilityStreetName: "",
      facilitySubBuildingName: "",
      facilityTownCity: "",
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentExportData(exportData)).toStrictEqual(expected);
  });

  it('should return a valid front end export data object with an old exportedTo property', () => {
    const expected = {
      catches: [
        {
          product: "Atlantic herring (HER)",
          id: "34RWR-1610018899",
          commodityCode: "34567",
          productWeight: "45",
          dateOfUnloading: "11/02/2020",
          placeOfUnloading: "London",
          transportUnloadedFrom: "12345",
          certificateNumber: "34RWR",
          weightOnCC: "45"
        }
      ],
      validationErrors: [],
      addAnotherProduct: "No",
      transport: {
        vehicle: "truck",
        cmr: "false",
        exportedTo: {
          officialCountryName: "SPAIN"
        },
        nationalityOfVehicle: "British",
        registrationNumber: "WE78ERF",
        departurePlace: "London",
        exportDate: "25/11/2019"
      },
      exportedTo: {
        officialCountryName: "SPAIN"
      },
      arrivalTransport: {
        vehicle: "truck",
        cmr: "false",
        exportedTo: {
          officialCountryName: "SPAIN"
        },
        nationalityOfVehicle: "British",
        registrationNumber: "WE78ERF",
        departurePlace: "London",
        exportDate: "25/11/2019"
      },
      facilityAddressOne: "",
      facilityApprovalNumber: "",
      facilityArrivalDate: "",
      facilityBuildingName: "",
      facilityBuildingNumber: "",
      facilityCountry: "",
      facilityCounty: "",
      facilityName: "",
      facilityPostcode: "",
      facilityStorage: "Chilled",
      facilityStreetName: "",
      facilitySubBuildingName: "",
      facilityTownCity: "",
    };

    const catches: Catch[] = [{
      product: "Atlantic herring (HER)",
      id: '34RWR-1610018899',
      commodityCode: "34567",
      productWeight: "45",
      dateOfUnloading: "11/02/2020",
      placeOfUnloading: "London",
      transportUnloadedFrom: "12345",
      certificateNumber: "34RWR",
      weightOnCC: "45"
    }];

    const exporterDetails: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      addressTwo: "London",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: 'original data' },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const transport: any = {
      vehicle: "truck",
      cmr: false,
      exportedTo: "SPAIN",
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportDate: "25/11/2019"
    }

    const arrivalTransport: any = {
      vehicle: "truck",
      cmr: false,
      exportedTo: "SPAIN",
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportDate: "25/11/2019"
    }

    const exportData: any = {
      catches: catches,
      exporterDetails: exporterDetails,
      transportation: transport,
      arrivalTransportation: arrivalTransport,
      exportedTo: "SPAIN",
      facilityAddressOne: "",
      facilityApprovalNumber: "",
      facilityArrivalDate: "",
      facilityBuildingName: "",
      facilityBuildingNumber: "",
      facilityCountry: "",
      facilityCounty: "",
      facilityName: "",
      facilityPostcode: "",
      facilityStorage: "Chilled",
      facilityStreetName: "",
      facilitySubBuildingName: "",
      facilityTownCity: "",
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentExportData(exportData)).toStrictEqual(expected);
  });

  it('should return empty if only exporter details are available in the backend', () => {
    const expected = {
      catches: [],
      validationErrors: [{}],
      addAnotherProduct: "No"
    };

    const exporterDetails: ExporterDetails = {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterCompanyName: "Exporter Fish Ltd",
      addressOne: "London",
      addressTwo: "London",
      townCity: "London",
      postcode: "SE37 6YH",
      _dynamicsAddress: { someData: 'original data' },
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    };

    const exportData: BackEndStorageDocument.ExportData = {
      exporterDetails: exporterDetails,
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentExportData(exportData)).toStrictEqual(expected);
  });

  it('should return default property values if there is no exporter deta', () => {
    const expected = {
      catches: [],
      validationErrors: [{}],
      addAnotherProduct: "No"
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentExportData(undefined)).toStrictEqual(expected);
  });

  it('should clear the address from and flag any facilities where the address is in the old format', () => {
    const input: BackEndStorageDocument.ExportData = {
      catches: [],
      facilityName: "New format",
      facilityAddressOne: "Building, Street",
      facilityBuildingName: "Building",
      facilityStreetName: "Street",
      facilityTownCity: "London",
      facilityPostcode: "SE37 6YH",
      facilityStorage: "Chilled",
      exporterDetails: {
        _dynamicsAddress: {},
        _dynamicsUser: {},
        addressOne: '',
        exporterCompanyName: '',
        postcode: ''
      },
      transportation: {
        vehicle: ''
      }
    };

    expect(BackEndStorageDocument.toFrontEndStorageDocumentExportData(input)).toStrictEqual({
      catches: [],
      facilityName: "New format",
      facilityAddressOne: "Building, Street",
      facilityBuildingName: "Building",
      facilityStreetName: "Street",
      facilityTownCity: "London",
      facilityPostcode: "SE37 6YH",
      validationErrors: [],
      addAnotherProduct: "No",
      arrivalTransport: undefined,
      transport: null,
      exportedTo: undefined,
      facilityApprovalNumber: undefined,
      facilityArrivalDate: undefined,
      facilityBuildingNumber: undefined,
      facilityCountry: undefined,
      facilityCounty: undefined,
      facilityStorage: "Chilled",
      facilitySubBuildingName: undefined
    });
  });

});


describe('When saving a storage document', () => {

  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => { console.log(err) });
  });

  afterEach(async () => {
    await BackEndStorageDocument.StorageDocumentModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should generate a unique _id for each catch', async () => {
    const data = {
      documentNumber: "aaa",
      status: "test",
      createdAt: "2019-01-01",
      createdBy: "John",
      createdByEmail: "test@test.com",
      exportData: {
        catches: [
          { certificateNumber: "aaa" },
          { certificateNumber: "bbb" }
        ]
      },
      documentUri: "test"
    };

    const sd = await new BackEndStorageDocument.StorageDocumentModel(data).save();

    expect(sd.exportData.catches[0]['_id']).not.toBeUndefined();
    expect(sd.exportData.catches[1]['_id']).not.toBeUndefined();
    expect(sd.exportData.catches[0]['_id']).not.toEqual(sd.exportData.catches[1]['_id']);
  });

});

describe('When cloning a storage document', () => {
  const originalCatch: Catch = {
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
  };

  const originalCatch2: Catch = {
    product: "Mola rock crab (CWE)",
    commodityCode: "12",
    certificateNumber: "12",
    productWeight: "12",
    weightOnCC: "12",
    placeOfUnloading: "12",
    dateOfUnloading: "26/05/2021",
    transportUnloadedFrom: "12",
    id: "12-1622029342",
    scientificName: "Cancer edwardsii"
  };


  const originalExporterDetails: ExporterDetails = {
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
  };

  const originalExportData: BackEndStorageDocument.ExportData = {
    catches: [originalCatch, originalCatch2],
    exporterDetails: originalExporterDetails,
    facilityName: "fi",
    facilityAddressOne: "The cat is flat, Building name, street name ",
    facilityTownCity: "Ealing",
    facilityPostcode: "W3 0ab",
    facilitySubBuildingName: "The cat is flat",
    facilityBuildingNumber: null,
    facilityBuildingName: "Building name",
    facilityStreetName: "Street name",
    facilityCounty: "Ealing",
    facilityCountry: "United Kingdom of Great Britain and Northern Ireland",
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
  }

  const originalFullDoc: BackEndStorageDocument.StorageDocument = {
    createdAt: new Date('2020-01-01').toISOString(),
    createdBy: "9fa89637-de81-45ef-a5d9-8dd0bb61505b",
    createdByEmail: "hi@ivinapontes.com",
    status: "COMPLETE",
    documentNumber: "GBR-2021-SD-01",
    requestByAdmin: false,
    userReference: "this is a reference",
    exportData: originalExportData
  };

  describe('cloneStorageDocument', () => {
    const clone = BackEndStorageDocument.cloneStorageDocument(originalFullDoc, 'GBR-2021-SD-02', false, false);

    it('will copy the exporter details', () => {
      expect(clone.createdBy).toBe(originalFullDoc.createdBy);
      expect(clone.createdByEmail).toBe(originalFullDoc.createdByEmail);
      expect(clone.userReference).toBe(originalFullDoc.userReference);
    });

    it('will update the created at date', () => {
      expect(clone.createdAt).not.toBe(originalFullDoc.createdAt);
    });

    it('will set the document status to draft', () => {
      expect(clone.status).toBe('DRAFT');
    });

    it('will update the document number', () => {
      expect(clone.documentNumber).toBe('GBR-2021-SD-02');
    });

    it('will set requestByAdmin to be false', () => {
      expect(clone.requestByAdmin).toBeFalsy();
    });

    it('will update the export data details', () => {
      expect(clone.exportData).not.toBe(originalFullDoc.exportData);
    });
  });

  describe('cloneExportData', () => {

    const clone = BackEndStorageDocument.cloneExportData(originalExportData);

    it('will copy the exporter details', () => {
      expect(clone.exporterDetails).toBe(originalExportData.exporterDetails);
    });

    it('will update the product details if there are any', () => {
      expect(clone.catches).not.toBe(originalExportData.catches);
    });
  });

  describe('cloneExportData - with an old exportedTo', () => {
    const original: any = {
      catches: [originalCatch, originalCatch2],
      exporterDetails: originalExporterDetails,
      storageFacilities: [{
        facilityName: "fi",
        facilityAddressOne: "The cat is flat, Building name, street name ",
        facilityAddressTwo: "LONDON",
        facilityTownCity: "Ealing",
        facilityPostcode: "W3 0ab"
      }],
      transportation: {
        vehicle: "truck",
        exportedTo: "Australia",
        cmr: true
      },
      exportedTo: "Australia"
    }

    it('will copy and map exportedTo into the currently supported format', () => {
      const expected: ICountry = {
        officialCountryName: "Australia"
      };

      const clone = BackEndStorageDocument.cloneExportData(original);

      expect(clone.exportedTo).toStrictEqual(expected);
      expect(clone.transportation?.exportedTo).toStrictEqual(expected);
    });

    it('will spread first storage facility into top level exportData fields', () => {
      const clone = BackEndStorageDocument.cloneExportData(original);

      expect(clone.facilityName).toBe("fi");
      expect(clone.facilityAddressOne).toBe("The cat is flat, Building name, street name ");
      expect(clone.facilityTownCity).toBe("Ealing");
      expect(clone.facilityPostcode).toBe("W3 0ab");
    });
  });

  describe('cloneCatches', () => {
    let mockGetRandomDigits;
    const clone = BackEndStorageDocument.cloneCatches(originalCatch);

    it('will update the catch id with the new document number', () => {
      mockGetRandomDigits = jest.spyOn(Utils, 'getRandomNumber');
      mockGetRandomDigits.mockReturnValue(1971523990);

      const clone = BackEndStorageDocument.cloneCatches(originalCatch);

      expect(clone.id).not.toEqual(originalCatch.id);
      expect(clone.id).toBe('12-1971523990');
    });

    it('will keep all the other fields the same', () => {
      expect(clone.product).toBe(originalCatch.product);
      expect(clone.commodityCode).toBe(originalCatch.commodityCode);
      expect(clone.certificateNumber).toBe(originalCatch.certificateNumber);
      expect(clone.productWeight).toBe(originalCatch.productWeight);
      expect(clone.weightOnCC).toBe(originalCatch.weightOnCC);
      expect(clone.dateOfUnloading).toBe(originalCatch.dateOfUnloading);
      expect(clone.placeOfUnloading).toBe(originalCatch.placeOfUnloading);
      expect(clone.transportUnloadedFrom).toBe(originalCatch.transportUnloadedFrom);
      expect(clone.scientificName).toBe(originalCatch.scientificName);
    });
  });
});