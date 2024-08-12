import * as BackEndProcessingStatement from "../processingStatement";
import * as FrontEndProcessingStatement from "./processingStatement";
import { Exporter } from "./exporterDetails";
import { DocumentNumber } from "./documentNumber";
import * as moment from 'moment';

describe('toBackEndProcessingStatement mapping Processing Statement front end to back end', () => {

  it('should return a valid processing statement catch data object', () => {
    const expected : BackEndProcessingStatement.Catch[] = [{
      species: "Species Name ",
      speciesCode: "some code",
      id: 'Cert Number-' + moment.utc().unix() + '-0',
      catchCertificateNumber: "Cert Number",
      catchCertificateType: undefined,
      totalWeightLanded: "totalWeightLanded",
      exportWeightBeforeProcessing: "11",
      exportWeightAfterProcessing: "9",
      scientificName: "some scientific name"
    }];

    const catches : FrontEndProcessingStatement.Catch[] = [{
      species: "Species Name ",
      speciesCode: "some code",
      id: 'Cert Number-' + moment.utc().unix() + '-0',
      catchCertificateNumber: "Cert Number",
      totalWeightLanded: "totalWeightLanded",
      exportWeightBeforeProcessing: "11",
      exportWeightAfterProcessing: "9",
      scientificName : "some scientific name"
    }];

    const result = FrontEndProcessingStatement.toBackEndCatchProcessingStatement(catches);
    expect(result).toStrictEqual(expected);
  });

  it('should not save an id with an undefined catch certificate number', () => {
    const expected : BackEndProcessingStatement.Catch[] = [{
      catchCertificateNumber: undefined,
      catchCertificateType: "uk",
      exportWeightAfterProcessing: undefined,
      exportWeightBeforeProcessing: undefined,
      id: undefined,
      scientificName: undefined,
      species: undefined,
      speciesCode: undefined,
      totalWeightLanded: undefined,
    }];

    const catches : FrontEndProcessingStatement.Catch[] = [{
      catchCertificateType: "uk",
    }];

    const result = FrontEndProcessingStatement.toBackEndCatchProcessingStatement(catches);
    expect(result).toStrictEqual(expected);
  });

  it('should return a valid back end processing statement', () => {
    const expected: BackEndProcessingStatement.ProcessingStatement = {
      createdAt: "10 Feb 2020",
      createdBy: "User Id to be done",
      createdByEmail: "User email to be done",
      documentNumber: "GBR-2020-PS-3CA09BE17",
      status: "DRAFT",
      documentUri: "",
      requestByAdmin: false,
      draftData: {},
      exportData: {
        catches: [
          {
            species: "Atlantic herring (HER)",
            speciesCode: "HER",
            id: "12345-" + moment.utc().unix() + '-0',
            catchCertificateNumber: "12345",
            catchCertificateType: undefined,
            totalWeightLanded: "34",
            exportWeightBeforeProcessing: "34",
            exportWeightAfterProcessing: "45",
            scientificName: "some scientific name",
          },
        ],
        exporterDetails: {
          contactId: "a contact Id",
          accountId: "an account id",
          exporterCompanyName: "Exporter Fish Ltd",
          addressOne: "London",
          buildingNumber: "123",
          subBuildingName: "Unit 1",
          buildingName: "CJC Fish Ltd",
          streetName: "17  Old Edinburgh Road",
          county: "West Midlands",
          country: "England",
          townCity: "London",
          postcode: "SE37 6YH",
          _dynamicsAddress: {},
          _dynamicsUser: {
            firstName: "John",
            lastName: "Doe",
          },
        },
        products: [{
          commodityCode: '03023190',
          description: 'Fresh or chilled albacore',
          id: 'GBR-2020-PS-3CA09BE17-' + moment.utc().unix(),
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
          isoNumericCode: "SP",
        },
      },
      audit: [],
      userReference: "Exporter Reference",
    };

    const userReference: string = "Exporter Reference";
    const requestByAdmin: boolean = false;

    const documentNumber: DocumentNumber = {
      "documentNumber": "GBR-2020-PS-3CA09BE17",
      "status": "DRAFT",
      "startedAt": "10 Feb 2020"
    };

    const exportDetails: Exporter = {
      model: {
        contactId: "a contact Id",
        accountId: "an account id",
        exporterCompanyName: "Exporter Fish Ltd",
        addressOne: "London",
        buildingNumber: "123",
        subBuildingName: "Unit 1",
        buildingName: "CJC Fish Ltd",
        streetName: "17  Old Edinburgh Road",
        county: "West Midlands",
        country: "England",
        townCity: "London",
        postcode: "SE37 6YH",
        _dynamicsAddress: {},
        _dynamicsUser: {
          firstName: "John",
          lastName: "Doe",
        },
        journey: "processingStatement",
        currentUri: "/create-processing-statement/add-exporter-details",
        nextUri: "/create-processing-statement/add-consignment-details",
        user_id: "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
      },
    };

    const catchDetails: FrontEndProcessingStatement.Catch[] = [{
      species: "Atlantic herring (HER)",
      speciesCode: "HER",
      id: '12345-' + moment.utc().unix() + '-0',
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "34",
      exportWeightAfterProcessing: "45",
      scientificName : "some scientific name"
    }];

    const processingStatement: FrontEndProcessingStatement.ProcessingStatement = {
      catches: catchDetails,
      validationErrors: [{}],
      consignmentDescription: "Commodity code",
      products: [{
        commodityCode: '03023190',
        description: 'Fresh or chilled albacore'
      }],
      error: "",
      addAnotherCatch: "No",
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
      healthCertificateNumber: "45645",
      healthCertificateDate: "27/10/2019",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    }

    const result = FrontEndProcessingStatement.toBackEndProcessingStatement(
      documentNumber,
      processingStatement,
      exportDetails,
      userReference,
      requestByAdmin
      );

    expect(result).toStrictEqual(expected);
  });
});

describe('toBackEndProcessingStatementExportData', () => {
  it('should work with minimal viable data', () => {
    const expected : BackEndProcessingStatement.ExportData = {
      "consignmentDescription": "Commodity code",
      "catches": [],
      plantPostcode : 'fake post code',
      exportedTo : {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const processingStatement: FrontEndProcessingStatement.ProcessingStatement = {
      catches: [],
      consignmentDescription: "Commodity code",
      plantPostcode : 'fake post code',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      error: ""
    };

    const result = FrontEndProcessingStatement.toBackEndProcessingStatementExportData(processingStatement, null, 'some-document-number');

    expect(result).toStrictEqual(expected);
  });
});

describe('toFrontEndProcessing mapping Processing Statement front end to back end', () => {
  it('should return a valid processing statement catch data object', () => {
    const expected : FrontEndProcessingStatement.Catch[] = [{
      species: "Atlantic herring (HER)",
      id: '12345-' + moment.utc().unix(),
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "45",
      exportWeightAfterProcessing: "34",
      scientificName: 'scientificName'
    }];

    const catches : BackEndProcessingStatement.Catch[] = [{
      species: "Atlantic herring (HER)",
      id: '12345-' + moment.utc().unix(),
      catchCertificateNumber: "12345",
      totalWeightLanded: "34",
      exportWeightBeforeProcessing: "45",
      exportWeightAfterProcessing: "34",
      scientificName: 'scientificName'
    }];

    const result = BackEndProcessingStatement.toFrontEndCatchProcessingStatement(catches);

    expect(result).toStrictEqual(expected);
  });
})
