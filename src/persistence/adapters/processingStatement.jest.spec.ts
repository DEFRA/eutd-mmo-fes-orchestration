import { ProcessingStatement } from "../schema/processingStatement";

import {
  mapToPersistableSchema,
  ProcessingStmtTransientData,
} from "./processingStatement";

describe("mapToPersistableSchema", () => {
  it("should return mapped data", () => {
    const dataToPersist: ProcessingStmtTransientData = {
      catches: [],
      exporter: {
        accountId: "account-id",
        addressOne: "address-one",
        addressTwo: "address-two",
        contactId: "contact-id",
        exporterCompanyName: "exporter-company-name",
        postcode: "post-code",
        townCity: "town-city",
        _dynamicsAddress: "dynamics-address",
        _dynamicsUser: "dynamics-user",
      },
      documentNumber: "document-number",
      status: "status",
      user: {
        principal: "user-principal",
        email: "user@email.com",
      },
      consignmentDescription: "consignment-description",
      healthCertificateNumber: "health-certificate-number",
      healthCertificateDate: "01/01/1990",
      personResponsibleForConsignment: "person-responsible-for-consignment",
      plantApprovalNumber: "plant-approval-number",
      plantName: "plant-name",
      plantAddressOne: "plant-address-one",
      plantBuildingName: "plantBuildingName",
      plantBuildingNumber: "plantBuildingNumber",
      plantSubBuildingName: "plantSubBuildingName",
      plantStreetName: "plantStreetName",
      plantCountry: "plantCountry",
      plantCounty: "plantCounty",
      plantTownCity: "plant-town-city",
      plantPostcode: "plant-post-code",
      dateOfAcceptance: "01/01/2000",
      documentUri: "document-uri",
    };

    const result = mapToPersistableSchema(dataToPersist);

    const expectedResult: ProcessingStatement = {
      createdBy: "user-principal",
      createdByEmail: "user@email.com",
      documentNumber: "document-number",
      documentUri: "document-uri",
      exportData: {
        catches: [],
        consignmentDescription: "consignment-description",
        dateOfAcceptance: "01/01/2000",
        exporterDetails: {
          accountId: "account-id",
          addressOne: "address-one",
          addressTwo: "address-two",
          contactId: "contact-id",
          exporterCompanyName: "exporter-company-name",
          postcode: "post-code",
          townCity: "town-city",
          _dynamicsAddress: "dynamics-address",
          _dynamicsUser: "dynamics-user",
        },
        healthCertificateDate: "01/01/1990",
        healthCertificateNumber: "health-certificate-number",
        personResponsibleForConsignment: "person-responsible-for-consignment",
        plantAddressOne: "plant-address-one",
        plantBuildingName: "plantBuildingName",
        plantBuildingNumber: "plantBuildingNumber",
        plantSubBuildingName: "plantSubBuildingName",
        plantStreetName: "plantStreetName",
        plantCountry: "plantCountry",
        plantCounty: "plantCounty",
        plantApprovalNumber: "plant-approval-number",
        plantName: "plant-name",
        plantPostcode: "plant-post-code",
        plantTownCity: "plant-town-city",
      },
      status: "status",
    } as ProcessingStatement;
    expect(result).toEqual(expect.objectContaining(expectedResult));
  });
});
