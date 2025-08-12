import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  ProcessingStatementModel,
  ProcessingStatement,
  toFrontEndProcessingStatementDocumentNumber,
  cloneProcessingStatement,
  cloneExportData,
  cloneCatch,
  clearOldProcessingPlantAddress,
  addTotalWeightLandedProcessingStatement
} from '../schema/processingStatement';
import { DocumentNumber } from '../schema/frontEndModels/documentNumber';
import { toFrontEndProcessingStatementExportData, ExportData, Catch, isOldProcessingPlantAddress } from './processingStatement';
import * as CatchCert from '../services/catchCert';
import * as Utils from '../../helpers/utils/utils';
import * as Validators from '../../validators/documentValidator';
import { ExporterDetails, ICountry, IDraft } from './common';
import * as FrontEndModels from './frontEndModels/processingStatement';

describe('When newing up a new processing statement', () => {
  it('Will uppercase catch certificates numbers', () => {
    const schema = {
      documentNumber: "aaa",
      status: "test",
      createdAt: "2019-01-01",
      createdBy: "John",
      createdByEmail: "test@test.com",
      exportData: { catches: [{ catchCertificateNumber: "aaa", catchCertificateType: "uk" }], storageFacilities: [] },
      documentUri: "test"
    }

    const mySchema = new ProcessingStatementModel(schema)

    expect(mySchema.exportData.catches[0].catchCertificateNumber).toEqual('AAA')
    expect(mySchema.exportData.catches[0].catchCertificateType).toEqual('uk')
  });
});

