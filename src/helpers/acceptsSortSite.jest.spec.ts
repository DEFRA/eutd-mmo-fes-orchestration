import acceptsSortSite from "./acceptsSortSite";

describe("acceptsSortSite", () => {

  it("should return true when accept headers has valid mime types", () => {
    const headers = { accept: "text, application/x-ms-application, application/x-ms-xbap" };
    const result: boolean = acceptsSortSite(headers)
    expect(result).toBeTruthy();
  });

  it("should return false when accept headers are missing", () => {
    const headers = { "host": "localhost:8080" };
    const result: boolean = acceptsSortSite(headers)
    expect(result).toBeFalsy();
  });

});
