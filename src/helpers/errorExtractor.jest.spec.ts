import buildErrorObject, {
  buildNonJsErrorObject,
  buildRedirectUrlWithErrorStringInQueryParam,
} from "./errorExtractor";

describe("errorExtractor", () => {
  it("buildRedirectUrlWithErrorStringInQueryParam() should return a valid response", () => {
    const errorDetailsObj = { error: { title: "title", message: "message" } };
    const redirectTo = "/home?why=not";

    const result = buildRedirectUrlWithErrorStringInQueryParam(
      errorDetailsObj,
      redirectTo
    );

    const expectedResult =
      redirectTo +
      "&error=%7B%22error%22%3A%7B%22title%22%3A%22title%22%2C%22message%22%3A%22message%22%7D%7D";
    expect(result).toEqual(expectedResult);
  });

  it("buildErrorObject() should return a valid error object", () => {
    const data = {
      details: [{ type: "info", path: ["src", "home"] }],
    };

    const result = buildErrorObject(data);

    const expectedResult = { "src.home": "error.src.home.info" };
    expect(result).toEqual(expectedResult);
  });

  it("buildNonJsErrorObject() should return a valid error object", () => {
    const errorDetailsObj = {
      details: [{ type: "info", path: ["src", "home"] }],
    };
    const njError = {
      transportDetails: [{ field: "title", value: "title-value" }],
    };

    const result = buildNonJsErrorObject(errorDetailsObj, njError);

    const expectedResult = {
      njEdit: "true",
      "src.home": "error.src.home.info",
      title: "title-value",
    };
    expect(result).toEqual(expectedResult);
  });

  it("buildErrorObject() should handle containerNumbers array.min validation", () => {
    const data = {
      details: [{ type: "array.min", path: ["containerNumbers"] }],
    };

    const result = buildErrorObject(data);

    const expectedResult = { "containerNumbers.0": "error.containerNumbers.array.min" };
    expect(result).toEqual(expectedResult);
  });
});