describe('When mapping a back end Processing statement to front end', () => {
  it('should return a valid document number data object when called with a processing statement', () => {
    const expected: DocumentNumber = {
      documentNumber: "GBR-2020-PS-3CA09BE17",
      status: "DRAFT",
      startedAt: "10 Feb 2020"
    }

    const processingStatement: ProcessingStatement = {
      createdAt: "10 Feb 2020",
      createdBy: "User Id to be done",
      createdByEmail: "User email to be done",
      documentNumber: "GBR-2020-PS-3CA09BE17",
      status: "DRAFT",
      documentUri: "",
      draftData: {},
      requestByAdmin: true,
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
        products: [{
          commodityCode: '03023190',
         description: 'Fresh or chilled albacore'
        }],
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
      audit: [],
      userReference: "Exporter Reference"
    };

    expect(toFrontEndProcessingStatementDocumentNumber(processingStatement)).toStrictEqual(expected);
  });

  it('Will return a valid front end export data object for processing statement', () => {
    const expected = {
      catches: [
        {
          species: "Astronesthes niger (AHR)",
          id: '2342234-1610018899',
          catchCertificateNumber: "2342234",
          catchCertificateType: "uk",
          totalWeightLanded: "34",
          exportWeightBeforeProcessing: "34",
          exportWeightAfterProcessing: "45",
          scientificName: "scientificName"
        }
      ],
      validationErrors: [],
      consignmentDescription: "code",
      products: [{
        commodityCode: '03023190',
       description: 'Fresh or chilled albacore'
      }],
      error: "",
      addAnotherCatch: "No",
      personResponsibleForConsignment: "Isaac",
      plantApprovalNumber: "456456",
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
      dateOfAcceptance: "12/02/2020",
      healthCertificateNumber: "567567",
      healthCertificateDate: "27/10/2019",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      _plantDetailsUpdated: false,
    };

    const exporterDetails: ExporterDetails = {
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
    };

    const exportData: ExportData = {
      catches: [{
        species: "Astronesthes niger (AHR)",
        catchCertificateNumber: "2342234",
        catchCertificateType: "uk",
        id: '2342234-1610018899',
        totalWeightLanded: "34",
        exportWeightBeforeProcessing: "34",
        exportWeightAfterProcessing: "45",
        scientificName: 'scientificName'
      }],
      consignmentDescription: "code",
      products: [{
        commodityCode: '03023190',
       description: 'Fresh or chilled albacore'
      }],
      healthCertificateNumber: "567567",
      healthCertificateDate: "27/10/2019",
      personResponsibleForConsignment: "Isaac",
      plantApprovalNumber: "456456",
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
      dateOfAcceptance: "12/02/2020",
      exporterDetails: exporterDetails,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    expect(toFrontEndProcessingStatementExportData(exportData)).toStrictEqual(expected);
  });

  it('Will return a valid front end export data object with the minimum required data', () => {
    const expected : FrontEndModels.ProcessingStatement = {
      addAnotherCatch: "No",
      catches: [],
      products: null,
      consignmentDescription: "code",
      dateOfAcceptance: null,
      error: "",
      healthCertificateDate: null,
      healthCertificateNumber: null,
      personResponsibleForConsignment: null,
      plantAddressOne: null,
      plantBuildingName: null,
      plantBuildingNumber: null,
      plantSubBuildingName: null,
      plantStreetName: null,
      plantCounty: null,
      plantCountry: null,
      plantApprovalNumber: null,
      plantName: null,
      plantPostcode: 'fake post code',
      plantTownCity: null,
      validationErrors: [],
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      _plantDetailsUpdated: false,
    };

    const exportData: ExportData = {
      consignmentDescription: "code",
      plantPostcode : 'fake post code',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
    };

    expect(toFrontEndProcessingStatementExportData(exportData)).toStrictEqual(expected);
  });

  it('Will return a valid front end export data object with an old exportedTo property', () => {
    const expected : FrontEndModels.ProcessingStatement = {
      addAnotherCatch: "No",
      catches: [],
      products: null,
      consignmentDescription: "code",
      dateOfAcceptance: null,
      error: "",
      healthCertificateDate: null,
      healthCertificateNumber: null,
      personResponsibleForConsignment: null,
      plantAddressOne: null,
      plantBuildingName: null,
      plantBuildingNumber: null,
      plantCountry: null,
      plantCounty: null,
      plantStreetName: null,
      plantSubBuildingName: null,
      plantApprovalNumber: null,
      plantName: null,
      plantPostcode: 'fake post code',
      plantTownCity: null,
      validationErrors: [],
      exportedTo: {
        officialCountryName: "SPAIN"
      },
      _plantDetailsUpdated: false,
    };

    const exportData: any = {
      consignmentDescription: "code",
      plantPostcode : 'fake post code',
      exportedTo: "SPAIN"
    };

    expect(toFrontEndProcessingStatementExportData(exportData)).toStrictEqual(expected);
  });

  it('should return validation errors for a processing statement with a future health certificate date', () => {
    const exporterDetails: ExporterDetails = {
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
    };

    const exportData: ExportData = {
      catches: [{
        species: "Astronesthes niger (AHR)",
        catchCertificateNumber: "2342234",
        id: '2342234-1610018899',
        totalWeightLanded: "34",
        exportWeightBeforeProcessing: "34",
        exportWeightAfterProcessing: "45",
        scientificName: 'scientificName'
      }],
      consignmentDescription: "code",
      healthCertificateNumber: "567567",
      healthCertificateDate: "27/10/3019",
      personResponsibleForConsignment: "Isaac",
      plantApprovalNumber: "456456",
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
      dateOfAcceptance: "12/02/2020",
      exporterDetails: exporterDetails,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expected: {}[] = [
      {
        'key': "dateValidationError",
        'message': "psAddHealthCertificateErrorTodayOrPastSubmitDateError",
      },
      {
        'key': "dateFieldError",
        'message': "psAddHealthCertificateErrorTodayOrPastSubmitDateValidationError",
      }
    ];

    expect(toFrontEndProcessingStatementExportData(exportData).validationErrors).toStrictEqual(expected);
  });
});

describe('When adding total weight landed to catches', () => {
  const documentNumber = "GBR-2023-PS-012345678";
  const userPrincipal = "Bob";
  const contactId = "contactBob";

  const draftProcessingStatement: IDraft = {
    "GBR-2022-CC-0": {
      "products": [{
        "species": "Atlantic cod (COD)",
        "totalWeight": 100
      }]
    },
    "GBR-2022-CC-1": {
      "products": [{
        "species": "Atlantic Herring (HER)",
        "totalWeight": 100
      }]
    },
    "GBR-2022-CC-2": {
      "products": [{
        "species": "Edible crab (CRE)",
        "speciesCode": "CRE",
        "totalWeight": 100
      }]
    },
    "GBR-2022-CC-3": {
      "products": [{
        "species": "Alert pigfish (AHK)",
        "speciesCode": "ANK",
        "totalWeight": 0.30000000000000004
        }]
    },
  };

  let mockGetDraftCache;
  let mockDocumentValidator;

  beforeEach(() => {
    mockGetDraftCache = jest.spyOn(CatchCert, 'getDraftCache');
    mockGetDraftCache.mockResolvedValue(draftProcessingStatement);

    mockDocumentValidator = jest.spyOn(Validators, 'validateCompletedDocument');
    mockDocumentValidator.mockResolvedValue(true);
  });

  afterEach(() => {
    mockGetDraftCache.mockRestore();
    mockDocumentValidator.mockRestore();
  });

  it('should not make a call to REDIS if the catch certificate type is not defined', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).not.toHaveBeenCalled();
    expect(results).toStrictEqual(catches);
  });

  it('should not make a call to REDIS if the catches array is empty', async () => {
    const catches: Catch[] = [];
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).not.toHaveBeenCalled();
    expect(results).toStrictEqual(catches);
  });

  it('should not make a call to REDIS if the catch certificate type is not UK', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'non_uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).not.toHaveBeenCalled();
    expect(results).toStrictEqual(catches);
  });

  it('should make a call to REDIS if the catch certificate type is UK', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual(catches);
  });

  it('should make multiple calls to REDIS if we have more than one catch with a catch certificate type UK', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id-0',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Atlantic Herring (HER)'
    },{
      id: 'some-catch-id-1',
      catchCertificateNumber: 'GBR-2022-CC-3',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    },{
      id: 'some-catch-id-2',
      catchCertificateNumber: 'GBR-2022-CC-4',
      catchCertificateType: 'uk',
      species: 'Edible crab (CRE)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledTimes(3);
    expect(results).toStrictEqual(catches);
  });

  it('should update catch with totalWeightLanded if the catch certificate type is UK', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)',
      totalWeightLanded: '100'
    }]);
  });

  it('should update catch with totalWeightLanded to 2 d.p. if the catch certificate type is UK', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-3',
      catchCertificateType: 'uk',
      species: 'Alert pigfish (AHK)',
      speciesCode: 'ANK'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-3',
      catchCertificateType: 'uk',
      species: 'Alert pigfish (AHK)',
      speciesCode: 'ANK',
      totalWeightLanded: '0.30'
    }]);
  });

  it('should update catch with totalWeightLanded if the catch certificate type is UK and we find a matching specie by specieCode', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Edible crab (brown crab)(CRE)',
      speciesCode: 'CRE'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Edible crab (brown crab)(CRE)',
      speciesCode: 'CRE',
      totalWeightLanded: '100'
    }]);
  });

  it('should not update catch with totalWeightLanded if the catch certificate type is UK and we do not find a matching specie by specieCode', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Edible crab (brown crab)(CRE)',
      speciesCode: 'RANDOM'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-2',
      catchCertificateType: 'uk',
      species: 'Edible crab (brown crab)(CRE)',
      speciesCode: 'RANDOM'
    }]);
  });

  it('will not update totalWeightLanded if a completed catch certificate is not found', async () => {
    mockGetDraftCache.mockResolvedValue(null);

    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });

  it('will not update totalWeightLanded if no completed catch certificate are available', async () => {
    mockGetDraftCache.mockResolvedValue({});

    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });

  it('will not update totalWeightLanded if the completed catch certificate has no products', async () => {
    mockGetDraftCache.mockResolvedValue({
      "GBR-2022-CC-0": {
        "products": null
      }
    });

    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });

  it('will not update totalWeightLanded if the completed catch certificate has no matching species', async () => {
    mockGetDraftCache.mockResolvedValue({
      "GBR-2022-CC-0": {
        "products": [{
          "species": "Blah",
          "totalWeight": 100
        }]
      }
    });

    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });

  it('will not update totalWeightLanded if the completed catch certificate does not contain speciefied species', async () => {
    mockGetDraftCache.mockResolvedValue({
      "GBR-2022-CC-1": {
        "products": [{
          "species": "Atlantic cod (COD)",
          "totalWeight": 100
        }]
      }
    });

    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-0',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });

  it('should not update catch with totalWeightLanded if the catch certificate if not found on the completed CC', async () => {
    const catches: Catch[] = [{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-1',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]
    const results: Catch[] = await addTotalWeightLandedProcessingStatement(documentNumber, userPrincipal, contactId, catches);
    expect(mockGetDraftCache).toHaveBeenCalledWith('Bob', 'contactBob', 'GBR-2023-PS-012345678');
    expect(results).toStrictEqual([{
      id: 'some-catch-id',
      catchCertificateNumber: 'GBR-2022-CC-1',
      catchCertificateType: 'uk',
      species: 'Atlantic cod (COD)'
    }]);
  });
});

describe('When saving a Processing Statement', () => {

  let mongoServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer({ debug: true });
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});

  } );

  afterEach(async () => {
    await ProcessingStatementModel.deleteMany({});
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
          { catchCertificateNumber: "aaa" },
          { catchCertificateNumber: "bbb" }
        ],
        storageFacilities: []
      },
      documentUri: "test"
    }

    const ps = await new ProcessingStatementModel(data).save();

    expect(ps.exportData.catches[0]['_id']).not.toBeUndefined();
    expect(ps.exportData.catches[1]['_id']).not.toBeUndefined();
    expect(ps.exportData.catches[0]['_id']).not.toEqual(ps.exportData.catches[1]['_id']);
  });

});

