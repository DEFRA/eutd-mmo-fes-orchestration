import Services from "../services/presentationState.service";
import PresentationStateController from "./presentationState.controller";
import * as Hapi from "@hapi/hapi";

describe("PresentationStateController.getPS()", () => {
  const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      redirect: "/test-url/{documentNumber}/test",
      dashboardUri: "/test-url/dashboardUri",
      currentUri: "/test-url/currentUri",
      nextUri: "/test-url/nextUri",
      user_id: USER_ID,
      cancel: {},
      commodity_code: "commodity-code",
      commodity_code_description: "commodity-code-description",
      presentationLabel: "Whole",
      stateLabel: "Fresh",
    },
    headers: { accept: "text/html" },
  };
  const h = {
    response: () => jest.fn(),
    redirect: () => jest.fn(),
  } as unknown as Hapi.ResponseToolkit<Hapi.ReqRefDefaults>;

  let mockServicesGetPS: jest.SpyInstance;
  let mockRedirect: jest.SpyInstance;

  beforeAll(() => {
    mockServicesGetPS = jest.spyOn(Services, "getPS");
    mockServicesGetPS.mockReturnValue(null);
    mockRedirect = jest.spyOn(h, "redirect");
    mockRedirect.mockReturnValue(null);
  });

  afterAll(() => {
    jest.resetAllMocks();
  })

  it("should redirect with the correct param", async () => {
    await PresentationStateController.getPS(mockReq, h);
    expect(mockRedirect).toHaveBeenCalledWith(mockReq.payload.redirect);
  });

  it("should return the results", async () => {
    mockReq.headers.accept = "application/pdf";
    const result = await PresentationStateController.getPS(mockReq, h);
    expect(result).toBeNull();
  });
});
