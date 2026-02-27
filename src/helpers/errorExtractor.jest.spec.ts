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

  it("buildErrorObject() should handle exportDate date.min validation for different transport types", () => {
    const testCases = [
      { transportType: "plane", expectedError: "error.plane.exportDate.any.min" },
      { transportType: "truck", expectedError: "error.truck.exportDate.any.min" },
      { transportType: "train", expectedError: "error.train.exportDate.any.min" },
      { transportType: "containerVessel", expectedError: "error.containerVessel.exportDate.any.min" },
    ];

    testCases.forEach(({ transportType, expectedError }) => {
      const data = {
        details: [{ type: "date.min", path: ["exportDate"] }],
        _original: { vehicle: transportType },
      };

      const result = buildErrorObject(data);

      const expectedResult = { exportDate: expectedError };
      expect(result).toEqual(expectedResult);
    });
  });

  it("buildRedirectUrlWithErrorStringInQueryParam() should handle redirectTo without existing query string", () => {
    const errorDetailsObj = { error: "some error" };
    const redirectTo = "/home";

    const result = buildRedirectUrlWithErrorStringInQueryParam(errorDetailsObj, redirectTo);

    expect(result).toEqual(`/home?error=${JSON.stringify(errorDetailsObj)}`);
  });

  it("buildErrorObject() should handle containerNumbers string.pattern.base for plane transport", () => {
    const data = {
      details: [{ type: "string.pattern.base", path: ["containerNumbers"] }],
      _original: { vehicle: "plane" },
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ containerNumbers: "ccAddTransportationDetailsContainerIdentificationNumberOnlyNumLettersError" });
  });

  it("buildErrorObject() should handle containerNumbers string.pattern.base for containerVessel transport", () => {
    const data = {
      details: [{ type: "string.pattern.base", path: ["containerNumbers"] }],
      _original: { vehicle: "containerVessel" },
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ containerNumbers: "ccShippingContainerNumberPatternError" });
  });

  it("buildErrorObject() should handle containerNumbers string.pattern.base for unknown transport (fallback)", () => {
    const data = {
      details: [{ type: "string.pattern.base", path: ["containerNumbers"] }],
      _original: { vehicle: "truck" },
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ containerNumbers: "error.containerNumbers.string.pattern.base" });
  });

  it("buildErrorObject() should use custom message token when provided for a path detail", () => {
    const data = {
      details: [{ type: "any.required", path: ["vesselName"], message: "customTokenKey" }],
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ vesselName: "customTokenKey" });
  });

  it("buildErrorObject() should use custom message token for zero-length path with context label", () => {
    const data = {
      details: [{ type: "any.required", path: [], message: "customLabelToken", context: { label: "myField" } }],
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ myField: "customLabelToken" });
  });

  it("buildErrorObject() should build standard error key for zero-length path with context label and no custom token", () => {
    const data = {
      details: [{ type: "any.required", path: [], message: "not a token! has spaces", context: { label: "myField" } }],
    };

    const result = buildErrorObject(data);

    expect(result).toEqual({ myField: "error.myField.any.required" });
  });

  it("buildNonJsErrorObject() should handle null standardError", () => {
    const njError = {
      transportDetails: [{ field: "title", value: "title-value" }],
    };

    const result = buildNonJsErrorObject(null, njError);

    expect(result).toEqual({ njEdit: "true", title: "title-value" });
  });

  it("buildNonJsErrorObject() should handle njError without transportDetails", () => {
    const standardError = {
      details: [{ type: "info", path: ["src"] }],
    };

    const result = buildNonJsErrorObject(standardError, { transportDetails: undefined });

    expect(result).toEqual({ src: "error.src.info" });
  });

  it("buildNonJsErrorObject() should handle both null standardError and null njError", () => {
    const result = buildNonJsErrorObject(null, null);

    expect(result).toEqual({});
  });
});
