import * as Hapi from "@hapi/hapi";
import FavouritesRoutes from "./favourites";
import FavouritesController from "../controllers/favourites.controller";
import logger from "../logger";
import { IProduct } from "../persistence/schema/userAttributes";
import * as FishValidator from "../validators/fish.validator";



describe("favourites routes", () => {
  const server = Hapi.server();

  let mockAddFavourites;
  let mockValidateSpeciesWithReferenceData;
  let mockValidateSpeciesName;

  beforeAll(async () => {
    const routes = await new FavouritesRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();

    mockAddFavourites = jest.spyOn(FavouritesController, "addFavourites");
    mockValidateSpeciesWithReferenceData = jest.spyOn(FishValidator, 'validateSpeciesWithReferenceData');
    mockValidateSpeciesName = jest.spyOn(FishValidator, 'validateSpeciesName');

  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSpeciesWithReferenceData.mockResolvedValue({ isError: false, error: null });
    mockValidateSpeciesName.mockResolvedValue({ isError: false, error: null });
    mockAddFavourites.mockResolvedValue([{ some: 'data' }]);
  });

  describe("POST /favourites", () => {
    const request: any = {
      method: "POST",
      url: "/v1/favourites",
      app: {
        claims: {
          sub: "Bob",
        },
      },
    };

    describe("with a valid payload", () => {
      const payload = {
        species: "Atlantic COD",
        speciesCode: "COD",
        scientificName: "THE COD",
        state: "FRE",
        stateLabel: "Fresh",
        presentation: "HED",
        presentationLabel: "Headed",
        commodity_code: "21294949045",
        commodity_code_description: "many letters here"
      };


      it("should call Favourites addFavourites method", async () => {
        await server.inject({ ...request, payload: { ...payload } });
        expect(mockAddFavourites).toHaveBeenCalledTimes(1);
      });

      it("should response 500 error code if an error occurred", async () => {
        mockAddFavourites.mockResolvedValue(new Error("this is an error"));

        const response = await server.inject({ ...request, payload });
        expect(response.statusCode).toBe(500);
      });

      it("should add and return favourites array", async () => {
        const response = await server.inject({ ...request, payload: { ...payload } });
        expect(response.result).toEqual([{ some: 'data' }]);
        expect(response.statusCode).toBe(200);
      });

    });

    describe("with a invalid payload", () => {
      let response;

      beforeAll(async () => {
        response = await server.inject({ ...request, payload: {} });
      });

      it("will return 400 bad request", async () => {
        expect(response.statusCode).toBe(400);
      });

      it("will return a error payload", async () => {
        expect(JSON.parse(response.payload)).toEqual({
          commodity_code: "error.commodity_code.any.required",
          presentation: "error.presentation.any.required",
          species: "error.species.any.required",
          state: "error.state.any.required",
        });
        expect(mockValidateSpeciesName).not.toHaveBeenCalled();
        expect(mockValidateSpeciesWithReferenceData).not.toHaveBeenCalled();
      });
    });

    describe("with emoji in commodity_code_description", () => {
      const payload = {
        species: "Atlantic COD",
        speciesCode: "COD",
        scientificName: "THE COD",
        state: "FRE",
        stateLabel: "Fresh",
        presentation: "HED",
        presentationLabel: "Headed",
        commodity_code: "21294949045",
        commodity_code_description: "many letters 😀 here"
      };

      it("will return 400 bad request when commodity_code_description contains emoji", async () => {
        const response = await server.inject({ ...request, payload: { ...payload } });
        expect(response.statusCode).toBe(400);
      });

      it("will return string.emoji error for commodity_code_description", async () => {
        const response = await server.inject({ ...request, payload: { ...payload } });
        expect(JSON.parse(response.payload)).toEqual({
          commodity_code_description: "error.commodity_code_description.string.emoji",
        });
      });
    });

    describe('with valid species but empty state/presentation/commodity_code', () => {
      it('should not return a species error (regression guard)', async () => {
        mockValidateSpeciesName.mockResolvedValue({ isError: false, error: null });
        const response = await server.inject({
          ...request,
          payload: { species: 'Atlantic cod (COD)', speciesCode: 'COD', scientificName: 'Gadus morhua',
                     state: '', stateLabel: '', presentation: '', presentationLabel: '', commodity_code: '' }
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body).not.toHaveProperty('species');
        expect(body).toHaveProperty('state');
        expect(body).toHaveProperty('presentation');
        expect(body).toHaveProperty('commodity_code');
        expect(mockValidateSpeciesName).toHaveBeenCalledTimes(1);
        expect(mockValidateSpeciesWithReferenceData).not.toHaveBeenCalled();
      });
    });

    describe('with invalid species and empty other fields', () => {
      it('should return species error as the first key', async () => {
        const speciesErr: any = new Error('invalid');
        speciesErr.details = [{ path: ['species'], type: 'any.invalid', context: { key: 'species' }, message: 'error.species.any.invalid' }];
        mockValidateSpeciesName.mockResolvedValue({ isError: true, error: speciesErr });
        const response = await server.inject({
          ...request,
          payload: { species: 'aaaaaaaaa', speciesCode: '', scientificName: '', state: '', presentation: '', commodity_code: '' }
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload) as Record<string, string>;
        expect(Object.keys(body)[0]).toBe('species');
        expect(body).toHaveProperty('state');
        expect(body).toHaveProperty('presentation');
        expect(body).toHaveProperty('commodity_code');
        expect(mockValidateSpeciesName).toHaveBeenCalledTimes(1);
        expect(mockValidateSpeciesWithReferenceData).not.toHaveBeenCalled();
      });
    });

    describe('with all fields valid', () => {
      it('should call validateSpeciesWithReferenceData and not validateSpeciesName', async () => {
        const response = await server.inject({
          ...request,
          payload: { species: 'Atlantic COD', speciesCode: 'COD', scientificName: 'THE COD',
                     state: 'FRE', stateLabel: 'Fresh', presentation: 'HED', presentationLabel: 'Headed',
                     commodity_code: '21294949045', commodity_code_description: 'many letters here' }
        });
        expect(response.statusCode).toBe(200);
        expect(mockValidateSpeciesWithReferenceData).toHaveBeenCalledTimes(1);
        expect(mockValidateSpeciesName).not.toHaveBeenCalled();
      });

      it('should return species error when reference data validator fails', async () => {
        const speciesErr: any = new Error('invalid');
        speciesErr.details = [{ path: ['species'], type: 'any.invalid', context: { key: 'species' }, message: 'error.species.any.invalid' }];
        mockValidateSpeciesWithReferenceData.mockResolvedValue({ isError: true, error: speciesErr });
        const response = await server.inject({
          ...request,
          payload: { species: 'Atlantic COD', speciesCode: 'COD', scientificName: 'THE COD',
                     state: 'FRE', stateLabel: 'Fresh', presentation: 'HED', presentationLabel: 'Headed',
                     commodity_code: '21294949045', commodity_code_description: '' }
        });
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toHaveProperty('species');
        expect(mockValidateSpeciesWithReferenceData).toHaveBeenCalledTimes(1);
        expect(mockValidateSpeciesName).not.toHaveBeenCalled();
      });
    });
  });

  describe("GET /favourites", () => {

    const favourites: IProduct[] =  [{
      "id": "PRD942",
      "species": "Atlantic COD",
      "speciesCode": "COD",
      "scientificName": "THE COD",
      "state": "FRE",
      "stateLabel": "Fresh",
      "presentation": "HED",
      "presentationLabel": "Headed",
      "commodity_code": "21294949045",
      "commodity_code_description": "many letters here"
      }, {
      "species": "Atlantic COD 1",
      "speciesCode": "COD01",
      "scientificName": "THE COD 1",
      "state": "FRE",
      "stateLabel": "Fresh",
      "presentation": "HED",
      "presentationLabel": "Headed",
      "commodity_code": "21294949045",
      "commodity_code_description": "many letters here",
      "id": "PRD324"
      }];

    let response;
    let mockLoggerError;
    let mockGetFavourites;

    beforeEach(() => {
      mockGetFavourites = jest.spyOn(FavouritesController, 'getFavourites');
      mockGetFavourites.mockResolvedValue(favourites);
      mockLoggerError = jest.spyOn(logger, 'error');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fail if path is not correct', async () => {
      const _request = {
        method: 'GET',
        url: '/v1/blah',
        app: {
          claims: {
            sub: ''
          }
        }
      };

      response = await server.inject(_request);
      expect(response.statusCode).toBe(404);
    });

    it('will return 200 request', async () => {
      const _request = {
        method: 'GET',
        url: '/v1/favourites',
        app: {
          claims: {
            sub: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
          }
        }
      };

      response = await server.inject(_request);

      expect(response.statusCode).toBe(200);
      expect(mockGetFavourites).toHaveBeenCalled();
      expect(JSON.parse(response.payload)).toHaveLength(2);
    });

    it('will return 500 if an error occurs', async () => {
      const error = new Error('error');
      const _request = {
        method: 'GET',
        url: '/v1/favourites',
        app: {
          claims: {
            sub: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
          }
        }
      };

      mockGetFavourites.mockRejectedValue(error);

      const response = await server.inject(_request);
      expect(mockLoggerError).toHaveBeenCalledWith(`[FAVOURITES-PRODUCTS][ERROR][${error.stack}]`);
      expect(response.statusCode).toBe(500);
    });

    it('should call controller method', async () => {
      const _request = {
        method: 'GET',
        url: '/v1/favourites',
        app: {
          claims: {
            sub: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12'
          }
        }
      };

      const response = await server.inject(_request);

      expect(mockGetFavourites).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });
  });

  describe('DELETE /favorites', () => {

    const request: any = {
      method: 'DELETE',
      url: '/v1/favourites/PRD0123',
      app: {
        claims: {
          sub: 'Bob'
        }
      }
    };

    let mockdeleteFavouritesProduct;

    beforeEach(()=>{
      mockdeleteFavouritesProduct = jest.spyOn(FavouritesController, 'deleteFavouritesProduct');
    });

    afterEach(()=>{
      jest.restoreAllMocks();
    });

    it('should call deleteFavouritesProduct once', async () => {
      mockdeleteFavouritesProduct.mockResolvedValue(null);
      await server.inject({ ...request});
      expect(mockdeleteFavouritesProduct).toHaveBeenCalledTimes(1);
    });

    it("should response 500 error code if an error occurred", async () => {
      mockdeleteFavouritesProduct.mockResolvedValue(new Error("this is an error"));
      const response = await server.inject({ ...request});
      expect(response.statusCode).toBe(500);
    });


    it('should return deleteFavouritesProduct output', async () => {
      mockdeleteFavouritesProduct.mockResolvedValue({some:'data'});
      const response = await server.inject({ ...request});
      expect(response.result).toEqual({some:'data'});
      expect(response.statusCode).toBe(200);
    });

  });

});
