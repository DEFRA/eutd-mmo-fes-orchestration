import * as Hapi from '@hapi/hapi';
import FishRoutes from "./fish";
import * as DocumentOwnershipValidator from "../validators/documentOwnershipValidator";
import * as FishValidator from "../validators/fish.validator";
import FishController from "../controllers/fish.controller";
import FavouritesController from "../controllers/favourites.controller";
import * as FavouritesService from "../persistence/services/favourites";
import { CannotReachError } from "../validators/validationErrors";
import { getMaxFavouritesError } from './favourites';
import applicationConfig from '../applicationConfig';

const createServerInstance = async () => {
  const server = Hapi.server();
  await server.register(require("@hapi/basic"));
  await server.register(require("hapi-auth-jwt2"));

  const fesApiValidate = async (
    _request: Hapi.Request,
    _username: string,
    _password: string
  ) => {
    const isValid = true;
    const credentials = { id: 'fesApi', name: 'fesApi' };
    return {isValid, credentials};
  };

  server.auth.strategy("fesApi", "basic", {
    validate: fesApiValidate,
  });

  server.auth.strategy("jwt", "jwt", {
    verify: (_decoded, _req) => {
      return { isValid: true };
    },
  });

  server.auth.default("jwt");

  return server;
};

describe('fish routes', () => {

  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const DOCUMENT_NUMBER = "DOCUMENT-NUMBER";

  let server;

  beforeAll(async ()=> {
    server = await createServerInstance();
    const routes = await new FishRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("POST /fish/add", () => {

    let mockValidateSpeciesName;
    let mockWithDocumentLegitimatelyOwned;
    let mockAddFish;
    let mockFishValidator;
    let mockRemoveInvalidFavourite;
    let mockCanAddFavourite;

    const mockReq: any = {
      method: "POST",
      url: "/v1/fish/add",
      headers: {
        documentnumber: DOCUMENT_NUMBER,
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      app: { claims: { sub: "test", email: "test@test.com" } },
      payload: {
        redirect: "/redirect-url/{documentNumber}/redirect",
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        state: "FRE",
        stateLabel: "Fresh",
        addToFavourites: true,
        species: "Atlantic cod",
      },
    };

    const document = {
      documentNumber: "GBR-2021-CC-3434343434"
    }

    beforeEach(() => {
      mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(document);

      mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
      mockValidateSpeciesName.mockResolvedValue({});

      mockAddFish = jest.spyOn(FishController, 'addFish');
      mockAddFish.mockResolvedValue({ some : 'data' });

      mockRemoveInvalidFavourite = jest.spyOn(FavouritesController, 'removeInvalidFavouriteProduct');
      mockRemoveInvalidFavourite.mockResolvedValue(undefined)

      mockCanAddFavourite = jest.spyOn(FavouritesService, 'canAddFavourite');
      mockCanAddFavourite.mockResolvedValue(true);

      mockFishValidator = jest.spyOn(FishValidator, 'validateSpeciesWithReferenceData');
      mockFishValidator.mockResolvedValue({
        isError: false,
        error: null
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return 400 Bad Request', async () => {
      const expected = JSON.stringify({
        redirect: 'error.redirect.any.required',
        species: 'error.species.any.required',
        state: 'error.state.any.required',
        presentation: 'error.presentation.any.required',
        commodity_code: 'error.commodity_code.any.required'
      });

      const request: any = {
        method: "POST",
        url: "/v1/fish/add",
        headers: {
          documentnumber: DOCUMENT_NUMBER,
          Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
        },
        app: { claims: { sub: "test", email: "test@test.com" } },
        payload: {},
      };

      const result = await server.inject(request);
      expect(result.statusCode).toBe(400);
      expect(result.payload).toEqual(expected);
      expect(mockAddFish).not.toHaveBeenCalled();
      expect(mockRemoveInvalidFavourite).not.toHaveBeenCalled();
    });

    it('should return 400 Bad Request (no product select)', async () => {
      const expected = JSON.stringify({
        product: 'error.favourite.any.required',
      });

      const result = await server.inject({ ...mockReq, payload: { isFavourite: true } });
      expect(result.statusCode).toBe(400);
      expect(result.payload).toEqual(expected);
      expect(mockAddFish).not.toHaveBeenCalled();
      expect(mockRemoveInvalidFavourite).not.toHaveBeenCalled();
    });

    it('should return 400 Bad request (invalid product selected)', async () => {
      const payload = {
        id: 'PRD123',
        redirect: '/create-catch-certificate/:documentNumber/what-are-you-exporting',
        species: 'Atlantic Cod (COD)',
        state: 'Fresh',
        presentation: 'Whole',
        commodity_code: '03302345',
        isFavourite: true
      };

      const error = new Error('some-error') as CannotReachError;
      error.details = [{
        path: ['species'],
        type: 'any.invalid',
        context: {
          key: ''
        },
        message: ''
      }];

      mockFishValidator.mockResolvedValue({
        isError: true,
        error: error
      });

      const expected = JSON.stringify({
        product: 'error.favourite.any.invalid',
      });

      const result = await server.inject({ ...mockReq, payload: payload});
      expect(result.statusCode).toBe(400);
      expect(result.payload).toEqual(expected);
      expect(mockRemoveInvalidFavourite).toHaveBeenCalledWith('test','PRD123');
    });

    it('should return 403 if document ownership fails', async () => {
      mockWithDocumentLegitimatelyOwned.mockResolvedValue(undefined);

      const response = await server.inject(mockReq);

      expect(mockWithDocumentLegitimatelyOwned).toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });

    it('should return 400 if the user is unable to add a favourite', async () => {
      mockCanAddFavourite.mockResolvedValue(false);
      const response = await server.inject(mockReq);

      expect(mockAddFish).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual(getMaxFavouritesError(applicationConfig._maximumFavouritesPerUser));
    });

    it('should call addFish and return its output if document ownership passes', async () => {
      const response = await server.inject(mockReq);

      expect(mockAddFish).toHaveBeenCalled();
      expect(response.result).toEqual({some:'data'});
      expect(response.statusCode).toBe(200);
    });

    it('should return 200 OK (product selected)', async () => {
      const response = await server.inject(mockReq);

      expect(mockAddFish).toHaveBeenCalled();
      expect(response.result).toEqual({some:'data'});
      expect(response.statusCode).toBe(200);
    });

    it('should return 500 Internal Error (product selected)', async () => {
      mockAddFish.mockRejectedValue(new Error('an error'));
      const response = await server.inject(mockReq);

      expect(mockAddFish).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
    });

    it('should no return an error if addToFavourites is no present', async () => {
      delete mockReq.payload.addToFavourites;
      const response = await server.inject(mockReq);

      expect(response.statusCode).toBe(200);
    });

    it('should return an error if addToFavourites is no boolean', async () => {
      const response = await server.inject({
        ...mockReq,
        payload: {
          ...mockReq.payload,
          addToFavourites: 'hello'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("PUT /fish/add/{productId}", () => {

    let mockValidateSpeciesName;
    let mockWithDocumentLegitimatelyOwned;
    let mockEditFish;
    let mockFishValidator;
    let mockCanAddFavourite;

    const mockReq: any = {
      method: "PUT",
      url: "/v1/fish/add/1",
      headers: {
        documentnumber: DOCUMENT_NUMBER,
        Authorization: "Basic ZmVzOmwyZmQyMGF0enl4MWE1anF3bW13bXBvODZuOWZjeHA0OHF4bXEwbW5ybWF6c25vdmcxaDd4dWFldXk1bTUxNHp4OGd3MGoycmp4a3MzOGtyNTFoaWg5Z3liaDNpbDMzdW1lYzBlNDJlbDgzeGZvZHZtOXF6ZmJ3YTVkNHN4aTkz",
      },
      app: { claims: { sub: "test", email: "test@test.com" } },
      payload: {
        id: '1',
        redirect: "/redirect-url/{documentNumber}/redirect",
        dashboardUri: "/test-url/dashboardUri",
        currentUri: "/test-url/currentUri",
        nextUri: "/test-url/nextUri",
        user_id: USER_ID,
        commodity_code: "commodity-code",
        commodity_code_description: "commodity-code-description",
        presentation: "WHO",
        presentationLabel: "Whole",
        state: "FRE",
        stateLabel: "Fresh",
        addToFavourites: true,
        species: "Atlantic cod",
      },
    };

    beforeEach(() => {
      mockWithDocumentLegitimatelyOwned = jest.spyOn(DocumentOwnershipValidator, 'validateDocumentOwnership');
      mockWithDocumentLegitimatelyOwned.mockResolvedValue({ documentNumber: 'GBR-2021-CC-3434343434' });

      mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');
      mockValidateSpeciesName.mockResolvedValue({});

      mockEditFish = jest.spyOn(FishController, 'editFish');
      mockEditFish.mockResolvedValue({ some : 'data' });

      mockCanAddFavourite = jest.spyOn(FavouritesService, 'canAddFavourite');
      mockCanAddFavourite.mockResolvedValue(true);

      mockFishValidator = jest.spyOn(FishValidator, 'validateSpeciesWithReferenceData');
      mockFishValidator.mockResolvedValue({
        isError: false,
        error: null
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return 400 if the user is unable to add a favourite', async () => {
      mockCanAddFavourite.mockResolvedValue(false);
      const response = await server.inject(mockReq);

      expect(mockEditFish).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.result).toEqual(getMaxFavouritesError(applicationConfig._maximumFavouritesPerUser));
    });

  });

});