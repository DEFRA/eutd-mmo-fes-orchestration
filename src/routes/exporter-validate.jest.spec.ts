import * as Hapi from '@hapi/hapi';
import * as DocumentOwnershipValidator from '../validators/documentOwnershipValidator';
import * as CountriesValidater from '../validators/countries.validator';
import * as ErrorExtractor from '../helpers/errorExtractor';
import Controller from '../controllers/exporter.controller';
import ExporterValidateRoutes from './exporter-validate';
import logger from '../logger';
import applicationConfig from '../applicationConfig';

jest.mock('url-parse', () => {
  return () => {
    return {
      set: () => {},
      toString: () => ''
    }
  }
})

describe('exporter validate routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    applicationConfig._disableAuth = true;
    const routes = await new ExporterValidateRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  })

  describe('POST /v1/exporter-validate', () => {
    const documentNumber = "GBR-2021-CC-1";

    const request: any = {
      method: "POST",
      url: "/v1/exporter-validate",
      headers: {
        documentnumber: documentNumber,
      },
      app: {
        claims: {
          sub: 'Bob'
        }
      },
      payload: {
        subBuildingName: "MMO",
        buildingNumber: "12",
        buildingName: "LANCASTER HOUSE",
        streetName: "HAMPSHIRE COURT",
        townCity: "NEWCASTLE UPON TYNE",
        county: "TYNESIDE",
        postcode: "NE4 7YH",
        country: "England"
      },
    };

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    }

    let mockWithDocumentLegitimatelyOwned;
    let mockLoggerError;
    let mockValidateCountriesName;
    let mockBuildErrorObject;
    let mockAddExporterDetails;

    beforeEach(() => {
      mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(document);

      mockLoggerError = jest.spyOn(logger, 'error');
      mockBuildErrorObject = jest.spyOn(ErrorExtractor, 'default');
      mockValidateCountriesName = jest.spyOn(CountriesValidater, 'validateCountriesName');
      mockValidateCountriesName.mockResolvedValue({
        error: false
      });

      mockAddExporterDetails = jest.spyOn(Controller, 'addExporterDetails');
      mockAddExporterDetails.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockWithDocumentLegitimatelyOwned.mockRestore();
      mockValidateCountriesName.mockRestore();
      mockBuildErrorObject.mockRestore();
      mockLoggerError.mockRestore();
      mockAddExporterDetails.mockResolvedValue();
    });

    it('should return 403 if document ownership fails', async () => {
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(undefined);

      const response = await server.inject(request);

      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it('should return 200 if document ownership passes', async () => {
      const response = await server.inject(request);

      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should return 200 with a valid country', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          subBuildingName: "MMO",
          buildingNumber: "12",
          buildingName: "LANCASTER HOUSE",
          streetName: "HAMPSHIRE COURT",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
          country: "England"
        },
      });

      const expectedResponse = {
        subBuildingName: 'MMO',
        buildingNumber: '12',
        buildingName: 'LANCASTER HOUSE',
        streetName: 'HAMPSHIRE COURT',
        townCity: 'NEWCASTLE UPON TYNE',
        county: 'TYNESIDE',
        postcode: 'NE4 7YH',
        country: 'England',
        addressOne: '12, MMO, LANCASTER HOUSE, HAMPSHIRE COURT'
      };

      expect(mockAddExporterDetails).toHaveBeenCalled();
      expect(mockValidateCountriesName).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(expectedResponse);
    });

    it('should return 400 when country is not specified', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          subBuildingName: "MMO",
          buildingNumber: "12",
          buildingName: "LANCASTER HOUSE",
          streetName: "HAMPSHIRE COURT",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
        },
      });

      const expectedResponse = { country: 'error.country.any.required' };

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual(expectedResponse);
    });

    it('should return 400 when country is invalid', async () => {
      mockValidateCountriesName.mockResolvedValue({
        isError: true,
        error: new Error('some-error')
      });
      mockBuildErrorObject.mockReturnValue({
        country: 'error.country.any.invalid'
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          subBuildingName: "MMO",
          buildingNumber: "12",
          buildingName: "LANCASTER HOUSE",
          streetName: "HAMPSHIRE COURT",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
          country: 'Invalid country name'
        },
      });

      const expectedResponse = { country: 'error.country.any.invalid' };

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockValidateCountriesName).toHaveBeenCalledWith({ officialCountryName: 'Invalid country name' }, '', 'country');
      expect(mockLoggerError).toHaveBeenCalledWith('[EXPORTER-VALIDATE][ERROR][INVALID-COUNTRY][Invalid country name]');
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual(expectedResponse);
    });

    it('should return the correct payload with the addressOne created', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          subBuildingName: "MMO",
          buildingNumber: "12",
          buildingName: "LANCASTER HOUSE",
          streetName: "HAMPSHIRE COURT",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
          country: "England"
        },
      });
      const expectedResult = {
        addressOne: "12, MMO, LANCASTER HOUSE, HAMPSHIRE COURT",
        subBuildingName: "MMO",
          buildingNumber: "12",
          buildingName: "LANCASTER HOUSE",
          streetName: "HAMPSHIRE COURT",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
          country: "England"
      }

      expect(mockAddExporterDetails).toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual(expectedResult);
    });

    it('should return 400 when subBuildingName, buildingNumber, buildingName, and streetName are all empty', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: "Bob",
          },
        },
        payload: {
          subBuildingName: "",
          buildingNumber: "",
          buildingName: "",
          streetName: "",
          townCity: "NEWCASTLE UPON TYNE",
          county: "TYNESIDE",
          postcode: "NE4 7YH",
          country: "England"
        },
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if documentNumber is not given in payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/exporter-validate',
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        }
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if postCode is not in the correct format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/exporter-validate',
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: 'SE16/5HL',
          subBuildingName: "12",
          buildingNumber: "2",
          streetName: "12",
          buildingName: "12",
          townCity: "12",
          county: "12",
          country: "12",
        }
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if postCode is more than 8 characters', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/exporter-validate',
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: 'SE16 5HLHU',
          subBuildingName: "12",
          buildingNumber: "2",
          streetName: "12",
          buildingName: "12",
          townCity: "12",
          county: "12",
          country: "12",
        }
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if townCity is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/exporter-validate',
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: 'SE16 5HL',
          buildingNumber: "2",
          streetName: "12",
          buildingName: "12",
          county: "Kent",
          country: "United Kingdom",
        }
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if country name is more than 40 characters', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/exporter-validate',
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: 'SE16 5HL',
          buildingNumber: "2",
          streetName: "12",
          buildingName: "12",
          county: "Kent",
          country: "United Kingdom shdasdbjhsadjhasgdsadbnasbdmnassadjhsdjsahmdnasbmndabsndabsndm",
        }
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if streetName contains invalid characters', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: "SE16 5HL",
          buildingNumber: "2",
          streetName: "12^&*",
          buildingName: "12",
          townCity: "Blah",
          county: "Kent",
          country: "United Kingdom",
        },
      });

      expect(mockAddExporterDetails).not.toHaveBeenCalled();
      expect(mockWithDocumentLegitimatelyOwned).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    });

    it('should return 200 if subBuildingName, building name, town, county and streetName contain apostrophes, hyphens, periods, commas, spaces, ampersands, exclamation marks and forward slashes', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: "SE16 5HL",
          buildingNumber: "2",
          subBuildingName: "Dora's-., &!/",
          streetName: "123's  street-., &!/",
          buildingName: "123's name-., &!/",
          townCity: "123's 1234-., &!/",
          county: "123's county-., &!/",
          country: "United Kingdom",
        },
      });

      expect(mockAddExporterDetails).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should return 200 if subBuildingName or streetName contain brackets', async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/exporter-validate",
        headers: {
          documentnumber: documentNumber,
        },
        app: {
          claims: {
            sub: 'Bob'
          }
        },
        payload: {
          postcode: "SE16 5HL",
          buildingNumber: "2",
          subBuildingName: "Dora's-., &!/ (UK)",
          streetName: "123's  street-., &!/ (HU)",
          buildingName: "123's name-., &!/",
          townCity: "123's 1234-., &!/",
          county: "123's county-., &!/",
          country: "United Kingdom",
        },
      });

      expect(mockAddExporterDetails).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });
  });
});