describe('cloneProcessingStatement', () => {

  const voidOriginal = false;
  const original: ProcessingStatement = {
    createdBy: 'Bob',
    createdByEmail: 'bob@bob',
    createdAt: new Date('2020-01-01').toISOString(),
    status: 'COMPLETE',
    documentNumber: 'DOC1',
    exportData: {
      catches: [{
        species: "Atlantic herring (HER)",
        id: '2342234-1610018899',
        catchCertificateNumber: "12345",
        catchCertificateType: "uk",
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
      products: [{
        commodityCode: '03023190',
       description: 'Fresh or chilled albacore'
      }],
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
    requestByAdmin: false,
    documentUri: "",
    draftData: {},
  }

  const clone = cloneProcessingStatement(original, 'DOC2', false, voidOriginal);

  it('will copy the author details', () => {
    expect(clone.createdBy).toBe(original.createdBy);
    expect(clone.createdByEmail).toBe(original.createdByEmail);
  });

  it('will update the created at date', () => {
    expect(clone.createdAt).not.toBe(original.createdAt);
  });

  it('will set the document status to draft', () => {
    expect(clone.status).toBe('DRAFT');
  });

  it('will update the document number', () => {
    expect(clone.documentNumber).toBe('DOC2');
  });

  it('will set requestByAdmin to be false', () => {
    expect(clone.requestByAdmin).toBeFalsy();
  });

  it('will update the export data details', () => {
    expect(clone.exportData).not.toBe(original.exportData);
  });

  it('will set a certificate type', () => {
    expect(clone.exportData?.catches[0].catchCertificateType).toBe("uk");
  });

});

describe('cloneExportData', () => {
  const exporterDetails: ExporterDetails = {
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
  };

  const original: ExportData = {
    catches: [{
      species: "Atlantic herring (HER)",
      id: '2342234-1610018899',
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "34",
      exportWeightAfterProcessing: "45",
      scientificName: 'scientificName',
      speciesCode: 'HER'
    },
    {
      species: "Cod",
      id: '2342234-1610018855',
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "34",
      exportWeightAfterProcessing: "45",
      scientificName: 'scientificName'
    }],
    exporterDetails: exporterDetails,
    consignmentDescription: "Commodity code",
    products: [{
      commodityCode: '03023190',
     description: 'Fresh or chilled albacore'
    }],
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
  }

  const clone = cloneExportData(original);

  it('will copy the exporter details', () => {
    expect(clone.exporterDetails).toBe(original.exporterDetails);
  });

  it('will update the catches details if there are any', () => {
    expect(clone.catches).not.toBe(original.catches);
  });

  it('will copy products added to the original processing statement', () => {
    expect(clone.products).toHaveLength(1);
  });
});

describe('cloneExportData - with an old exportedTo', () => {
  const original: any = {
    catches: [{
      species: "Atlantic herring (HER)",
      id: '2342234-1610018899',
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "34",
      exportWeightAfterProcessing: "45",
      scientificName: 'scientificName',
      speciesCode: 'HER'
    },
    {
      species: "Cod",
      id: '2342234-1610018855',
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
    plantAddressTwo: "London",
    plantTownCity: "London",
    plantPostcode: "SE37 6YH",
    dateOfAcceptance: "10/02/2020",
    exportedTo: "Australia"
  }

  const clone = cloneExportData(original);


  it('will copy and map exportedTo into the currently supported format', () => {
    const expected: ICountry  = {
      officialCountryName: "Australia"
    };

    expect(clone.exportedTo).toStrictEqual(expected);
  });
});

describe('cloneCatch', () => {
  let mockGetRandomDigits;
  const original: Catch = {
    species: "Atlantic herring (HER)",
    id: '2342234-1610018899',
    catchCertificateNumber: "GBR-2022-CC-0123456789",
    catchCertificateType: 'uk',
    totalWeightLanded: "34",
    exportWeightBeforeProcessing: "34",
    exportWeightAfterProcessing: "45",
    scientificName: 'scientificName',
    speciesCode: 'HER'
  };

  it('will update the catch id', () => {
    mockGetRandomDigits = jest.spyOn(Utils, 'getRandomNumber');
    mockGetRandomDigits.mockReturnValue(1234567890);
    const clone1 = cloneCatch(original);
    expect(clone1.id).toBe('GBR-2022-CC-0123456789-' + 1234567890);
  });

  it('will keep all the other fields the same', () => {
    const clone2 = cloneCatch(original);

    expect(clone2.species).toBe(original.species);
    expect(clone2.catchCertificateNumber).toBe(original.catchCertificateNumber);
    expect(clone2.catchCertificateType).toBe('uk');
    expect(clone2.totalWeightLanded).toBe(original.totalWeightLanded);
    expect(clone2.exportWeightBeforeProcessing).toBe(original.exportWeightBeforeProcessing);
    expect(clone2.exportWeightAfterProcessing).toBe(original.exportWeightAfterProcessing);
    expect(clone2.scientificName).toBe(original.scientificName);
    expect(clone2.speciesCode).toBe(original.speciesCode);
  });
});

describe('Dealing with old ProcessingPlant Address', () =>{
  const sampleExportData = {
    catches: [],
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
    dateOfAcceptance: "10/02/2020",
    exportedTo: {
      officialCountryName: "SPAIN",
      isoCodeAlpha2: "A1",
      isoCodeAlpha3: "A3",
      isoNumericCode: "SP"
    }
  };

  describe('isOldProcessingPlantAddress', () => {
    it('should return false if address is in new format', () => {
      const sampleExportDataNew = {
        ...sampleExportData,
        plantAddressOne: "London",
        plantBuildingName: "plantBuildingName",
        plantBuildingNumber: "plantBuildingNumber",
        plantSubBuildingName: "plantSubBuildingName",
        plantStreetName: "plantStreetName",
        plantCountry: "plantCountry",
        plantCounty: "plantCounty",
        plantTownCity: "London",
        plantPostcode: "SE37 6YH",
      }
      expect(isOldProcessingPlantAddress(sampleExportDataNew)).toBe(false)
    });

    it('should return false if address is in new format with no export data', () => {
      const sampleExportDataNew = null;

      expect(isOldProcessingPlantAddress(sampleExportDataNew)).toBe(false)
    });


    it('should return false if address is in new format with no plant name', () => {
      const sampleExportDataNew = {
      }
      // @ts-expect-error checking empty object
      expect(isOldProcessingPlantAddress(sampleExportDataNew)).toBe(false)
    });

    it('should return true if address is in old format', () => {
      const sampleExportDataOld = {
        ...sampleExportData,
        plantAddressOne: "London",
        plantAddressTwo: "London",
        plantTownCity: "London",
        plantPostcode: "SE37 6YH",
      }
      expect(isOldProcessingPlantAddress(sampleExportDataOld)).toBe(true)
    });
  });

  describe('clearOldProcessingPlantAddress', () => {
    it('should clear old Processing Plant address', () => {
      const sampleExportDataOld = {
        ...sampleExportData,
        plantAddressOne: "London",
        plantAddressTwo: "London",
        plantTownCity: "London",
        plantPostcode: "SE37 6YH",
      };

      const expectedExportData = {
        ...sampleExportData,
        plantAddressOne: "",
        plantTownCity: "",
        plantPostcode: "",
      }

      expect(clearOldProcessingPlantAddress(sampleExportDataOld)).toStrictEqual(expectedExportData)

    });
  })
})

describe('When mapping old and new Processing statement plant address to front end', () => {


  it('should return \'_plantDetailsUpdated=true\' with an old address processing plant format', () => {

    const exportData: any = {
      consignmentDescription: "code",
      plantName : 'My Name',
      plantAddressOne: 'plantAddressOne',
      plantAddressTwo: 'plantAddressTwo',
      plantTownCity: 'plantTownCity',
      plantPostcode : 'fake post code',
      exportedTo: {
        officialCountryName: "SPAIN"
      }
    };
    const result= toFrontEndProcessingStatementExportData(exportData);

    expect(result._plantDetailsUpdated).toBeTruthy();
    expect(result.plantPostcode).toBeNull();
    expect(result.plantAddressOne).toBeNull();
    expect(result.plantTownCity).toBeNull();
  });

  it('should return \'_plantDetailsUpdated = false\' with a new format address for processing plant', () => {

    const exportData: any = {
      consignmentDescription: "code",
      plantAddressOne: 'plantAddressOne',
      plantBuildingName: 'plantBuildingName',
      plantBuildingNumber: 'plantBuildingNumber',
      plantCountry: 'plantCountry',
      plantCounty: 'plantCounty',
      plantTownCity: 'plantTownCity',
      plantStreetName: 'plantStreetName',
      plantSubBuildingName: 'plantSubBuildingName',
      plantPostcode : 'fake post code',
      exportedTo: {
        officialCountryName: "SPAIN"
      }
    };
    const result= toFrontEndProcessingStatementExportData(exportData);

    expect(result._plantDetailsUpdated).toBeFalsy();
    expect(result.plantPostcode).toBeTruthy();
    expect(result.plantAddressOne).toBeTruthy();
    expect(result.plantTownCity).toBeTruthy();
    expect(result.plantBuildingName).toBeTruthy();
    expect(result.plantSubBuildingName).toBeTruthy();
    expect(result.plantStreetName).toBeTruthy();
  });

  it('should return the default \'_plantDetailsUpdated = false\' when the format of the address for processing plant is unknown whether old one or the newer', () => {

    const exportData: any = {
      consignmentDescription: "code",
      exportedTo: {
        officialCountryName: "SPAIN"
      }
    };
    const result= toFrontEndProcessingStatementExportData(exportData);

    expect(result._plantDetailsUpdated).toBeFalsy();
    expect(result.plantPostcode).toBeNull();
    expect(result.plantTownCity).toBeNull();
    expect(result.plantStreetName).toBeNull();
    expect(result.plantBuildingNumber).toBeNull();
    expect(result.plantSubBuildingName).toBeNull();
    expect(result.plantCountry).toBeNull();
    expect(result.plantCounty).toBeNull();
  });

})