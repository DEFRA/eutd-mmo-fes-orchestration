import * as Hapi from "@hapi/hapi";
import Services from "../services/commodity.service";
import CommodityController from "./commodity.controller";

describe("CommodityController.searchCC()", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      redirect: "/test-url/{documentNumber}/test",
    },
    headers: { accept: "text/html" },
  };
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockSearchCC: jest.SpyInstance;
  let mockResponse: jest.SpyInstance;
  let mockRedirect: jest.SpyInstance;

  beforeAll(() => {
    mockSearchCC = jest.spyOn(Services, "searchCC");
    mockSearchCC.mockReturnValue("mock searchCC result");
    mockResponse = jest.spyOn(h, "response");
    mockResponse.mockReturnValue("mock response");
    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue("mock redirect");
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it("should redirect when mime type is text/html", async () => {
    const result = await CommodityController.searchCC(mockReq, h);
    const expectedResult = "mock redirect";
    expect(result).toEqual(expectedResult);
  });

  it("should return a response when mime type is not text/html", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await CommodityController.searchCC(mockReq, h);
    const expectedResult = "mock response";
    expect(result).toEqual(expectedResult);
  });
});
