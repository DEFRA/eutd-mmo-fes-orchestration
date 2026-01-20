import * as Hapi from "@hapi/hapi";
// import { mock } from 'ts-mockito';
import * as DocOwnerShipValidator from "../validators/documentOwnershipValidator"
import { withDocumentLegitimatelyOwned } from "./withDocumentLegitimatelyOwned";
import { DocumentStatuses } from '../persistence/schema/catchCert';

describe("When making a request that requires checking if a document is legitimately owned by a user", () => {

  const h = {
    response: () => {
      function code(httpCode) {
        return httpCode
      }
      return { code: code }
    }
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  const document = {
    documentNumber: "GBR-2021-CC-34343434"
  }

  let validator;

  beforeAll(() => {
    validator = jest.spyOn(DocOwnerShipValidator, 'validateDocumentOwnership');
  });

  afterEach(() => {
    validator.mockReset();
  });

  const req: any = {
    headers: {
      documentnumber: 'gbr-2020-01-3432-2343',
      referer:
        'https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details',
    },
    app: { claims: { sub: { userPrincipal: 'tes' }, contactId: 'test' } },
    params: {},
  };

  it("will continue as normal if validation is passed", async () => {
    validator.mockReturnValue(document);

    req.headers = {
      documentnumber: 'GBR-2020-01-3432-2343',
      referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details"
    };

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("will uppercase doc number", async () => {
    validator.mockReturnValue(document);

    req.headers = {
      documentnumber: 'gbr-2020-01-3432-2343',
      referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details"
    };

    await withDocumentLegitimatelyOwned(req, h,(userPrincipal, documentNumber) => {
      expect(documentNumber).toEqual('GBR-2020-01-3432-2343')
    });
  });

  it("will validate against DRAFT documents when no status is provided", async () => {
    validator.mockReturnValue(document);

    await withDocumentLegitimatelyOwned(req, h,() => {
      expect(validator).toHaveBeenCalledWith({ userPrincipal: "tes"}, 'GBR-2020-01-3432-2343', ['DRAFT'], 'test');
    });
  });

  it("will validate against DRAFT documents when an invalid status is provided", async () => {
    validator.mockReturnValue(document);

    await withDocumentLegitimatelyOwned({
      headers : {
        documentnumber: 'gbr-2020-01-3432-2343',
        status: 'INVALID STATUS',
        referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details"
      },
      app : {claims: {sub: { userPrincipal: "tes"}, contactId: 'tes'}},
      params : {}
    } as unknown as Hapi.Request<Hapi.ReqRefDefaults>, h,() => {
      expect(validator).toHaveBeenCalledWith({ userPrincipal: "tes"}, 'GBR-2020-01-3432-2343', ['DRAFT'], 'tes');
    });
  });

  it("will validate against LOCKED documents when a status of LOCKED is provided", async () => {
    validator.mockReturnValue(document);

    await withDocumentLegitimatelyOwned(req, h,() => {
      expect(validator).toHaveBeenCalledWith({ userPrincipal: "tes"}, 'GBR-2020-01-3432-2343', ['LOCKED'], 'test');
    }, [DocumentStatuses.Locked]);
  });

  it("will validate against DRAFT and LOCKED documents when a statuses of DRAFT and LOCKED are provided", async () => {
    validator.mockReturnValue(document);

    await withDocumentLegitimatelyOwned(req, h,() => {
      expect(validator).toHaveBeenCalledWith({ userPrincipal: "tes"}, 'GBR-2020-01-3432-2343', ['DRAFT', 'LOCKED'], 'test');
    }, [DocumentStatuses.Draft, DocumentStatuses.Locked]);
  });

  it("will validate against COMPLETE documents when a status of COMPLETE is provided", async () => {
    validator.mockReturnValue(document);

    await withDocumentLegitimatelyOwned(req, h,() => {
      expect(validator).toHaveBeenCalledWith({ userPrincipal: "tes"}, 'GBR-2020-01-3432-2343', ['COMPLETE'], 'test');
    }, [DocumentStatuses.Complete]);
  });

  it("will continue as normal if journey is for SD", async () => {
    validator.mockReturnValue(document);
    req.headers = { documentnumber: 'test', referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details" };
    req.params = { journey: 'storageNote'};

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("will continue as normal if journey is for PS", async () => {
    validator.mockReturnValue(document);
    req.headers = { documentnumber: 'test', referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details" };
    req.params = { journey: 'processingStatement'};

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("if there is no referer it will continue as normal", async () => {
    validator.mockReturnValue(document);
    req.headers = { documentnumber: 'test', referer: undefined };
    req.params = { journey: 'processingStatement'};

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("if no document number it will run as normal", async () => {
    validator.mockReturnValue(document);
    req.params = { journey: 'catchCertificate' };

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("if no UserPrincipal it will run as normal", async () => {
    validator.mockReturnValue(document);
    req.headers = { documentnumber: 'test', referer: undefined };
    req.app.claims.sub = { userPrincipal: undefined};
    req.app.claims.contactId = 'test';

    const result = await withDocumentLegitimatelyOwned(req, h, () => true);

    expect(result).toBe(true);
  });

  it("will return FORBIDDEN if we fail validation", async () => {
    validator.mockReturnValue(undefined);
    req.headers = { documentnumber: 'GBR-test-document' , referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details"};
    req.params = { journey: 'catchCertificate'};

    const result = await withDocumentLegitimatelyOwned(req, h,() => true);

    expect(result).toBe(403);
  });

  it("will return NOT FOUND if we fail validation", async () => {
    validator.mockReturnValue(null);
    req.headers = { documentnumber: 'GBR-test-document' , referer: "https://ukecc-tst.azure.defra.cloud/create-non-manipulation-document/add-exporter-details"};
    req.params = { journey: 'catchCertificate'};

    const result = await withDocumentLegitimatelyOwned(req, h,() => true);

    expect(result).toBe(404);
  });

});